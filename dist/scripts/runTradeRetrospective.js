"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/runTradeRetrospective.ts
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseService_1 = require("../services/services/firebaseService");
const geminiService_1 = __importDefault(require("../services/services/external/geminiService"));
dotenv_1.default.config({ path: '.env' });
let geminiService;
async function initializeServices() {
    try {
        console.log('🔧 거래 회고 서비스 초기화 시작...');
        await firebaseService_1.firebaseService.initialize();
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey)
            throw new Error('GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.');
        geminiService = new geminiService_1.default(geminiApiKey);
        console.log('✅ 서비스 초기화 완료');
    }
    catch (error) {
        console.error('❌ 서비스 초기화 실패:', error);
        process.exit(1);
    }
}
async function runTradeRetrospective() {
    await initializeServices();
    console.log('🚀 거래 실행 회고 분석 스크립트 시작...');
    try {
        const db = firebaseService_1.firebaseService.getFirestore();
        // 1. 회고가 필요한 '완료된' 거래 조회
        console.log("1️⃣ 회고가 필요한 '완료된' 거래 조회 중...");
        const tradesSnapshot = await db.collection('trade_executions')
            .where('outcome.status', '==', 'CLOSED') // P/L이 확정된 거래만 대상
            .where('outcome.reviewed', '==', false)
            .limit(30)
            .get();
        if (tradesSnapshot.empty) {
            console.log('✅ 회고할 완료된 거래가 없습니다. 스크립트를 종료합니다.');
            return;
        }
        console.log(`🔍 ${tradesSnapshot.size}개의 회고 대상 거래를 찾았습니다.`);
        // 2. 수익/손실 사례 분류
        const profitableTrades = tradesSnapshot.docs
            .filter(doc => doc.data().outcome.pnl > 0)
            .map(doc => doc.data());
        const losingTrades = tradesSnapshot.docs
            .filter(doc => doc.data().outcome.pnl <= 0)
            .map(doc => doc.data());
        console.log(`📈 수익 거래: ${profitableTrades.length}건, 📉 손실 거래: ${losingTrades.length}건`);
        if (profitableTrades.length === 0 && losingTrades.length === 0) {
            console.log('분석할 데이터가 충분하지 않습니다.');
            return;
        }
        // 3. Gemini를 통해 거래 실행 회고 분석 요청
        console.log('3️⃣ Gemini에게 거래 실행 회고 분석 요청 중...');
        const prompt = createTradeRetrospectivePrompt(profitableTrades, losingTrades);
        const learnedGuide = await geminiService.analyzeRetrospectiveData(prompt);
        if (!learnedGuide || !learnedGuide.learnedPrinciples) {
            throw new Error('Gemini로부터 유효한 실행 가이드라인을 받지 못했습니다.');
        }
        console.log('🧠 학습된 새로운 실행 가이드라인:', JSON.stringify(learnedGuide, null, 2));
        // 4. 분석 결과를 Firestore 'execution_guides/latest'에 저장
        console.log("4️⃣ 분석 결과를 'execution_guides/latest'에 저장 중...");
        await db.collection('execution_guides').doc('latest').set({
            ...learnedGuide,
            updatedAt: new Date(),
            source: 'runTradeRetrospective_script'
        });
        console.log('✅ 새로운 실행 가이드라인을 저장했습니다.');
        // 5. 회고 완료된 데이터 상태 업데이트
        console.log('5️⃣ 회고 완료된 거래 상태 업데이트 중...');
        const batch = db.batch();
        tradesSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { 'outcome.reviewed': true });
        });
        await batch.commit();
        console.log(`✅ ${tradesSnapshot.size}개 거래의 회고 처리를 완료했습니다.`);
        console.log('🎉 거래 실행 회고 분석 스크립트 성공적으로 종료!');
    }
    catch (error) {
        console.error('❌ 거래 회고 분석 중 심각한 오류 발생:', error);
        process.exit(1);
    }
}
function createTradeRetrospectivePrompt(profitableTrades, losingTrades) {
    const summarizeTrade = (t) => ({
        symbol: t.symbol,
        action: t.action,
        reasoning: t.reasoning?.substring(0, 100) + '...',
        risk_level: t.risk_level,
        pnl: t.outcome.pnl,
        // 실행과 관련된 파라미터들을 추가 (예시)
        // requested_sl: t.requested_sl,
        // requested_tp: t.requested_tp,
    });
    return `
당신은 최고의 퀀트 트레이딩 코치입니다. 다음은 AI가 실행한 실제 거래 기록과 그 결과(P/L)입니다.
이 기록을 바탕으로, AI의 **거래 실행 능력**을 향상시킬 수 있는 '거래 실행 가이드라인'을 만들어주세요.
(주의: 시그널이 좋았는지 나빴는지를 평가하는 것이 아니라, '거래 실행' 자체의 기술을 평가해야 합니다.)

### 수익 거래 사례 ###
${JSON.stringify(profitableTrades.slice(0, 5).map(summarizeTrade), null, 2)}

### 손실 거래 사례 ###
${JSON.stringify(losingTrades.slice(0, 5).map(summarizeTrade), null, 2)}

**요청:**
위 사례들을 바탕으로, 다음 거래 실행 시 AI가 따라야 할 '수익 극대화 원칙'과 '손실 최소화 원칙'을 각각 3가지씩 구체적인 행동 강령 형태로 요약해줘.
예를 들어, '손절매를 더 넓게 설정하라' 또는 '변동성이 높을 땐 거래량을 줄여라' 와 같은 구체적인 지침이어야 합니다.

**출력 형식 (반드시 이 JSON 형식을 지켜주세요):**
{
  "learnedPrinciples": {
    "profitMaximization": [
      "원칙 1: ...",
      "원칙 2: ...",
      "원칙 3: ..."
    ],
    "lossMinimization": [
      "원칙 1: ...",
      "원칙 2: ...",
      "원칙 3: ..."
    ]
  },
  "summary": "이번 회고를 통해 얻은 가장 중요한 거래 실행 교훈 한 문장 요약."
}
`;
}
runTradeRetrospective();
