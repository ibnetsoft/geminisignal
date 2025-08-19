"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiServiceFactory = void 0;
const GeminiProvider_1 = require("./GeminiProvider");
const OpenAiProvider_1 = require("./OpenAiProvider");
const AnthropicProvider_1 = require("./AnthropicProvider");
// Google Secret Manager 클라이언트
const secret_manager_1 = require("@google-cloud/secret-manager");
const secretManagerClient = new secret_manager_1.SecretManagerServiceClient();
// 시크릿을 캐싱하여 반복적인 API 호출을 방지
const secretCache = new Map();
async function getMasterApiKey(secretName) {
    // 로컬 개발 환경에서는 process.env에서 직접 키를 가져옴
    if (process.env.LOCAL_DEVELOPMENT === 'true') {
        const apiKey = process.env[secretName];
        if (!apiKey) {
            throw new Error(`환경변수에서 ${secretName} 키를 찾을 수 없습니다.`);
        }
        return apiKey;
    }
    // 프로덕션 환경에서는 Secret Manager 사용
    if (secretCache.has(secretName)) {
        return secretCache.get(secretName);
    }
    try {
        const [version] = await secretManagerClient.accessSecretVersion({
            name: `projects/YOUR_GCP_PROJECT_ID/secrets/${secretName}/versions/latest`,
        });
        const apiKey = version.payload?.data?.toString();
        if (!apiKey) {
            throw new Error(`Secret Manager에서 ${secretName} 시크릿을 찾을 수 없거나 값이 비어있습니다.`);
        }
        secretCache.set(secretName, apiKey);
        return apiKey;
    }
    catch (error) {
        console.error(`❌ Secret Manager에서 ${secretName} 시크릿을 가져오는 데 실패했습니다:`, error);
        throw error;
    }
}
class AiServiceFactory {
    constructor(firestoreInstance) {
        this.db = firestoreInstance;
    }
    async createProvider(userId) {
        // 1. 사용자 설정 조회
        const userSettingsDoc = await this.db.collection('user_settings').doc(userId).get();
        if (!userSettingsDoc.exists) {
            throw new Error(`사용자 [${userId}]의 설정을 찾을 수 없습니다.`);
        }
        const settings = userSettingsDoc.data();
        // TODO: 사용자의 구독 상태 및 토큰 사용량 체크 로직 추가
        const providerType = settings.ai_provider || 'gemini'; // 기본값은 gemini
        console.log(`🤖 사용자 [${userId}]를 위해 [${providerType}] AI 프로바이더를 생성합니다.`);
        // 2. 선택된 프로바이더에 따라 분기
        switch (providerType) {
            case 'gemini':
                const geminiApiKey = await getMasterApiKey('GEMINI_MASTER_KEY');
                return new GeminiProvider_1.GeminiProvider(geminiApiKey, this.db);
            case 'openai':
                const openaiApiKey = await getMasterApiKey('OPENAI_MASTER_KEY');
                return new OpenAiProvider_1.OpenAiProvider(openaiApiKey, this.db, settings.ai_model || 'gpt-4-turbo');
            case 'anthropic':
                const anthropicApiKey = await getMasterApiKey('ANTHROPIC_MASTER_KEY');
                return new AnthropicProvider_1.AnthropicProvider(anthropicApiKey, this.db, settings.ai_model || 'claude-3-opus-20240229');
            case 'grok':
                const grokApiKey = await getMasterApiKey('GROK_MASTER_KEY');
                return new OpenAiProvider_1.OpenAiProvider(grokApiKey, this.db, settings.ai_model || 'grok-1', 'https://api.grok.com/openai/v1');
            default:
                throw new Error(`지원하지 않는 AI 프로바이더입니다: ${providerType}`);
        }
    }
}
exports.AiServiceFactory = AiServiceFactory;
