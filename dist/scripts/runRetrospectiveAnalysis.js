"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/runRetrospectiveAnalysis.ts
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseService_1 = require("../services/services/firebaseService");
const geminiService_1 = __importDefault(require("../services/services/external/geminiService"));
// 환경변수 로드
dotenv_1.default.config({ path: '.env' });
// --- 서비스 초기화 ---
let geminiService;
async function initializeServices() {
    try {
        console.log('🔧 서비스 초기화 시작...');
        await firebaseService_1.firebaseService.initialize();
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.');
        }
        geminiService = new geminiService_1.default(geminiApiKey);
        console.log('✅ 서비스 초기화 완료');
    }
    catch (error) {
        console.error('❌ 서비스 초기화 실패:', error);
        process.exit(1);
    }
}
async function runAnalysis() {
    await initializeServices();
    console.log('🚀 개인화 회고 분석 스크립트 시작...');
    try {
        const db = firebaseService_1.firebaseService.getFirestore();
        // 1. 회고가 필요한 모든 데이터를 가져옴
        console.log('1️⃣ 회고가 필요한 모든 데이터 조회 중...');
        const evaluationsSnapshot = await db.collection('signal_evaluations')
            .where('outcome.reviewed', '==', false)
            .get();
        if (evaluationsSnapshot.empty) {
            console.log('✅ 회고할 새로운 데이터가 없습니다.');
            return;
        }
        // 2. 데이터를 사용자 ID별로 그룹화
        const evaluationsByUser = {};
        evaluationsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = data.userId; // 데이터에 userId가 포함되어 있다고 가정
            if (!userId)
                return;
            if (!evaluationsByUser[userId]) {
                evaluationsByUser[userId] = [];
            }
            evaluationsByUser[userId].push(data);
        });
        console.log(`🔍 ${Object.keys(evaluationsByUser).length}명의 사용자에 대한 회고 데이터를 찾았습니다.`);
        // 3. 각 사용자별로 회고 분석 실행
        for (const userId in evaluationsByUser) {
            console.log(`
--- 사용자 [${userId}] 회고 분석 시작 ---`);
            const userData = evaluationsByUser[userId];
            const successfulCases = userData.filter(d => d.outcome.result !== 'ANALYSIS_ERROR');
            const failedCases = userData.filter(d => d.outcome.result === 'ANALYSIS_ERROR');
            if (successfulCases.length === 0 && failedCases.length === 0) {
                console.log('분석할 데이터가 충분하지 않습니다.');
                continue;
            }
            console.log('3️⃣ Gemini에게 회고 분석 요청 중...');
            const retrospectivePrompt = createRetrospectivePrompt(successfulCases, failedCases);
            const learnedGuide = await geminiService.analyzeRetrospectiveData(retrospectivePrompt);
            if (!learnedGuide || !learnedGuide.learnedPrinciples) {
                throw new Error('유효한 전략 가이드라인을 받지 못했습니다.');
            }
            // 4. 개인화된 가이드라인 저장
            console.log(`4️⃣ [${userId}]의 개인화된 전략 가이드라인을 Firestore에 저장 중...`);
            const guideRef = db.collection('strategy_guides').doc(userId);
            await guideRef.set({
                ...learnedGuide,
                updatedAt: new Date(),
                source: 'runRetrospectiveAnalysis_script'
            });
            // 5. 회고 완료된 데이터 상태 업데이트
            const batch = db.batch();
            evaluationsSnapshot.docs.forEach(doc => {
                if (doc.data().userId === userId) {
                    batch.update(doc.ref, { 'outcome.reviewed': true });
                }
            });
            await batch.commit();
            console.log(`✅ 사용자 [${userId}]의 ${userData.length}개 데이터 회고 처리를 완료했습니다.`);
        }
        console.log(', 모든, 사용자의, 회고, 분석을, 성공적으로, 종료, '););
    }
    catch (error) {
        console.error('❌ 회고 분석 중 심각한 오류 발생:', error);
        process.exit(1);
    }
}
function createRetrospectivePrompt(successfulCases, failedCases) {
    // 프롬프트 생성을 위한 데이터 요약
    const summarizeCase = (c) => ({
        signal: c.originalSignal.action,
        symbol: c.originalSignal.symbol,
        decision: c.geminiAnalysis.analysisResult.recommendation,
        reasoning: c.geminiAnalysis.analysisResult.reasoning.substring(0, 100) + '...',
        // TODO: 실제 결과(수익/손실) 필드가 추가되면 여기에 포함
    });
    const successfulSummaries = successfulCases.slice(0, 5).map(summarizeCase);
    const failedSummaries = failedCases.slice(0, 5).map(summarizeCase);
    return `
당신은 최고의 트레이딩 전략 분석가입니다. 다음은 최근 AI의 시그널 판단 기록입니다.
이 기록을 바탕으로, AI의 판단 능력을 향상시킬 수 있는 '새로운 전략 가이드라인'을 만들어주세요.

### 분석 성공 사례 (참고용) ###
${JSON.stringify(successfulSummaries, null, 2)}

### 분석 실패 또는 개선 필요 사례 ###
${JSON.stringify(failedSummaries, null, 2)}

**요청:**
위 사례들을 바탕으로, 다음 시그널 판단 시 AI가 따라야 할 '성공 원칙'과 피해야 할 '실패 원인'을 각각 3가지씩 구체적인 행동 강령 형태로 요약해줘.
이 원칙들은 다음 AI 판단 프롬프트에 직접적으로 포함될 예정이므로, 명확하고 간결하게 작성해야 합니다.

**출력 형식 (반드시 이 JSON 형식을 지켜주세요):**
{
  "learnedPrinciples": {
    "success": [
      "원칙 1: ...",
      "원칙 2: ...",
      "원칙 3: ..."
    ],
    "failure": [
      "원인 1: ...",
      "원인 2: ...",
      "원인 3: ..."
    ]
  },
  "summary": "이번 회고를 통해 얻은 가장 중요한 교훈 한 문장 요약."
}
`;
}
// 스크립트 실행
runAnalysis();
