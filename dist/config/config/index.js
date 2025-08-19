"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRADING_CONFIG = exports.TELEGRAM_CONFIG = exports.API_KEYS = exports.SERVER_CONFIG = void 0;
// config/index.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 서버 설정
exports.SERVER_CONFIG = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
    webhookUrl: 'https://signal-analyzer-998088574360.asia-northeast3.run.app/webhook'
};
// API 키들
exports.API_KEYS = {
    alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
    finnhub: process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY',
    marketaux: process.env.MARKETAUX_API_KEY || 'YOUR_MARKETAUX_API_KEY',
    googleAI: process.env.GOOGLE_API_KEY,
    telegramBot: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_API_TOKEN'
};
// 텔레그램 설정
exports.TELEGRAM_CONFIG = {
    chatId: process.env.TELEGRAM_CHAT_ID || '-1002839326466'
};
// 거래 시스템 설정
exports.TRADING_CONFIG = {
    enabled: process.env.ENABLE_TRADING_SYSTEM === 'true',
    signalCriteria: {
        minConfidence: parseFloat(process.env.MIN_CONFIDENCE || '0.75'),
        allowedRecommendations: ['enter_trade'],
        maxRiskLevel: process.env.MAX_RISK_LEVEL || 'medium'
    }
};
// ❌ 이 줄 삭제 (utils에서 관리)
// export const VALID_SYMBOLS = ['HKG33', 'USOUSD', 'BTCUSD', 'XAUUSD', 'EURUSD', 'NAS100'];
