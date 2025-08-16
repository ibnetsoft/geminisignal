// SignalWatcher만 실행하는 최소 서버
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 환경변수 로드
require('dotenv').config({ path: './env.local' });

// Firebase Admin 초기화
if (!admin.apps.length) {
  try {
    if (process.env.FUNCTIONS_EMULATOR || process.env.K_SERVICE) {
      admin.initializeApp();
      console.log('✅ Firebase Admin 자동 초기화 완료 (Functions 환경)');
    } else {
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './ServiceKey/ServiceKey/pipmaker-signals-firebase-adminsdk-fbsvc-76cad20460.json';
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://pipmaker-signals-default-rtdb.firebaseio.com"
      });
      
      console.log('✅ Firebase Admin 수동 초기화 완료 (로컬 환경)');
    }
  } catch (error) {
    console.error('❌ Firebase Admin 초기화 실패:', error.message);
  }
}

// Services
const SignalWatcher = require('./services/signalWatcher');

// Express 앱 초기화
const app = express();

app.use(cors());
app.use(express.json());

// 건강 상태 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'NP Signal Trading Platform - SignalWatcher Only',
    version: '1.0.0'
  });
});

// Signal Watcher 인스턴스
let signalWatcher = null;

// Signal Watcher 상태 체크 엔드포인트
app.get('/api/signal-watcher/status', (req, res) => {
  if (!signalWatcher) {
    return res.json({ 
      status: 'not_initialized',
      message: 'Signal Watcher not started'
    });
  }
  
  const status = signalWatcher.getStatus();
  res.json({
    status: 'active',
    ...status,
    timestamp: new Date().toISOString()
  });
});

// Signal Watcher 시작 엔드포인트
app.post('/api/signal-watcher/start', async (req, res) => {
  try {
    if (signalWatcher && signalWatcher.getStatus().is_running) {
      return res.json({ 
        success: false, 
        message: 'Signal Watcher is already running' 
      });
    }

    signalWatcher = new SignalWatcher();
    await signalWatcher.startWatching();
    
    console.log('🎯 Signal Watcher 수동 시작 완료');
    
    res.json({ 
      success: true, 
      message: 'Signal Watcher started successfully',
      status: signalWatcher.getStatus()
    });
  } catch (error) {
    console.error('❌ Signal Watcher 시작 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start Signal Watcher',
      error: error.message
    });
  }
});

// Signal Watcher 중지 엔드포인트
app.post('/api/signal-watcher/stop', (req, res) => {
  try {
    if (!signalWatcher) {
      return res.json({ 
        success: false, 
        message: 'Signal Watcher is not running' 
      });
    }

    signalWatcher.stopWatching();
    signalWatcher = null;
    
    console.log('🛑 Signal Watcher 수동 중지 완료');
    
    res.json({ 
      success: true, 
      message: 'Signal Watcher stopped successfully' 
    });
  } catch (error) {
    console.error('❌ Signal Watcher 중지 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to stop Signal Watcher',
      error: error.message
    });
  }
});

// Signal Watcher 자동 시작
async function initializeServices() {
  try {
    console.log('🚀 Signal Watcher 자동 시작 중...');
    
    signalWatcher = new SignalWatcher();
    await signalWatcher.startWatching();
    
    console.log('✅ Signal Watcher 자동 시작 완료');
  } catch (error) {
    console.error('❌ Signal Watcher 초기화 실패:', error);
  }
}

// 로컬 개발용 서버 시작
if (!process.env.FUNCTIONS_EMULATOR) {
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, async () => {
    console.log(`🚀 NP Signal Trading Platform - SignalWatcher Only`);
    console.log(`📡 포트: ${PORT}`);
    console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ 시작 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
    
    await initializeServices();
  });
}

// 앱 종료 시 정리
process.on('SIGINT', () => {
  console.log('🛑 서버 종료 신호 수신...');
  
  if (signalWatcher) {
    console.log('🔄 Signal Watcher 정리 중...');
    signalWatcher.stopWatching();
  }
  
  console.log('✅ 서버 정리 완료');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 서버 종료 요청...');
  
  if (signalWatcher) {
    console.log('🔄 Signal Watcher 정리 중...');
    signalWatcher.stopWatching();
  }
  
  console.log('✅ 서버 정리 완료');
  process.exit(0);
});

// Firebase Functions v2 (2nd Gen) 방식 
const { onRequest } = require('firebase-functions/v2/https');

exports.api = onRequest(async (req, res) => {
  // 첫 요청 시에만 서비스 초기화
  if (!signalWatcher) {
    await initializeServices();
  }
  
  return app(req, res);
});

// Health check 함수
exports.health = onRequest((req, res) => {
  res.json({
    status: 'healthy',
    service: 'NP Signal Trading Platform - SignalWatcher',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// SignalWatcher 상태 체크 함수
exports.signalStatus = onRequest(async (req, res) => {
  try {
    if (!signalWatcher) {
      await initializeServices();
    }
    
    const status = signalWatcher ? signalWatcher.getStatus() : { status: 'not_initialized' };
    res.json({
      ...status,
      timestamp: new Date().toISOString(),
      service: 'SignalWatcher'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// For local development, export the app
if (!process.env.FUNCTIONS_EMULATOR && !process.env.K_SERVICE) {
  module.exports = app;
}