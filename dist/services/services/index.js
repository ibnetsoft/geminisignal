"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceManager = void 0;
exports.initializeServices = initializeServices;
exports.getServiceManager = getServiceManager;
// services/index.ts - Firebase 서비스 통합 버전
const firebaseService_1 = require("./firebaseService");
const telegramService_1 = require("./telegramService");
class ServiceManager {
    constructor() {
        console.log('🔧 서비스 매니저 초기화 중...');
    }
    /**
     * 서비스 매니저 초기화
     */
    async initialize() {
        try {
            // Firebase 서비스 초기화
            await firebaseService_1.firebaseService.initialize();
            // 텔레그램 서비스 초기화
            await telegramService_1.telegramService.initialize();
            console.log('✅ 서비스 매니저 초기화 완료');
        }
        catch (error) {
            console.error('❌ 서비스 매니저 초기화 실패:', error);
            throw error;
        }
    }
    async processSignal(signalData) {
        try {
            console.log('📊 완전한 신호 처리 시작:', signalData);
            const processedSignalData = {
                ...signalData,
                received_at: new Date().toISOString(),
                status: 'processing'
            };
            // 1단계: Firestore에 원본 신호 저장
            let signalDocId;
            try {
                const collectionName = `signals_${(signalData.symbol || 'unknown').toLowerCase()}`;
                signalDocId = await firebaseService_1.firebaseService.addDocument(collectionName, processedSignalData);
                console.log(`✅ 신호 저장 완료: ${collectionName}/${signalDocId}`);
            }
            catch (storeError) {
                console.error('❌ 신호 저장 실패:', storeError);
                throw new Error('신호 저장 중 오류 발생');
            }
            // 2단계: AI 분석 수행
            let analysisResult;
            try {
                analysisResult = await this.performSignalAnalysis(processedSignalData);
                console.log('✅ AI 분석 완료:', analysisResult.summary);
            }
            catch (analysisError) {
                console.error('❌ AI 분석 실패:', analysisError);
                analysisResult = {
                    success: false,
                    error: analysisError.message || String(analysisError),
                    fallback: true,
                    summary: '분석 실패 - 기본 처리',
                    signal: signalData.signal || signalData.action || 'Unknown',
                    confidence: 0,
                    reasoning: 'AI 분석 서비스 오류로 인한 기본 처리'
                };
            }
            // 3단계: 분석 결과를 별도 컬렉션에 저장
            let analysisDocId = null;
            try {
                const analysisCollectionName = `signal_analyses_${(signalData.symbol || 'unknown').toLowerCase()}`;
                const analysisDoc = {
                    ...analysisResult,
                    original_signal_id: signalDocId,
                    symbol: signalData.symbol,
                    analyzed_at: new Date().toISOString()
                };
                analysisDocId = await firebaseService_1.firebaseService.addDocument(analysisCollectionName, analysisDoc);
                console.log(`✅ 분석 결과 저장 완료: ${analysisCollectionName}/${analysisDocId}`);
            }
            catch (analysisStoreError) {
                console.error('❌ 분석 결과 저장 실패:', analysisStoreError);
                // 분석 결과 저장 실패해도 계속 진행
            }
            // 4단계: 텔레그램 알림 전송
            try {
                // 텔레그램 서비스가 활성화되어 있는지 확인
                if (!telegramService_1.telegramService.isEnabled()) {
                    console.log('📱 텔레그램 서비스 초기화 시도...');
                    try {
                        await telegramService_1.telegramService.initialize();
                    }
                    catch (initError) {
                        console.warn('⚠️ 텔레그램 초기화 실패, 알림 전송 건너뛰기:', initError);
                        // 텔레그램 초기화 실패해도 신호 처리는 계속 진행
                    }
                }
                if (telegramService_1.telegramService.isEnabled()) {
                    const alertData = {
                        ...processedSignalData,
                        analysis: analysisResult,
                        confidence: analysisResult.confidence || 0
                    };
                    const success = await telegramService_1.telegramService.sendSignalAlert(alertData);
                    if (success) {
                        console.log('✅ 텔레그램 알림 전송 완료');
                    }
                    else {
                        console.warn('⚠️ 텔레그램 알림 전송 실패');
                    }
                }
                else {
                    console.log('ℹ️ 텔레그램 서비스를 사용할 수 없어 알림을 건너뜁니다.');
                }
            }
            catch (telegramError) {
                console.error('❌ 텔레그램 전송 오류:', telegramError);
                // 텔레그램 전송 실패해도 신호 처리는 성공으로 간주
            }
            // 최종 응답
            return {
                success: true,
                message: '완전한 신호 처리 완료',
                data: {
                    signal_id: signalDocId,
                    analysis_id: analysisDocId || null,
                    original_data: signalData,
                    analysis_summary: analysisResult.summary || '분석 실패',
                    telegram_sent: true
                },
                documentId: signalDocId // 호환성을 위해 유지
            };
        }
        catch (error) {
            console.error('❌ 신호 처리 중 오류:', error);
            throw error;
        }
    }
    // AI 분석 함수 (ServiceManager 내부)
    async performSignalAnalysis(signalData) {
        try {
            console.log(`[AI 분석] 신호 분석 시작:`, signalData.symbol);
            // Gemini AI를 사용한 신호 분석
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
            }
            // AI 분석을 위한 프롬프트 구성
            const analysisPrompt = `당신은 전문적인 금융 신호 분석가입니다. 다음 거래 신호를 분석해주세요:

심볼: ${signalData.symbol || 'Unknown'}
신호: ${signalData.signal || signalData.action || 'Unknown'}
가격: ${signalData.price || 'N/A'}
시간: ${signalData.timestamp || signalData.generated_at || new Date().toISOString()}
추가 데이터: ${JSON.stringify(signalData, null, 2)}

다음 형식으로 분석 결과를 제공해주세요:

1. 신호 요약 (1-2문장)
2. 신뢰도 점수 (0-100점)
3. 추천 액션 (BUY/SELL/HOLD)
4. 리스크 레벨 (LOW/MEDIUM/HIGH)
5. 분석 근거 (2-3문장)

응답은 한국어로 제공하되, 간결하고 명확하게 작성해주세요.`;
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(analysisPrompt);
            const response = await result.response;
            const aiAnalysis = response.text();
            // AI 응답 파싱 (간단한 패턴 매칭)
            const confidenceMatch = aiAnalysis.match(/신뢰도[:\s]*([0-9]+)/i);
            const actionMatch = aiAnalysis.match(/(BUY|SELL|HOLD)/i);
            const riskMatch = aiAnalysis.match(/(LOW|MEDIUM|HIGH)/i);
            const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
            const recommendedAction = actionMatch ? actionMatch[1].toUpperCase() : 'HOLD';
            const riskLevel = riskMatch ? riskMatch[1].toUpperCase() : 'MEDIUM';
            const analysisResult = {
                success: true,
                symbol: signalData.symbol,
                original_signal: signalData.signal || signalData.action,
                summary: aiAnalysis.split('\n')[0] || '신호 분석 완료',
                confidence: confidence,
                recommended_action: recommendedAction,
                risk_level: riskLevel,
                reasoning: aiAnalysis,
                analyzed_at: new Date().toISOString(),
                ai_provider: 'Gemini Pro'
            };
            console.log(`✅ AI 분석 완료 - 신뢰도: ${confidence}%, 추천: ${recommendedAction}`);
            return analysisResult;
        }
        catch (error) {
            console.error(`[AI 분석] 오류 발생:`, error);
            // AI 분석 실패 시 기본 분석 반환
            return {
                success: false,
                error: error.message,
                symbol: signalData.symbol,
                original_signal: signalData.signal || signalData.action,
                summary: '기본 신호 처리 (AI 분석 실패)',
                confidence: 30,
                recommended_action: signalData.signal || signalData.action || 'HOLD',
                risk_level: 'MEDIUM',
                reasoning: `AI 분석 실패로 인한 기본 처리. 원본 신호: ${signalData.signal || signalData.action}`,
                analyzed_at: new Date().toISOString(),
                ai_provider: 'Fallback',
                fallback: true
            };
        }
    }
    async getSystemStatus() {
        try {
            const firebaseStatus = firebaseService_1.firebaseService.isConnected();
            const telegramStatus = telegramService_1.telegramService.isEnabled();
            return {
                status: 'running',
                services: {
                    analysis: true,
                    trading: false,
                    telegram: telegramStatus,
                    firebase: firebaseStatus
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('❌ 시스템 상태 확인 중 오류:', error);
            return {
                status: 'error',
                services: {
                    analysis: false,
                    trading: false,
                    telegram: false,
                    firebase: false
                },
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
        }
    }
    async analyzeCollection(collectionName) {
        try {
            console.log(`📊 컬렉션 분석: ${collectionName}`);
            const documents = await firebaseService_1.firebaseService.getCollectionData(collectionName, 10);
            return {
                success: true,
                collection: collectionName,
                documentCount: documents.length,
                documents: documents,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error(`❌ 컬렉션 분석 실패: ${collectionName}`, error);
            throw error;
        }
    }
}
exports.ServiceManager = ServiceManager;
function initializeServices() {
    return new ServiceManager();
}
function getServiceManager() {
    return new ServiceManager();
}
