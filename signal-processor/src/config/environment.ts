/**
 * Environment Configuration - Centralized config management
 */

import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  // Firebase
  firebase: {
    projectId: string;
    serviceAccountPath: string;
  };
  
  // Google AI
  google: {
    apiKey: string;
  };
  
  // Telegram
  telegram: {
    botToken: string;
    chatId: string;
  };
  
  // News APIs
  news: {
    alphaVantageApiKey: string;
    newsApiKey: string;
  };
  
  // Application
  app: {
    nodeEnv: 'development' | 'production' | 'test';
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    maxConcurrentSignals: number;
  };
  
  // Timeouts
  timeouts: {
    signalProcessing: number;
    newsFetch: number;
    aiAnalysis: number;
    telegramSend: number;
  };
}

class EnvironmentValidator {
  static validate(): EnvironmentConfig {
    const errors: string[] = [];
    
    // Required environment variables
    const requiredVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
      ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
      NEWS_API_KEY: process.env.NEWS_API_KEY
    };
    
    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value || value.trim() === '') {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }
    
    return {
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || 
          join(__dirname, '../../config/firebase-service-account.json')
      },
      google: {
        apiKey: process.env.GOOGLE_API_KEY!
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN!,
        chatId: process.env.TELEGRAM_CHAT_ID!
      },
      news: {
        alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY!,
        newsApiKey: process.env.NEWS_API_KEY!
      },
      app: {
        nodeEnv: (process.env.NODE_ENV as any) || 'development',
        logLevel: (process.env.LOG_LEVEL as any) || 'info',
        maxConcurrentSignals: parseInt(process.env.MAX_CONCURRENT_SIGNALS || '5')
      },
      timeouts: {
        signalProcessing: parseInt(process.env.SIGNAL_PROCESSING_TIMEOUT || '30000'),
        newsFetch: parseInt(process.env.NEWS_FETCH_TIMEOUT || '5000'),
        aiAnalysis: parseInt(process.env.AI_ANALYSIS_TIMEOUT || '20000'),
        telegramSend: parseInt(process.env.TELEGRAM_SEND_TIMEOUT || '10000')
      }
    };
  }
}

// Export validated configuration
export const config = EnvironmentValidator.validate();

// Hot reload support for development
if (config.app.nodeEnv === 'development') {
  // Watch for .env file changes and reload configuration
  const fs = require('fs');
  const envPath = join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    fs.watchFile(envPath, () => {
      console.log('🔄 Environment file changed, reloading configuration...');
      dotenv.config({ override: true });
      // Note: Full config reload would require application restart
    });
  }
}