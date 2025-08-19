"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEmaCrossStrategy = void 0;
// services/tradingService.ts
const axios_1 = __importDefault(require("axios"));
// Python 서비스의 기본 URL (환경 변수에서 가져오는 것이 이상적)
const PYTHON_SERVICE_URL = process.env.PYTHON_TRADING_SERVICE_URL || 'http://localhost:8000';
/**
 * Nautilus Trader 파이썬 서비스를 호출하여
 * EMA 교차 전략을 시작합니다.
 */
const startEmaCrossStrategy = async (params) => {
    try {
        console.log('📤 EMA 교차 전략 시작 요청:', params);
        // Python API에 보낼 요청 본문 구성
        const requestBody = {
            strategy_id: `ema_cross_${params.instrumentId}_${new Date().getTime()}`,
            config: {
                instrument_id: params.instrumentId,
                bar_spec: params.barSpec,
                trade_size: params.tradeSize,
                fast_ema_period: params.fastEmaPeriod,
                slow_ema_period: params.slowEmaPeriod,
                // 콜백 URL은 Python 서비스가 Node.js로 상태를 업데이트할 때 사용합니다.
                callback_url: `${process.env.PUBLIC_URL}/api/trading/callback/strategy-update`,
            },
        };
        const response = await axios_1.default.post(`${PYTHON_SERVICE_URL}/strategy/start`, requestBody);
        console.log('✅ Python 서비스 응답:', response.data);
        return response.data;
    }
    catch (error) {
        console.error('❌ EMA 교차 전략 시작 실패:', error.response ? error.response.data : error.message);
        // Axios 오류인 경우, Python 서비스에서 보낸 오류 메시지를 그대로 던져줍니다.
        if (error.response) {
            throw new Error(`Python 서비스 오류: ${JSON.stringify(error.response.data)}`);
        }
        throw error; // 그 외의 경우, 원래 오류를 던집니다.
    }
};
exports.startEmaCrossStrategy = startEmaCrossStrategy;
/**
 * 이 파일의 다른 거래 관련 함수들...
 * (예: getOpenPositions, executeManualTrade 등)
 */
