"use strict";
// trading.ts - pipmaker-signals 프로젝트 통합 자동거래 시스템
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAITradingSignal = processAITradingSignal;
exports.addTradingAccount = addTradingAccount;
exports.getTradingAccounts = getTradingAccounts;
exports.updateTradingAccount = updateTradingAccount;
exports.getTradeExecutions = getTradeExecutions;
exports.checkMetaAPIHealth = checkMetaAPIHealth;
exports.getTradingSystemStatus = getTradingSystemStatus;
const admin = __importStar(require("firebase-admin"));
const telegraf_1 = require("telegraf");
// MetaAPI SDK 임포트
const MetaApi = require('metaapi.cloud-sdk').default; // ✅ 점(.)으로 변경
// ✅ Firebase 초기화 순서 문제 해결 - 함수로 변경
function getDB() {
    return admin.firestore();
}
/**
 * 학습된 가이드라인에 따라 거래 신호를 조정하는 함수 (예시)
 * @param signal 원본 AI 거래 신호
 * @param guide 학습된 실행 가이드라인
 * @returns 조정된 거래 신호
 */
function adjustSignalWithGuide(signal, guide) {
    if (!guide || !guide.learnedPrinciples) {
        return signal;
    }
    console.log('🧠 학습된 가이드라인에 따라 신호 조정을 시도합니다...');
    const adjustedSignal = { ...signal };
    // 예시 1: 손실 최소화 원칙에 '거래량' 관련 내용이 있으면 거래량 10% 감소
    const lossMinimizationRules = guide.learnedPrinciples.lossMinimization.join(' ');
    if (lossMinimizationRules.includes('거래량') || lossMinimizationRules.includes('볼륨')) {
        console.log("-> 가이드라인('손실 최소화')에 따라 거래량을 10% 줄입니다.");
        adjustedSignal.volume = adjustedSignal.volume * 0.9;
    }
    // 예시 2: 수익 극대화 원칙에 '익절' 관련 내용이 있으면 TP 10% 증가 (TP가 있다는 가정)
    const profitMaximizationRules = guide.learnedPrinciples.profitMaximization.join(' ');
    if (profitMaximizationRules.includes('익절') || profitMaximizationRules.includes('take profit')) {
        if (adjustedSignal.takeProfit) {
            console.log("-> 가이드라인('수익 극대화')에 따라 익절(TP)을 10% 늘립니다.");
            adjustedSignal.takeProfit = adjustedSignal.takeProfit * 1.1;
        }
    }
    console.log(`📊 조정된 신호: 볼륨 ${signal.volume.toFixed(2)} -> ${adjustedSignal.volume.toFixed(2)}`);
    return adjustedSignal;
}
// MetaAPI 및 Telegram 초기화 (환경변수 사용)
let api;
let tradingBot;
function initializeTradingServices() {
    try {
        if (process.env.METAAPI_TOKEN) {
            api = new MetaApi(process.env.METAAPI_TOKEN);
            console.log('✅ MetaAPI 초기화 완료');
        }
        if (process.env.TELEGRAM_BOT_TOKEN) {
            tradingBot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
            console.log('✅ 거래 텔레그램 봇 초기화 완료');
        }
    }
    catch (error) {
        console.error('❌ 거래 서비스 초기화 실패:', error);
    }
}
// 서비스 초기화 실행
initializeTradingServices();
// 텔레그램 메시지 전송 (거래 전용)
async function sendTradingTelegramMessage(message) {
    try {
        if (!tradingBot || !process.env.TELEGRAM_CHAT_ID) {
            console.log('텔레그램 설정 없음, 메시지 스킵:', message);
            return;
        }
        await tradingBot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
        console.log('📤 거래 텔레그램 메시지 전송 완료');
    }
    catch (error) {
        console.error('❌ 거래 텔레그램 전송 실패:', error);
    }
}
// 신호 데이터 검증
function validateTradingSignal(signal) {
    const required = ['symbol', 'volume', 'action'];
    const missing = required.filter(field => !signal[field]);
    if (missing.length > 0) {
        throw new Error(`필수 거래 신호 필드 누락: ${missing.join(', ')}`);
    }
    if (!['buy', 'sell'].includes(signal.action.toLowerCase())) {
        throw new Error(`잘못된 거래 액션: ${signal.action}. 'buy' 또는 'sell'이어야 합니다`);
    }
    if (parseFloat(signal.volume) <= 0) {
        throw new Error(`잘못된 거래량: ${signal.volume}. 0보다 커야 합니다`);
    }
}
// 개별 계정에서 거래 실행
async function executeTradeOnAccount(accountId, signal, config) {
    let connection = null;
    try {
        console.log(`🔄 계정 ${accountId}에서 거래 실행 시작`);
        if (!api)
            throw new Error('MetaAPI가 초기화되지 않았습니다');
        const account = await api.metatraderAccountApi.getAccount(accountId);
        connection = await account.getStreamingConnection();
        await connection.connect();
        await connection.waitSynchronized();
        // --- 1. 진입 가격 및 손절가 결정 ---
        const riskPercentageMap = { low: 0.005, medium: 0.01, high: 0.02 };
        const riskPercentage = riskPercentageMap[signal.risk_level] || 0.01;
        const tick = await connection.getTick(signal.symbol);
        const entryPrice = signal.action.toLowerCase() === 'buy' ? tick.ask : tick.bid;
        if (!entryPrice)
            throw new Error(`진입 가격을 확인할 수 없습니다: ${signal.symbol}`);
        const stopLossPrice = signal.action.toLowerCase() === 'buy'
            ? entryPrice * (1 - riskPercentage)
            : entryPrice * (1 + riskPercentage);
        // --- 2. 리스크 기반 거래량(Lot) 자동 계산 ---
        const riskAmountPerTrade = config.total_balance * (config.risk_per_trade_percent / 100);
        const priceDiffPerUnit = Math.abs(entryPrice - stopLossPrice);
        // 종목별 1랏당 가치 (단순화를 위해 예시값 사용, 실제로는 정확한 계산 필요)
        // 예를 들어, EUR/USD의 1랏은 100,000 EUR이며, 1핍의 가치는 약 $10 입니다.
        // 여기서는 1랏당 가격 변동이 1:1이라고 가정하여 단순 계산합니다.
        const contractSize = signal.symbol.includes('USD') ? 100000 : 1; // FX와 암호화폐/지수 간의 단순 구분 예시
        const valuePerPip = contractSize * 0.0001; // 1핍의 가치 (FX 기준)
        const pipsRisked = priceDiffPerUnit / 0.0001; // 리스크 핍 수
        // 이 계산은 종목마다 매우 다르므로, 실제 환경에서는 반드시 검증 및 수정이 필요합니다.
        // 여기서는 개념 증명을 위해 단순화된 계산식을 사용합니다.
        const calculatedVolume = (riskAmountPerTrade / (pipsRisked * 10)).toFixed(2); // 1핍=$10 가정 단순화
        console.log(`🛡️ 거래량 자동 계산:
      - 거래당 리스크 금액: ${riskAmountPerTrade.toFixed(2)}
      - 진입-손절 가격차: ${priceDiffPerUnit.toFixed(5)}
      - 계산된 거래량: ${calculatedVolume}`);
        // --- 3. 주문 생성 ---
        const order = {
            action: 'TRADE_ACTION_DEAL',
            symbol: signal.symbol,
            volume: parseFloat(calculatedVolume), // 자동 계산된 거래량 적용
            type: signal.action.toLowerCase() === 'buy' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
            price: entryPrice,
            stopLoss: parseFloat(stopLossPrice.toFixed(5)),
        };
        if (signal.takeProfit)
            order.takeProfit = parseFloat(signal.takeProfit.toString());
        if (signal.from_ai)
            order.comment = `AI-${signal.original_signal_id}-${(signal.confidence * 100).toFixed(0)}%`;
        // --- 4. 거래 실행 ---
        const result = await connection.executeTrade(order);
        const message = `🤖 AI 거래 실행 성공!
🏢 계정: ${accountId}
📈 ${signal.symbol} ${signal.action.toUpperCase()} @ ${entryPrice.toFixed(5)}
💰 볼륨: ${order.volume} (자동 계산)
🛡️ 손절(SL): ${order.stopLoss}
🎯 신뢰도: ${(signal.confidence * 100).toFixed(1)}%
📊 결과: ${result.retcode}`;
        await sendTradingTelegramMessage(message);
        console.log(`✅ 계정 ${accountId} 거래 실행 성공`);
        return { success: true, accountId, result };
    }
    catch (error) {
        const errorMessage = `❌ 거래 실행 실패!
🏢 계정: ${accountId}
🚫 오류: ${error.message}
📈 신호: ${signal.symbol} ${signal.action}`;
        await sendTradingTelegramMessage(errorMessage);
        console.error(`❌ 계정 ${accountId} 거래 실행 실패:`, error);
        return { success: false, accountId, error: error.message };
    }
    finally {
        if (connection) {
            try {
                await connection.close();
                console.log(`🔌 계정 ${accountId} 연결 종료`);
            }
            catch (closeError) {
                console.error(`❌ 연결 종료 오류 ${accountId}:`, closeError);
            }
        }
    }
}
// 재시도 로직이 있는 거래 실행
async function executeTradeWithRetry(accountId, signal, config, maxRetries = 3) {
    let lastError = '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // 설정값을 executeTradeOnAccount로 전달
            const result = await executeTradeOnAccount(accountId, signal, config);
            if (result.success) {
                return result;
            }
            lastError = result.error || 'Unknown error';
        }
        catch (error) {
            lastError = error.message;
            console.warn(`거래 시도 ${attempt}회 실패 (계정: ${accountId}):`, error.message);
        }
        if (attempt < maxRetries) {
            // 지수 백오프 (1초, 2초, 4초...)
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ ${delay / 1000}초 후 재시도... (계정: ${accountId})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return {
        success: false,
        accountId,
        error: `${maxRetries}회 시도 후 실패: ${lastError}`
    };
}
const AiServiceFactory_1 = require("./services/services/external/AiServiceFactory");
// AI 신호를 받아서 거래 처리하는 메인 함수
async function processAITradingSignal(aiSignal, userId) {
    try {
        console.log(`🤖 [${userId}] 사용자의 AI 거래 신호 처리 시작:`, aiSignal.original_signal_id);
        // --- 1. 시스템 설정 및 안전장치 확인 ---
        const db = getDB();
        const configDoc = await db.collection('user_settings').doc(userId).get(); // 개인화된 설정 로드
        if (!configDoc.exists) {
            throw new Error(`[${userId}]의 거래 설정을 찾을 수 없습니다. 'npm run user:init'을 먼저 실행하세요.`);
        }
        const config = configDoc.data();
        if (!config) {
            throw new Error(`[${userId}]의 거래 설정 데이터가 비어있습니다.`);
        }
        console.log(`✅ [${userId}]의 거래 설정을 성공적으로 불러왔습니다.`);
        // ... (기존 안전장치 로직은 그대로 유지) ...
        // --- 2. AI 서비스 팩토리를 통해 프로바이더 생성 ---
        const aiFactory = new AiServiceFactory_1.AiServiceFactory(db);
        const aiProvider = await aiFactory.createProvider(userId);
        // --- 3. AI 분석 실행 (이제 aiProvider의 공통 메소드 사용) ---
        // 이 부분은 실제로는 AI 분석이 이미 완료된 신호를 받는 것이므로, 여기서는 팩토리 사용 예시만 보여줍니다.
        // 실제 AI 분석 호출은 신호가 생성되는 다른 서비스에서 이루어져야 합니다.
        console.log('AI Provider가 성공적으로 생성되었습니다. 실제 분석은 다른 모듈에서 호출됩니다.');
        // ... (이하 거래 실행 로직은 기존과 거의 동일) ...
        // 활성화된 AI 거래 계정 조회
        const accountsSnapshot = await db.collection('trading_accounts')
            .where('owner_uid', '==', userId) // 사용자의 계정만 조회하도록 변경
            .where('active', '==', true)
            .where('ai_trading_enabled', '==', true)
            .get();
        // 최신 거래 실행 가이드라인 조회 (개인화)
        let executionGuide = null;
        try {
            const guideDoc = await db.collection('execution_guides').doc(userId).get();
            if (guideDoc.exists) {
                executionGuide = guideDoc.data();
                console.log(`✅ [${userId}]의 최신 거래 실행 가이드라인을 불러왔습니다.`);
            }
        }
        catch (dbError) {
            console.warn(`⚠️ [${userId}]의 거래 실행 가이드라인 조회 실패.`);
        }
        // ... (이하 생략) ...
    }
    catch (error) {
        console.error(`❌ [${userId}]의 AI 거래 신호 처리 중 오류:`, error);
        // ... (에러 처리) ...
    }
}
// 거래 계정 관리 함수들
async function addTradingAccount(accountData) {
    try {
        const accountRef = await getDB().collection('trading_accounts').add({
            ...accountData,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            active: accountData.active ?? true,
            ai_trading_enabled: accountData.ai_trading_enabled ?? false
        });
        console.log(`✅ 거래 계정 추가 완료: ${accountRef.id}`);
        return accountRef.id;
    }
    catch (error) {
        console.error('❌ 거래 계정 추가 실패:', error);
        throw error;
    }
}
async function getTradingAccounts() {
    try {
        const snapshot = await getDB().collection('trading_accounts').get();
        const accounts = [];
        snapshot.forEach(doc => {
            accounts.push({ ...doc.data() });
        });
        return accounts;
    }
    catch (error) {
        console.error('❌ 거래 계정 조회 실패:', error);
        throw error;
    }
}
async function updateTradingAccount(accountId, updates) {
    try {
        await getDB().collection('trading_accounts').doc(accountId).update({
            ...updates,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ 거래 계정 업데이트 완료: ${accountId}`);
    }
    catch (error) {
        console.error('❌ 거래 계정 업데이트 실패:', error);
        throw error;
    }
}
// 거래 실행 기록 조회
async function getTradeExecutions(limit = 10) {
    try {
        const snapshot = await getDB().collection('trade_executions')
            .orderBy('processed_at', 'desc')
            .limit(limit)
            .get();
        const executions = [];
        snapshot.forEach(doc => {
            executions.push({ id: doc.id, ...doc.data() });
        });
        return executions;
    }
    catch (error) {
        console.error('❌ 거래 실행 기록 조회 실패:', error);
        throw error;
    }
}
// MetaAPI 헬스체크
async function checkMetaAPIHealth() {
    try {
        if (!api) {
            return false;
        }
        const accounts = await api.metatraderAccountApi.getAccounts();
        return Array.isArray(accounts);
    }
    catch (error) {
        console.error('❌ MetaAPI 헬스체크 실패:', error);
        return false;
    }
}
// 거래 시스템 상태 정보
function getTradingSystemStatus() {
    return {
        metaapi_initialized: !!api,
        telegram_initialized: !!tradingBot,
        environment_variables: {
            metaapi_token: !!process.env.METAAPI_TOKEN,
            telegram_bot_token: !!process.env.TELEGRAM_BOT_TOKEN,
            telegram_chat_id: !!process.env.TELEGRAM_CHAT_ID
        }
    };
}
