const functions = require('firebase-functions');

// 간단한 테스트 함수
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.json({
    message: 'Hello from Firebase Functions!',
    timestamp: new Date().toISOString(),
    project: 'pipmaker-signals'
  });
});

// Health check 함수
exports.health = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    service: 'NP Signal Trading Platform',
    timestamp: new Date().toISOString()
  });
});