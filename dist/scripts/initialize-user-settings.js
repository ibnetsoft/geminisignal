"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/initialize-user-settings.ts
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseService_1 = require("../services/services/firebaseService");
dotenv_1.default.config({ path: '.env' });
// 새로운 사용자에게 제공될 기본 설정값
const defaultUserSettings = {
    // 1. AI 프로바이더 설정
    ai_provider: 'gemini', // 기본 AI 모델
    // API 키는 여기에 저장하지 않습니다.
    // 2. 계좌 및 자산 관련 설정
    total_balance: 10000.0, // 신규 유저 기본 자산
    monthly_profit_target_percent: 5.0,
    max_account_drawdown_percent: 15.0,
    // 3. 거래 진입 관련 설정
    tradable_symbols: ["EUR/USD", "BTC/USD"],
    risk_per_trade_percent: 1.0,
    min_confidence_to_trade: 0.75,
    // 4. 거래 관리 및 청산 관련 설정
    enable_martingale: false,
    enable_ai_exit_logic: true,
    profit_taking_style: 'balanced',
    // 5. 구독 정보
    subscription_plan: 'free_tier', // 기본 구독 플랜
    plan_status: 'active',
    monthly_token_usage: 0,
    usage_reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // 다음 달 1일로 초기화 날짜 설정
    // 6. MT4/MT5 정보 (초기에는 비어있음)
    mt4_settings: { accountNumber: '', serverInfo: '' },
    mt5_settings: { accountNumber: '', serverInfo: '' },
    // 시스템 메타데이터
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
};
async function initializeUserSettings(userId) {
    if (!userId) {
        console.error('❌ 사용자 ID가 제공되지 않았습니다. 스크립트를 종료합니다.');
        return;
    }
    console.log(`🔧 사용자 [${userId}]에 대한 설정 초기화 스크립트 시작...`);
    try {
        await firebaseService_1.firebaseService.initialize();
        const db = firebaseService_1.firebaseService.getFirestore();
        const userSettingsRef = db.collection('user_settings').doc(userId);
        console.log(`🌱 사용자 [${userId}]에게 기본 설정값을 Firestore 'user_settings/${userId}' 문서에 저장합니다...`);
        await userSettingsRef.set(defaultUserSettings);
        console.log('✅ 사용자 설정 초기화가 성공적으로 완료되었습니다.');
    }
    catch (error) {
        console.error('❌ 사용자 설정 초기화 중 오류 발생:', error);
        process.exit(1);
    }
}
// 스크립트 실행 예시: node <script_name>.js <userId>
const userId = process.argv[2];
initializeUserSettings(userId);
