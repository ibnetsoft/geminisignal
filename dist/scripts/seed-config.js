"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seed-config.ts
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseService_1 = require("../services/services/firebaseService");
dotenv_1.default.config({ path: '.env' });
// 시스템의 기본 동작을 제어하는 기본 설정값
const defaultConfig = {
    // 1. 계좌 및 자산 관련 설정
    total_balance: 100000.0, // 총 자산 (USD)
    monthly_profit_target_percent: 5.0, // 월 목표 수익률 (%)
    max_account_drawdown_percent: 15.0, // 최대 계좌 손실률 (%). 이 수치 도달 시 모든 거래 중단.
    // 2. 거래 진입 관련 설정
    tradable_symbols: ["EUR/USD", "BTC/USD", "XAU/USD", "USDT/USD"], // 거래를 허용할 종목 목록
    risk_per_trade_percent: 1.0, // 거래당 최대 리스크 (%). 총 자산 대비. 거래량 자동 계산의 핵심 기준.
    min_confidence_to_trade: 0.75, // 거래 진입을 위한 AI의 최소 신뢰도 (75%)
    // 3. 거래 관리 및 청산 관련 설정
    enable_martingale: false, // 마틴게일/그리드 전략 사용 여부 (매우 높은 리스크)
    enable_ai_exit_logic: true, // AI의 동적 청산 로직 사용 여부
    profit_taking_style: 'balanced', // 익절 스타일: 'aggressive', 'balanced', 'conservative'
    // 시스템 메타데이터
    updatedAt: new Date(),
    version: '1.0.0',
};
async function seedConfig() {
    console.log('🔧 설정 시딩 스크립트 시작...');
    try {
        await firebaseService_1.firebaseService.initialize();
        const db = firebaseService_1.firebaseService.getFirestore();
        const configRef = db.collection('trading_config').doc('global');
        console.log('🌱 기본 설정값을 Firestore `trading_config/global` 문서에 저장합니다...');
        console.log(JSON.stringify(defaultConfig, null, 2));
        await configRef.set(defaultConfig);
        console.log('✅ 설정 시딩이 성공적으로 완료되었습니다.');
    }
    catch (error) {
        console.error('❌ 설정 시딩 중 오류 발생:', error);
        process.exit(1);
    }
}
seedConfig();
