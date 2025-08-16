/**
 * Signal Processor Main Entry Point
 * External Signal Processing Microservice
 */

import express from 'express';
import { firebaseConfig } from './config/firebase';
import { logger } from './utils/logger';
import { config } from './config/environment';
import { SignalWatcher } from './services/signalWatcher';
import { NewsService } from './services/newsService';
import { GeminiAnalyzer } from './services/geminiAnalyzer';
import { TelegramService } from './services/telegramService';

class SignalProcessor {
  private signalWatcher!: SignalWatcher;
  private newsService!: NewsService;
  private geminiAnalyzer!: GeminiAnalyzer;
  private telegramService!: TelegramService;
  private app: express.Application;
  private server: any;
  private isRunning = false;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json(this.getHealthStatus());
    });

    // Status endpoint
    this.app.get('/status', (req, res) => {
      res.json({
        message: 'Signal Processor is running',
        ...this.getHealthStatus()
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'External Signal Processor',
        version: '1.0.0',
        status: this.isRunning ? 'running' : 'stopped'
      });
    });
  }
  
  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Initializing Signal Processor...', {
        version: '1.0.0',
        nodeEnv: config.app.nodeEnv,
        projectId: config.firebase.projectId
      });
      
      // Initialize Firebase
      await firebaseConfig.initialize();
      logger.info('✅ Firebase initialized');
      
      // Initialize services
      this.newsService = new NewsService();
      await this.newsService.initialize();
      logger.info('✅ News Service initialized');
      
      this.geminiAnalyzer = new GeminiAnalyzer();
      await this.geminiAnalyzer.initialize();
      logger.info('✅ Gemini Analyzer initialized');
      
      this.telegramService = new TelegramService();
      await this.telegramService.initialize();
      logger.info('✅ Telegram Service initialized');
      
      // Initialize signal watcher (this will start monitoring)
      this.signalWatcher = new SignalWatcher(
        this.newsService,
        this.geminiAnalyzer,
        this.telegramService
      );
      await this.signalWatcher.initialize();
      logger.info('✅ Signal Watcher initialized');
      
      logger.info('🎉 Signal Processor fully initialized and ready');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Signal Processor', error);
      throw error;
    }
  }
  
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Signal Processor is already running');
      return;
    }
    
    try {
      await this.initialize();
      
      // Start HTTP server
      const port = process.env.PORT || 8080;
      this.server = this.app.listen(port, () => {
        logger.info(`🌐 HTTP server listening on port ${port}`);
      });

      // Start monitoring signals
      await this.signalWatcher.startMonitoring();
      this.isRunning = true;
      
      logger.info('🔄 Signal Processor started - monitoring for signals...');
      
      // Send startup notification
      await this.telegramService.sendStartupNotification();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('❌ Failed to start Signal Processor', error);
      process.exit(1);
    }
  }
  
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    logger.info('🛑 Stopping Signal Processor...');
    
    try {
      // Send shutdown notification
      if (this.telegramService?.isInitialized()) {
        await this.telegramService.sendShutdownNotification();
      }

      if (this.signalWatcher) {
        await this.signalWatcher.stopMonitoring();
      }

      if (this.server) {
        this.server.close();
        logger.info('🌐 HTTP server closed');
      }
      
      this.isRunning = false;
      logger.info('✅ Signal Processor stopped gracefully');
      
    } catch (error) {
      logger.error('❌ Error during shutdown', error);
    }
  }
  
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`📢 Received ${signal}, initiating graceful shutdown...`);
      await this.stop();
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception', error);
      shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection', { reason, promise });
      shutdown('unhandledRejection');
    });
  }
  
  getHealthStatus() {
    return {
      status: this.isRunning ? 'running' : 'stopped',
      timestamp: new Date().toISOString(),
      services: {
        signalWatcher: this.signalWatcher?.isMonitoring() || false,
        newsService: this.newsService?.isInitialized() || false,
        geminiAnalyzer: this.geminiAnalyzer?.isInitialized() || false,
        telegramService: this.telegramService?.isInitialized() || false
      },
      config: {
        nodeEnv: config.app.nodeEnv,
        logLevel: config.app.logLevel,
        maxConcurrentSignals: config.app.maxConcurrentSignals
      }
    };
  }
}

// Create and start the processor
const processor = new SignalProcessor();

// Start if this file is run directly
if (require.main === module) {
  processor.start().catch((error) => {
    logger.error('💥 Failed to start Signal Processor', error);
    process.exit(1);
  });
}

export default processor;