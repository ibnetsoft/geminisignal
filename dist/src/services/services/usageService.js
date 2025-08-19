"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageService = void 0;
// src/services/services/usageService.ts
const firestore_1 = require("firebase-admin/firestore");
class UsageService {
    constructor(firestoreInstance) {
        this.db = firestoreInstance;
    }
    /**
     * 사용자의 토큰 사용량을 기록하고 월간 사용량을 업데이트합니다.
     * @param userId 사용자 ID
     * @param provider AI 프로바이더 이름 (예: 'gemini')
     * @param usage AI API 호출로 발생한 토큰 사용량 정보
     */
    async recordUsage(userId, provider, usage) {
        if (!userId || !usage || usage.totalTokens === 0) {
            return;
        }
        try {
            const userSettingsRef = this.db.collection('user_settings').doc(userId);
            const usageLogRef = this.db.collection('api_usage_logs').doc(); // 자동 ID로 새 로그 생성
            const batch = this.db.batch();
            // 1. 월간 누적 사용량 업데이트 (원자적 증가)
            batch.update(userSettingsRef, {
                monthly_token_usage: firestore_1.FieldValue.increment(usage.totalTokens)
            });
            // 2. 상세 사용 로그 기록
            batch.set(usageLogRef, {
                userId,
                provider,
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
                timestamp: firestore_1.FieldValue.serverTimestamp()
            });
            await batch.commit();
            console.log(`📈 [${userId}] 사용량 기록 완료: ${usage.totalTokens} 토큰`);
        }
        catch (error) {
            console.error(`❌ [${userId}] 사용량 기록 실패:`, error);
            // 사용량 기록에 실패하더라도 서비스는 중단되지 않도록 여기서 에러를 처리합니다.
            // (단, 로깅 시스템에 이 실패를 반드시 알려야 합니다.)
        }
    }
}
exports.UsageService = UsageService;
