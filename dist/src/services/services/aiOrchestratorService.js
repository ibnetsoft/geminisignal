"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiOrchestratorService = void 0;
const AiServiceFactory_1 = require("./external/AiServiceFactory");
const usageService_1 = require("./usageService");
// 구독 플랜별 월간 토큰 한도 (Infinity는 무제한)
const PLAN_TOKEN_LIMITS = {
    free_tier: 100000,
    basic: 1000000,
    pro: 5000000,
    elite: Infinity,
};
class AiOrchestratorService {
    constructor(firestoreInstance) {
        this.db = firestoreInstance;
        this.factory = new AiServiceFactory_1.AiServiceFactory(this.db);
        this.usageService = new usageService_1.UsageService(this.db);
    }
    /**
     * 특정 사용자를 위해 신호 분석을 안전하게 실행하고 사용량을 기록합니다.
     * @param userId 사용자 ID
     * @param signal 분석할 신호 데이터
     * @param marketContext 시장 컨텍스트
     * @returns 분석 결과
     */
    async analyzeSignalForUser(userId, signal, marketContext) {
        // 1. 실행 전 권한 및 한도 체크
        const { settings, provider } = await this.preExecutionCheck(userId);
        // 2. 개인화된 학습 데이터 로드
        const guideDoc = await this.db.collection('strategy_guides').doc(userId).get();
        const strategyGuide = guideDoc.exists() ? guideDoc.data() : null;
        // 3. AI 프로바이더를 통해 실제 분석 실행
        const { result, usage } = await provider.analyzeSignal(signal, marketContext, strategyGuide);
        // 4. 사용량 기록
        await this.usageService.recordUsage(userId, settings.ai_provider, usage);
        return result;
    }
    // analyzeOpenPositionForUser, analyzeRetrospectiveDataForUser 등 다른 메소드들도 동일한 패턴으로 구현 가능
    /**
     * AI 실행 전 사용자의 상태(구독, 사용량)를 확인하고 AI 프로바이더를 준비합니다.
     * @param userId 사용자 ID
     * @returns {Promise<{settings: any, provider: IAiProvider}>} 사용자 설정과 준비된 AI 프로바이더
     */
    async preExecutionCheck(userId) {
        const settingsDoc = await this.db.collection('user_settings').doc(userId).get();
        if (!settingsDoc.exists) {
            throw new Error(`[${userId}]의 사용자 설정을 찾을 수 없습니다.`);
        }
        const settings = settingsDoc.data();
        // 구독 플랜 상태 확인
        if (settings.plan_status !== 'active') {
            throw new Error(`[${userId}]의 구독 플랜이 활성 상태가 아닙니다 (상태: ${settings.plan_status}).`);
        }
        // 토큰 사용량 한도 확인
        const limit = PLAN_TOKEN_LIMITS[settings.subscription_plan] || 0;
        if (settings.monthly_token_usage >= limit) {
            throw new Error(`[${userId}]의 월간 토큰 한도(${limit.toLocaleString()})를 초과했습니다.`);
        }
        // AI 프로바이더 생성
        const provider = await this.factory.createProvider(userId);
        return { settings, provider };
    }
}
exports.AiOrchestratorService = AiOrchestratorService;
