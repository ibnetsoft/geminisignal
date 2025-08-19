"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiProvider {
    constructor(apiKey, firestoreInstance) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.db = firestoreInstance;
    }
    async analyzeSignal(signal, marketContext, strategyGuide) {
        const prompt = this.createKoreanAnalysisPrompt(signal, marketContext.newsInsights || [], marketContext.upcomingEvents || [], strategyGuide);
        return await this.generateAndParse(prompt);
    }
    async analyzeOpenPosition(position, marketContext, exitGuide) {
        const prompt = this.createPositionAnalysisPrompt(position, marketContext, exitGuide);
        return await this.generateAndParse(prompt);
    }
    async analyzeRetrospectiveData(prompt) {
        return await this.generateAndParse(prompt);
    }
    async generateAndParse(prompt) {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // JSON 패턴 매칭을 더 유연하게 변경
            let jsonMatch = text.match(/\{[\s\S]*\}/);
            let parsedResult;
            
            if (!jsonMatch) {
                // JSON이 없으면 텍스트를 구조화된 객체로 변환
                console.log('⚠️ JSON 형식 없음, 텍스트 파싱 시도:', text.substring(0, 200));
                
                // 기본 구조화된 응답 생성
                parsedResult = this.parseTextToStructuredResponse(text);
            } else {
                try {
                    parsedResult = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.log('⚠️ JSON 파싱 실패, 텍스트 파싱 시도:', parseError.message);
                    parsedResult = this.parseTextToStructuredResponse(text);
                }
            }
            
            const usageMetadata = response.usageMetadata;
            const usage = {
                promptTokens: usageMetadata.promptTokenCount || 0,
                completionTokens: usageMetadata.candidatesTokenCount || 0,
                totalTokens: usageMetadata.totalTokenCount || 0,
            };
            return { output: parsedResult, usage };
        }
        catch (error) {
            console.error('❌ Gemini API 호출 오류:', error);
            
            // 폴백 응답 반환
            const fallbackResponse = {
                recommendation: 'HOLD',
                confidence: 50,
                risk_level: 'MEDIUM',
                reasoning: 'AI 분석 중 오류 발생. 수동 확인 필요.',
                analysis: '현재 AI 서비스에 일시적인 문제가 있습니다.'
            };
            
            return { 
                output: fallbackResponse, 
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
            };
        }
    }
    
    parseTextToStructuredResponse(text) {
        // 텍스트에서 핵심 정보 추출
        const lines = text.split('\n');
        let recommendation = 'HOLD';
        let confidence = 50;
        let riskLevel = 'MEDIUM';
        let reasoning = text.substring(0, 200) + '...';
        
        // 텍스트에서 매수/매도/홀드 키워드 찾기
        const lowerText = text.toLowerCase();
        if (lowerText.includes('매수') || lowerText.includes('buy')) {
            recommendation = 'BUY';
            confidence = 65;
        } else if (lowerText.includes('매도') || lowerText.includes('sell')) {
            recommendation = 'SELL';
            confidence = 65;
        }
        
        // 리스크 레벨 추출
        if (lowerText.includes('high') || lowerText.includes('높음') || lowerText.includes('고위험')) {
            riskLevel = 'HIGH';
        } else if (lowerText.includes('low') || lowerText.includes('낮음') || lowerText.includes('저위험')) {
            riskLevel = 'LOW';
        }
        
        // 신뢰도 숫자 추출
        const confidenceMatch = text.match(/(\d+)%/);
        if (confidenceMatch) {
            confidence = parseInt(confidenceMatch[1]);
        }
        
        return {
            recommendation,
            confidence,
            risk_level: riskLevel,
            reasoning,
            analysis: text,
            parsed_from_text: true
        };
    }
    // --- 프롬프트 생성 메소드들 (내용은 이전과 동일) ---
    createKoreanAnalysisPrompt(signal, newsInsights, upcomingEvents, strategyGuide) {
        // ...
        return `...`;
    }
    createPositionAnalysisPrompt(position, context, exitGuide) {
        // ...
        return `...`;
    }
}
exports.GeminiProvider = GeminiProvider;
