/**
 * GeminiAnalyzer Service - AI analysis engine using Google Gemini
 * Adapted from existing signalAnalyzer implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '../utils/logger';
import { config } from '../config/environment';
import { Signal } from '../models/Signal';
import { NewsItem } from '../models/NewsItem';
import { AnalysisResult } from '../models/AnalysisResult';

const logger = createLogger('gemini-analyzer');

export class GeminiAnalyzer {
  private initialized = false;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing GeminiAnalyzer...');
      
      if (!config.google.apiKey) {
        throw new Error('Google API key not configured');
      }
      
      this.genAI = new GoogleGenerativeAI(config.google.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Test the connection
      await this.testConnection();
      
      this.initialized = true;
      logger.info('GeminiAnalyzer initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize GeminiAnalyzer', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async analyzeSignal(signal: Signal, newsData: NewsItem[]): Promise<AnalysisResult> {
    try {
      if (!this.initialized || !this.model) {
        throw new Error('GeminiAnalyzer not initialized');
      }

      logger.info('Starting signal analysis', {
        signalId: signal.id,
        symbol: signal.symbol,
        newsCount: newsData.length
      });

      const startTime = Date.now();
      
      // Prepare analysis prompt
      const prompt = this.buildAnalysisPrompt(signal, newsData);
      
      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      // Parse the AI response
      const analysisResult = this.parseAnalysisResponse(signal, newsData, analysisText);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Signal analysis completed', {
        signalId: signal.id,
        processingTime,
        recommendation: analysisResult.analysis.recommendation
      });

      return {
        ...analysisResult,
        processingTime,
        aiModel: 'gemini-pro',
        version: '1.0.0'
      };
      
    } catch (error) {
      logger.error('Failed to analyze signal', {
        signalId: signal.id,
        error
      });
      
      // Return fallback analysis on error
      return this.createFallbackAnalysis(signal, newsData);
    }
  }

  private async testConnection(): Promise<void> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized');
      }
      
      const result = await this.model.generateContent('Test connection');
      await result.response;
      
      logger.info('Gemini API connection test successful');
      
    } catch (error) {
      logger.error('Gemini API connection test failed', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(signal: Signal, newsData: NewsItem[]): string {
    const newsContext = newsData.map(news => ({
      title: news.title,
      description: news.description,
      sentiment: news.sentimentScore,
      relevance: news.relevanceScore,
      source: news.source
    }));

    return `
거래 신호 분석을 요청합니다. 다음 정보를 바탕으로 상세한 분석을 제공해주세요:

## 거래 신호 정보
- 심볼: ${signal.symbol}
- 액션: ${signal.action}
- 신뢰도: ${signal.confidence}
- 소스: ${signal.source}
- 생성시간: ${signal.timestamp}

## 관련 뉴스 정보 (${newsData.length}개)
${newsContext.map((news, idx) => `
${idx + 1}. 제목: ${news.title}
   설명: ${news.description}
   감정점수: ${news.sentiment} (-1~1)
   관련도: ${news.relevance} (0~1)
   출처: ${news.source}
`).join('')}

## 분석 요청사항
다음 형식으로 JSON 응답을 제공해주세요:

{
  "recommendation": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "confidence": 0.85,
  "reasoning": "상세한 분석 근거를 한국어로 작성",
  "keyFactors": ["주요 고려사항1", "주요 고려사항2", "주요 고려사항3"],
  "riskLevel": "LOW|MEDIUM|HIGH|VERY_HIGH",
  "riskScore": 0.3,
  "riskFactors": ["리스크 요인1", "리스크 요인2"],
  "mitigation": ["완화 방안1", "완화 방안2"],
  "marketSentiment": "BULLISH|BEARISH|NEUTRAL",
  "volatility": "LOW|MEDIUM|HIGH",
  "newsImpact": "POSITIVE|NEGATIVE|NEUTRAL",
  "timeframe": "SHORT|MEDIUM|LONG",
  "keyTopics": ["주요 토픽1", "주요 토픽2"],
  "impactAssessment": "뉴스가 신호에 미치는 영향 평가"
}

분석 시 고려사항:
1. 신호의 방향성과 뉴스 감정의 일치성
2. 뉴스의 관련도와 신뢰성
3. 시장 전반적인 상황
4. 리스크 요인과 완화 방안
5. 단기/중기/장기 전망

한국어로 상세하고 구체적인 분석을 제공해주세요.
`;
  }

  private parseAnalysisResponse(signal: Signal, newsData: NewsItem[], analysisText: string): AnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      let parsedData: any = {};
      
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          logger.warn('Failed to parse JSON from Gemini response, using fallback');
        }
      }
      
      // Calculate news analysis
      const newsAnalysis = this.analyzeNewsData(newsData);
      
      return {
        signalId: signal.id,
        signal: {
          symbol: signal.symbol,
          action: signal.action,
          confidence: signal.confidence || 0.5,
          source: signal.source
        },
        analysis: {
          recommendation: this.parseRecommendation(parsedData.recommendation) || 'HOLD',
          confidence: this.normalizeConfidence(parsedData.confidence) || 0.5,
          reasoning: parsedData.reasoning || '기본 분석이 제공됩니다.',
          keyFactors: Array.isArray(parsedData.keyFactors) ? parsedData.keyFactors : ['시장 분석 필요']
        },
        riskAssessment: {
          level: this.parseRiskLevel(parsedData.riskLevel) || 'MEDIUM',
          score: this.normalizeScore(parsedData.riskScore) || 0.5,
          factors: Array.isArray(parsedData.riskFactors) ? parsedData.riskFactors : ['일반적인 시장 리스크'],
          mitigation: Array.isArray(parsedData.mitigation) ? parsedData.mitigation : ['신중한 포지션 관리']
        },
        marketContext: {
          sentiment: this.parseMarketSentiment(parsedData.marketSentiment) || 'NEUTRAL',
          volatility: this.parseVolatility(parsedData.volatility) || 'MEDIUM',
          newsImpact: this.parseNewsImpact(parsedData.newsImpact) || 'NEUTRAL',
          timeframe: this.parseTimeframe(parsedData.timeframe) || 'SHORT'
        },
        newsAnalysis: {
          relevantNewsCount: newsData.length,
          sentimentScore: newsAnalysis.avgSentiment,
          keyTopics: Array.isArray(parsedData.keyTopics) ? parsedData.keyTopics : ['시장 동향'],
          impactAssessment: parsedData.impactAssessment || '뉴스의 영향은 제한적입니다.'
        },
        timestamp: new Date(),
        processingTime: 0, // Will be set by caller
        aiModel: 'gemini-pro',
        version: '1.0.0'
      };
      
    } catch (error) {
      logger.error('Failed to parse analysis response', error);
      return this.createFallbackAnalysis(signal, newsData);
    }
  }

  private analyzeNewsData(newsData: NewsItem[]) {
    const sentimentScores = newsData.map(item => item.sentimentScore || 0);
    const avgSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
      : 0;

    const relevanceScores = newsData.map(item => item.relevanceScore || 0);
    const avgRelevance = relevanceScores.length > 0
      ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
      : 0;

    return { avgSentiment, avgRelevance };
  }

  private createFallbackAnalysis(signal: Signal, newsData: NewsItem[]): AnalysisResult {
    const newsAnalysis = this.analyzeNewsData(newsData);
    
    // Simple rule-based analysis as fallback
    const isPositiveNews = newsAnalysis.avgSentiment > 0.2;
    const isNegativeNews = newsAnalysis.avgSentiment < -0.2;
    
    let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';
    let confidence = signal.confidence || 0.5;
    
    if (signal.action === 'BUY' && isPositiveNews) {
      recommendation = (signal.confidence || 0.5) > 0.8 ? 'STRONG_BUY' : 'BUY';
      confidence = Math.min(0.95, confidence + 0.1);
    } else if (signal.action === 'SELL' && isNegativeNews) {
      recommendation = (signal.confidence || 0.5) > 0.8 ? 'STRONG_SELL' : 'SELL';
      confidence = Math.min(0.95, confidence + 0.1);
    } else if ((signal.action === 'BUY' && isNegativeNews) || (signal.action === 'SELL' && isPositiveNews)) {
      confidence = Math.max(0.3, confidence - 0.2);
    }

    return {
      signalId: signal.id,
      signal: {
        symbol: signal.symbol,
        action: signal.action,
        confidence: signal.confidence || 0.5,
        source: signal.source
      },
      analysis: {
        recommendation,
        confidence,
        reasoning: `${signal.symbol} ${signal.action} 신호에 대한 기본 분석입니다. 뉴스 감정 점수: ${newsAnalysis.avgSentiment.toFixed(2)}`,
        keyFactors: ['신호 신뢰도', '뉴스 감정 분석', '시장 상황']
      },
      riskAssessment: {
        level: newsData.length < 3 ? 'HIGH' : 'MEDIUM',
        score: newsData.length < 3 ? 0.7 : 0.5,
        factors: ['제한된 뉴스 정보', '시장 변동성'],
        mitigation: ['추가 정보 수집', '포지션 크기 조정']
      },
      marketContext: {
        sentiment: isPositiveNews ? 'BULLISH' : isNegativeNews ? 'BEARISH' : 'NEUTRAL',
        volatility: 'MEDIUM',
        newsImpact: isPositiveNews ? 'POSITIVE' : isNegativeNews ? 'NEGATIVE' : 'NEUTRAL',
        timeframe: 'SHORT'
      },
      newsAnalysis: {
        relevantNewsCount: newsData.length,
        sentimentScore: newsAnalysis.avgSentiment,
        keyTopics: ['시장 동향', '기술적 분석'],
        impactAssessment: '기본 뉴스 분석이 적용되었습니다.'
      },
      timestamp: new Date(),
      processingTime: 0,
      aiModel: 'gemini-pro-fallback',
      version: '1.0.0'
    };
  }

  // Helper parsing methods
  private parseRecommendation(value: string): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' | null {
    const validValues = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];
    return validValues.includes(value) ? value as any : null;
  }

  private parseRiskLevel(value: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | null {
    const validValues = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
    return validValues.includes(value) ? value as any : null;
  }

  private parseMarketSentiment(value: string): 'BULLISH' | 'BEARISH' | 'NEUTRAL' | null {
    const validValues = ['BULLISH', 'BEARISH', 'NEUTRAL'];
    return validValues.includes(value) ? value as any : null;
  }

  private parseVolatility(value: string): 'LOW' | 'MEDIUM' | 'HIGH' | null {
    const validValues = ['LOW', 'MEDIUM', 'HIGH'];
    return validValues.includes(value) ? value as any : null;
  }

  private parseNewsImpact(value: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | null {
    const validValues = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'];
    return validValues.includes(value) ? value as any : null;
  }

  private parseTimeframe(value: string): 'SHORT' | 'MEDIUM' | 'LONG' | null {
    const validValues = ['SHORT', 'MEDIUM', 'LONG'];
    return validValues.includes(value) ? value as any : null;
  }

  private normalizeConfidence(value: any): number | null {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 1 ? num : null;
  }

  private normalizeScore(value: any): number | null {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 1 ? num : null;
  }
}