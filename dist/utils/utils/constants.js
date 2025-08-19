"use strict";
// utils/constants.ts
// 프로젝트에서 사용하는 모든 상수들을 여기에 정의
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = exports.COLLECTIONS = exports.MESSAGE_TEMPLATES = exports.TIME_CONSTANTS = exports.TRADING_LIMITS = exports.TRADE_STATUS = exports.API_STATUS = exports.RISK_LEVELS = exports.CONFIDENCE_LEVELS = exports.SIGNAL_TYPES = exports.VALID_SYMBOLS = void 0;
// 지원 거래 심볼
exports.VALID_SYMBOLS = [
    'HKG33', 'USOUSD', 'BTCUSD', 'XAUUSD', 'EURUSD', 'NAS100'
];
// 신호 타입
exports.SIGNAL_TYPES = {
    BUY: 'buy',
    SELL: 'sell',
    HOLD: 'hold'
};
// 신뢰도 레벨
exports.CONFIDENCE_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    VERY_HIGH: 'very_high'
};
// 리스크 레벨
exports.RISK_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};
// API 응답 상태
exports.API_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending'
};
// 거래 실행 상태
exports.TRADE_STATUS = {
    PENDING: 'pending',
    EXECUTED: 'executed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};
// 최소/최대 값들
exports.TRADING_LIMITS = {
    MIN_CONFIDENCE: 75,
    MAX_RISK_PER_TRADE: 0.02, // 2%
    MIN_LOT_SIZE: 0.01,
    MAX_LOT_SIZE: 10.0
};
// 시간 관련 상수
exports.TIME_CONSTANTS = {
    SIGNAL_TIMEOUT_MS: 30 * 60 * 1000, // 30분
    API_RATE_LIMIT_MS: 1000, // 1초
    RECONNECT_DELAY_MS: 5000 // 5초
};
// 메시지 템플릿
exports.MESSAGE_TEMPLATES = {
    SIGNAL_RECEIVED: '📊 새로운 거래 신호를 받았습니다',
    ANALYSIS_COMPLETE: '✅ 분석이 완료되었습니다',
    TRADE_EXECUTED: '🚀 거래가 실행되었습니다',
    ERROR_OCCURRED: '❌ 오류가 발생했습니다'
};
// Firebase 컬렉션 이름
exports.COLLECTIONS = {
    SIGNALS: 'signals',
    ANALYSES: 'signal_analyses',
    TRADES: 'trade_executions',
    ACCOUNTS: 'trading_accounts',
    USERS: 'users'
};
// API 엔드포인트
exports.API_ENDPOINTS = {
    ANALYZE_SIGNALS: '/analyze/signals',
    TRADING_STATUS: '/trading/status',
    WEBHOOK: '/webhook'
};
