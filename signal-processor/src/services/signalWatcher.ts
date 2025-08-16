/**
 * SignalWatcher Service - Firestore signal monitoring
 */

import { firebaseConfig } from '../config/firebase';
import { createLogger } from '../utils/logger';
import { config } from '../config/environment';
import { NewsService } from './newsService';
import { GeminiAnalyzer } from './geminiAnalyzer';
import { TelegramService } from './telegramService';
import { Signal, SignalValidator } from '../models/Signal';
import { ProcessingMetrics } from '../models/AnalysisResult';

const logger = createLogger('signal-watcher');

interface ProcessingQueue {
  signal: Signal;
  timestamp: Date;
  retryCount: number;
}

export class SignalWatcher {
  private isInitialized = false;
  private monitoring = false;
  private unsubscribe: (() => void) | null = null;
  private processingQueue: ProcessingQueue[] = [];
  private isProcessing = false;
  private maxConcurrentProcessing: number;
  private activeProcessing = 0;
  private processedSignalIds = new Set<string>();

  constructor(
    private newsService: NewsService,
    private geminiAnalyzer: GeminiAnalyzer,
    private telegramService: TelegramService
  ) {
    this.maxConcurrentProcessing = config.app.maxConcurrentSignals;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing SignalWatcher...');
      
      // Verify services are initialized
      if (!this.newsService.isInitialized()) {
        throw new Error('NewsService not initialized');
      }
      if (!this.geminiAnalyzer.isInitialized()) {
        throw new Error('GeminiAnalyzer not initialized');
      }
      if (!this.telegramService.isInitialized()) {
        throw new Error('TelegramService not initialized');
      }
      
      this.isInitialized = true;
      logger.info('SignalWatcher initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize SignalWatcher', error);
      throw error;
    }
  }

  async startMonitoring(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SignalWatcher not initialized');
    }
    
    if (this.monitoring) {
      logger.warn('Signal monitoring is already active');
      return;
    }
    
    try {
      logger.info('Starting Firestore signal monitoring...');
      
      const firestore = firebaseConfig.getFirestore();
      const signalsCollection = firestore.collection('signals');
      
      // Set up real-time listener for new signals
      this.unsubscribe = signalsCollection
        .where('processed', '==', false)
        .where('processingStatus', 'in', ['pending', null])
        .orderBy('timestamp', 'asc')
        .onSnapshot(
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                this.handleNewSignal(change.doc);
              }
            });
          },
          (error) => {
            logger.error('Firestore listener error', error);
            this.handleListenerError(error);
          }
        );
      
      this.monitoring = true;
      
      // Start processing queue worker
      this.startQueueProcessor();
      
      // Also check for any existing unprocessed signals
      await this.checkExistingSignals();
      
      logger.info('Signal monitoring started successfully');
      
    } catch (error) {
      logger.error('Failed to start signal monitoring', error);
      throw error;
    }
  }

  private async handleNewSignal(doc: FirebaseFirestore.DocumentSnapshot): Promise<void> {
    try {
      const data = doc.data();
      if (!data) {
        logger.warn('Received empty signal document', { docId: doc.id });
        return;
      }
      
      // Prevent duplicate processing
      if (this.processedSignalIds.has(doc.id)) {
        logger.debug('Signal already processed or in queue', { docId: doc.id });
        return;
      }
      
      // Validate signal data
      const validationResult = SignalValidator.validate({
        ...data,
        id: doc.id
      });
      
      if (!validationResult.isValid) {
        logger.error('Invalid signal data', {
          docId: doc.id,
          errors: validationResult.errors
        });
        await this.markSignalAsFailed(doc.id, validationResult.errors.join(', '));
        return;
      }
      
      const signal = validationResult.normalizedSignal!;
      
      // Add to processing queue
      this.processingQueue.push({
        signal,
        timestamp: new Date(),
        retryCount: 0
      });
      
      this.processedSignalIds.add(doc.id);
      
      logger.info('New signal added to processing queue', {
        signalId: signal.id,
        symbol: signal.symbol,
        action: signal.action,
        queueLength: this.processingQueue.length
      });
      
    } catch (error) {
      logger.error('Error handling new signal', { docId: doc.id, error });
    }
  }

  private async checkExistingSignals(): Promise<void> {
    try {
      logger.info('Checking for existing unprocessed signals...');
      
      const firestore = firebaseConfig.getFirestore();
      const snapshot = await firestore
        .collection('signals')
        .where('processed', '==', false)
        .where('processingStatus', 'in', ['pending', null])
        .orderBy('timestamp', 'asc')
        .limit(50) // Process max 50 existing signals
        .get();
      
      if (snapshot.empty) {
        logger.info('No existing unprocessed signals found');
        return;
      }
      
      logger.info(`Found ${snapshot.size} existing unprocessed signals`);
      
      snapshot.docs.forEach((doc) => {
        this.handleNewSignal(doc);
      });
      
    } catch (error) {
      logger.error('Error checking existing signals', error);
    }
  }

  private async startQueueProcessor(): Promise<void> {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    // Process queue continuously
    setInterval(async () => {
      if (this.processingQueue.length === 0 || 
          this.activeProcessing >= this.maxConcurrentProcessing) {
        return;
      }
      
      // Process signals from queue
      while (this.processingQueue.length > 0 && 
             this.activeProcessing < this.maxConcurrentProcessing) {
        const item = this.processingQueue.shift();
        if (item) {
          this.processSignal(item).catch((error) => {
            logger.error('Error processing signal from queue', error);
          });
        }
      }
    }, 1000); // Check queue every second
  }

  private async processSignal(item: ProcessingQueue): Promise<void> {
    const { signal, retryCount } = item;
    const startTime = new Date();
    
    const metrics: ProcessingMetrics = {
      signalId: signal.id,
      startTime,
      status: 'processing',
      steps: {
        signalValidation: { duration: 0, success: false },
        newsRetrieval: { duration: 0, success: false },
        aiAnalysis: { duration: 0, success: false },
        telegramSend: { duration: 0, success: false }
      }
    };
    
    this.activeProcessing++;
    
    try {
      logger.info('Processing signal', {
        signalId: signal.id,
        symbol: signal.symbol,
        action: signal.action,
        retryCount
      });
      
      // Update signal status in Firestore
      await this.updateSignalStatus(signal.id, 'processing');
      
      // Step 1: Signal already validated
      metrics.steps.signalValidation = {
        duration: Date.now() - startTime.getTime(),
        success: true
      };
      
      // Step 2: Fetch relevant news
      const newsStartTime = Date.now();
      const newsData = await this.newsService.fetchNewsForSignal(signal);
      metrics.steps.newsRetrieval = {
        duration: Date.now() - newsStartTime,
        success: true,
        newsCount: newsData?.length || 0
      };
      
      // Step 3: Analyze with Gemini AI
      const analysisStartTime = Date.now();
      const analysisResult = await this.geminiAnalyzer.analyzeSignal(signal, newsData);
      metrics.steps.aiAnalysis = {
        duration: Date.now() - analysisStartTime,
        success: true
      };
      
      // Step 4: Send to Telegram
      const telegramStartTime = Date.now();
      await this.telegramService.sendAnalysis(analysisResult);
      metrics.steps.telegramSend = {
        duration: Date.now() - telegramStartTime,
        success: true
      };
      
      // Mark signal as processed
      await this.markSignalAsProcessed(signal.id, analysisResult);
      
      // Update metrics
      metrics.endTime = new Date();
      metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
      metrics.status = 'completed';
      
      // Save metrics
      await this.saveProcessingMetrics(metrics);
      
      logger.info('Signal processed successfully', {
        signalId: signal.id,
        duration: metrics.duration,
        symbol: signal.symbol
      });
      
    } catch (error) {
      logger.error('Error processing signal', {
        signalId: signal.id,
        error,
        retryCount
      });
      
      metrics.status = 'failed';
      metrics.errors = [error instanceof Error ? error.message : String(error)];
      
      // Retry logic
      if (retryCount < 3) {
        logger.info('Retrying signal processing', {
          signalId: signal.id,
          retryCount: retryCount + 1
        });
        
        // Add back to queue with increased retry count
        setTimeout(() => {
          this.processingQueue.push({
            signal,
            timestamp: new Date(),
            retryCount: retryCount + 1
          });
        }, Math.pow(2, retryCount + 1) * 1000); // Exponential backoff
        
      } else {
        // Max retries reached, mark as failed
        await this.markSignalAsFailed(
          signal.id, 
          `Processing failed after ${retryCount} retries: ${error}`
        );
      }
      
    } finally {
      this.activeProcessing--;
    }
  }

  private async updateSignalStatus(
    signalId: string, 
    status: 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    try {
      const firestore = firebaseConfig.getFirestore();
      await firestore.collection('signals').doc(signalId).update({
        processingStatus: status,
        lastUpdated: new Date()
      });
    } catch (error) {
      logger.error('Failed to update signal status', { signalId, status, error });
    }
  }

  private async markSignalAsProcessed(signalId: string, analysisResult: any): Promise<void> {
    try {
      const firestore = firebaseConfig.getFirestore();
      
      // Update signal document
      await firestore.collection('signals').doc(signalId).update({
        processed: true,
        processingStatus: 'completed',
        processedAt: new Date(),
        analysisResultId: analysisResult.id
      });
      
      // Save analysis result
      await firestore.collection('analysis_results').doc(analysisResult.id).set({
        ...analysisResult,
        signalId,
        createdAt: new Date()
      });
      
    } catch (error) {
      logger.error('Failed to mark signal as processed', { signalId, error });
      throw error;
    }
  }

  private async markSignalAsFailed(signalId: string, error: string): Promise<void> {
    try {
      const firestore = firebaseConfig.getFirestore();
      await firestore.collection('signals').doc(signalId).update({
        processed: true,
        processingStatus: 'failed',
        error,
        failedAt: new Date()
      });
      
      // Also send error notification to Telegram
      await this.telegramService.sendError(signalId, error);
      
    } catch (err) {
      logger.error('Failed to mark signal as failed', { signalId, error: err });
    }
  }

  private async saveProcessingMetrics(metrics: ProcessingMetrics): Promise<void> {
    try {
      const firestore = firebaseConfig.getFirestore();
      await firestore.collection('processing_metrics').add({
        ...metrics,
        createdAt: new Date()
      });
    } catch (error) {
      logger.error('Failed to save processing metrics', error);
    }
  }

  private handleListenerError(error: any): void {
    logger.error('Firestore listener encountered an error', error);
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      logger.info('Attempting to reconnect Firestore listener...');
      this.stopMonitoring().then(() => {
        this.startMonitoring().catch((err) => {
          logger.error('Failed to restart monitoring', err);
        });
      });
    }, 5000); // Retry after 5 seconds
  }

  async stopMonitoring(): Promise<void> {
    logger.info('Stopping signal monitoring...');
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.monitoring = false;
    this.isProcessing = false;
    
    // Clear processing queue
    this.processingQueue = [];
    this.processedSignalIds.clear();
    
    logger.info('Signal monitoring stopped');
  }

  isMonitoring(): boolean {
    return this.monitoring;
  }

  getQueueStatus() {
    return {
      queueLength: this.processingQueue.length,
      activeProcessing: this.activeProcessing,
      maxConcurrent: this.maxConcurrentProcessing,
      processedCount: this.processedSignalIds.size
    };
  }
}