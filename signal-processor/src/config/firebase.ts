/**
 * Firebase Configuration - Firestore admin setup
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from './environment';
import { createLogger } from '../utils/logger';

const logger = createLogger('firebase-config');

export class FirebaseConfig {
  private static instance: FirebaseConfig;
  private firestore: FirebaseFirestore.Firestore | null = null;
  
  private constructor() {}
  
  static getInstance(): FirebaseConfig {
    if (!FirebaseConfig.instance) {
      FirebaseConfig.instance = new FirebaseConfig();
    }
    return FirebaseConfig.instance;
  }
  
  async initialize(): Promise<void> {
    try {
      // Check if Firebase app is already initialized
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(config.firebase.serviceAccountPath),
          projectId: config.firebase.projectId
        });
        
        logger.info('Firebase app initialized', { 
          projectId: config.firebase.projectId 
        });
      } else {
        logger.info('Firebase app already initialized');
      }
      
      this.firestore = getFirestore();
      
      // Test Firestore connection
      await this.testConnection();
      
    } catch (error) {
      logger.error('Failed to initialize Firebase', error);
      throw error;
    }
  }
  
  getFirestore(): FirebaseFirestore.Firestore {
    if (!this.firestore) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.firestore;
  }
  
  private async testConnection(): Promise<void> {
    try {
      if (!this.firestore) {
        throw new Error('Firestore not initialized');
      }
      
      // Try to read from a test collection to verify connection
      await this.firestore.collection('_health').limit(1).get();
      logger.info('Firestore connection test successful');
      
    } catch (error) {
      logger.warn('Firestore connection test failed', error);
      // Don't throw here - some read permissions might be restricted
    }
  }
  
  async getSignalsCollection() {
    const firestore = this.getFirestore();
    return firestore.collection('signals');
  }
  
  async getAnalysisResultsCollection() {
    const firestore = this.getFirestore();
    return firestore.collection('analysis_results');
  }
  
  async getProcessingMetricsCollection() {
    const firestore = this.getFirestore();
    return firestore.collection('processing_metrics');
  }
}

// Export singleton instance
export const firebaseConfig = FirebaseConfig.getInstance();