"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/runExitRetrospective.ts
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseService_1 = require("../services/services/firebaseService");
const geminiService_1 = __importDefault(require("../services/services/external/geminiService"));
dotenv_1.default.config({ path: '.env' });
let geminiService;
async function initializeServices() {
    try {
        console.log('🔧 청산 회고 서비스 초기화 시작...');
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
async function runExitRetrospective() {
    await initializeServices();
    console.log('🚀 청산 결정 회고 분석 스크립트 시작...');
    try {
        const db = firebaseService_1.firebaseService.getFirestore();
        // 1. 회고가 필요한 '완료된' 거래 조회
        console.log("1️⃣ 회고가 필요한 '완료된' 거래 조회 중...");
        const tradesSnapshot = await db.collection('trade_executions')
            .where('outcome.status', '==', 'CLOSED')
            .where('outcome.reviewed', '==', false)
            .limit(30)
            .get();
        if (tradesSnapshot.empty) {
            console.log('✅ 회고할 완료된 거래가 없습니다. 스크립트를 종료합니다.');
            return;
        }
        console.log(`🔍 ${tradesSnapshot.size}개의 회고 대상 거래를 찾았습니다.`);
        // 2. 수익/손실 사례 분류
        const profitableExits = tradesSnapshot.docs
            .filter(doc => doc.data().outcome.pnl > 0)
            .map(doc => doc.data());
        const losingExits = tradesSnapshot.docs
            .filter(doc => doc.data().outcome.pnl <= 0)
            .map(doc => doc.data());
        console.log(`📈 수익 청산: ${profitableExits.length}건, 📉 손실 청산: ${losingExits.length}건`);
        if (profitableExits.length === 0 && losingExits.length === 0) {
            console.log('분석할 데이터가 충분하지 않습니다.');
            return;
        }
        // 3. Gemini를 통해 청산 결정 회고 분석 요청
        console.log('3️⃣ Gemini에게 청산 결정 회고 분석 요청 중...');
        const prompt = createExitRetrospectivePrompt(profitableExits, losingExits);
        const learnedGuide = await geminiService.analyzeRetrospectiveData(prompt); // 기존 메소드 재활용
        if (!learnedGuide || !learnedGuide.learnedPrinciples) {
            throw new Error('Gemini로부터 유효한 청산 가이드라인을 받지 못했습니다.');
        }
        console.log('🧠 학습된 새로운 청산 가이드라인:', JSON.stringify(learnedGuide, null, 2));
        // 4. 분석 결과를 Firestore 'exit_guides/latest'에 저장
        console.log("4️⃣ 분석 결과를 'exit_guides/latest'에 저장 중...");
        await db.collection('exit_guides').doc('latest').set({
            ...learnedGuide,
            updatedAt: new Date(),
            source: 'runExitRetrospective_script'
        });
        console.log('✅ 새로운 청산 가이드라인을 저장했습니다.');
        // 5. 회고 완료된 데이터 상태 업데이트
        console.log('5️⃣ 회고 완료된 거래 상태 업데이트 중...');
        const batch = db.batch();
        tradesSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { 'outcome.reviewed': true });
        });
        await batch.commit();
        console.log(`✅ ${tradesSnapshot.size}개 거래의 회고 처리를 완료했습니다.`);
        console.log('🎉 청산 결정 회고 분석 스크립트 성공적으로 종료!');
    }
    catch (error) {
        console.error('❌ 청산 회고 분석 중 심각한 오류 발생:', error);
        process.exit(1);
    }
}
function createExitRetrospectivePrompt(profitableExits, losingExits) {
    const summarizeExit = (t) => ({
        symbol: t.symbol,
        action: t.action, // 'buy' or 'sell'
        pnl: t.outcome.pnl,
        closedBy: t.outcome.closedBy, // 'AI_DECISION', 'TAKE_PROFIT_HIT', etc.
        closeReasoning: t.outcome.closeReasoning,
        initialReasoning: t.reasoning?.substring(0, 80) + '...',
    });
    return `
당신은 트레이딩 심리학자이자 리스크 관리 전문가입니다. 다음은 AI가 청산한 실제 거래 기록입니다.
이 기록을 바탕으로, AI의 **거래 청산(Exit) 능력**을 향상시킬 수 있는 '청산 가이드라인'을 만들어주세요.
(주의: 진입 시점이 좋았는지를 평가하는 것이 아니라, '청산 결정' 자체가 최적이었는지를 평가해야 합니다.)

### 수익 청산 사례 (잘한 점 분석) ###
${JSON.stringify(profitableExits.slice(0, 5).map(summarizeExit), null, 2)}

### 손실 청산 사례 (개선할 점 분석) ###
${JSON.stringify(losingExits.slice(0, 5).map(summarizeExit), null, 2)}

**요청:**
위 사례들을 바탕으로, 다음 거래 관리 시 AI가 따라야 할 '수익 보존 원칙'과 '손실 관리 원칙'을 각각 3가지씩 구체적인 행동 강령 형태로 요약해줘.
예를 들어, 'RSI가 70을 넘으면 분할 익절을 시작하라' 또는 '예상치 못한 뉴스가 발생하면 P/L과 무관하게 즉시 포지션을 축소하라' 와 같은 구체적인 지침이어야 합니다.

**출력 형식 (반드시 이 JSON 형식을 지켜주세요):**
{
  "learnedPrinciples": {
    "profitPreservation": [
      "원칙 1: ...",
      "원칙 2: ...",
      "원칙 3: ..."
    ],
    "lossManagement": [
      "원칙 1: ...",
      "원칙 2: ...",
      "원칙 3: ..."
    ]
  },
  "summary": "이번 회고를 통해 얻은 가장 중요한 청산 전략 교훈 한 문장 요약."
}
`;
}
runExitRetrospective();
