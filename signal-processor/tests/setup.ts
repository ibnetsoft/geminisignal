/**
 * Jest test setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.GOOGLE_API_KEY = 'test-key';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat';
process.env.ALPHA_VANTAGE_API_KEY = 'test-alpha-key';
process.env.NEWS_API_KEY = 'test-news-key';

// Mock Firebase Admin SDK
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn()
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] }))
      }))
    }))
  }))
}));

// Set test timeout
jest.setTimeout(30000);