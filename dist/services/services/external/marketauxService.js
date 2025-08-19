"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/marketauxService.ts
const axios_1 = __importDefault(require("axios"));
class MarketauxService {
    constructor(apiKey) {
        this.baseUrl = 'https://api.marketaux.com/v1';
        this.apiKey = apiKey;
    }
    // 뉴스 검색 (메인 기능)
    async getNews(params = {}) {
        try {
            const defaultParams = {
                limit: 50,
                sort: 'published_desc',
                filter_entities: true,
                must_have_entities: true,
                group_similar: false,
                ...params
            };
            const response = await axios_1.default.get(`${this.baseUrl}/news/all`, {
                params: {
                    ...defaultParams,
                    api_token: this.apiKey
                },
                timeout: 15000
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('MarketAux 뉴스 조회 오류:', error);
            if (error.response?.status === 429) {
                console.error('MarketAux API 호출 한도 초과');
            }
            return [];
        }
    }
    // 특정 심볼 뉴스
    async getSymbolNews(symbols, limit = 20) {
        try {
            // MarketAux는 심볼을 쉼표로 구분하여 전달
            const symbolString = symbols.join(',');
            return await this.getNews({
                symbols: symbolString,
                limit: limit,
                sort: 'published_desc',
                filter_entities: true,
                must_have_entities: true
            });
        }
        catch (error) {
            console.error(`MarketAux ${symbols.join(',')} 뉴스 조회 오류:`, error);
            return [];
        }
    }
    // 감정 분석 기반 뉴스
    async getSentimentNews(sentiment, limit = 20) {
        try {
            let sentimentParams = {};
            switch (sentiment) {
                case 'positive':
                    sentimentParams = { sentiment_gte: 0.1 };
                    break;
                case 'negative':
                    sentimentParams = { sentiment_lte: -0.1 };
                    break;
                case 'neutral':
                    sentimentParams = { sentiment_gte: -0.1, sentiment_lte: 0.1 };
                    break;
            }
            return await this.getNews({
                ...sentimentParams,
                limit: limit,
                sort: 'published_desc'
            });
        }
        catch (error) {
            console.error(`MarketAux ${sentiment} 감정 뉴스 조회 오류:`, error);
            return [];
        }
    }
    // 산업별 뉴스
    async getIndustryNews(industries, limit = 20) {
        try {
            const industryString = industries.join(',');
            return await this.getNews({
                industries: industryString,
                limit: limit,
                sort: 'published_desc'
            });
        }
        catch (error) {
            console.error(`MarketAux ${industries.join(',')} 산업 뉴스 조회 오류:`, error);
            return [];
        }
    }
    // 국가별 뉴스
    async getCountryNews(countries, limit = 20) {
        try {
            const countryString = countries.join(',');
            return await this.getNews({
                countries: countryString,
                limit: limit,
                sort: 'published_desc'
            });
        }
        catch (error) {
            console.error(`MarketAux ${countries.join(',')} 국가 뉴스 조회 오류:`, error);
            return [];
        }
    }
    // 키워드 검색 뉴스
    async searchNews(query, limit = 20) {
        try {
            return await this.getNews({
                search: query,
                limit: limit,
                sort: 'relevance_desc'
            });
        }
        catch (error) {
            console.error(`MarketAux "${query}" 검색 오류:`, error);
            return [];
        }
    }
    // 고품질 뉴스 (높은 매치 스코어)
    async getHighQualityNews(minMatchScore = 50, limit = 20) {
        try {
            return await this.getNews({
                min_match_score: minMatchScore,
                limit: limit,
                sort: 'published_desc',
                filter_entities: true
            });
        }
        catch (error) {
            console.error('MarketAux 고품질 뉴스 조회 오류:', error);
            return [];
        }
    }
    // 특정 기간 뉴스
    async getNewsInDateRange(startDate, endDate, limit = 50) {
        try {
            return await this.getNews({
                published_after: startDate,
                published_before: endDate,
                limit: limit,
                sort: 'published_desc'
            });
        }
        catch (error) {
            console.error(`MarketAux ${startDate}~${endDate} 기간 뉴스 조회 오류:`, error);
            return [];
        }
    }
    // 심볼별 인사이트 생성
    async getSymbolInsights(symbol) {
        try {
            const insights = [];
            // 심볼 매핑 (MarketAux는 다양한 심볼 형식 지원)
            const symbolMap = {
                'BTCUSD': ['BTC', 'BTCUSD', 'Bitcoin'],
                'XAUUSD': ['GOLD', 'GLD', 'XAU'],
                'EURUSD': ['EUR', 'EURUSD'],
                'NAS100': ['NASDAQ', 'QQQ', 'IXIC'],
                'HKG33': ['HSI', 'HK', 'HANG SENG'],
                'USOUSD': ['OIL', 'USO', 'CL', 'WTI'],
                'SPX500': ['SPY', 'SPX', 'S&P'],
                'GER40': ['DAX', 'EWG'],
                'UK100': ['FTSE', 'EWU']
            };
            const searchSymbols = symbolMap[symbol.toUpperCase()] || [symbol];
            // 1. 심볼 관련 최신 뉴스
            const symbolNews = await this.getSymbolNews(searchSymbols, 3);
            symbolNews.forEach(news => {
                const sentiment = this.getSentimentLabel(news.entities);
                insights.push(`[${news.source}] ${news.title.substring(0, 100)}... (감정: ${sentiment})`);
            });
            // 2. 긍정적 뉴스
            const positiveNews = await this.getSentimentNews('positive', 2);
            if (positiveNews.length > 0) {
                insights.push(`📈 긍정적 시장 뉴스: ${positiveNews[0].title.substring(0, 80)}...`);
            }
            // 3. 부정적 뉴스
            const negativeNews = await this.getSentimentNews('negative', 2);
            if (negativeNews.length > 0) {
                insights.push(`📉 부정적 시장 뉴스: ${negativeNews[0].title.substring(0, 80)}...`);
            }
            console.log(`${symbol}에 대한 ${insights.length}개의 MarketAux 인사이트를 가져왔습니다.`);
            return insights;
        }
        catch (error) {
            console.error(`${symbol} MarketAux 인사이트 조회 오류:`, error);
            return [];
        }
    }
    // 감정 라벨 생성 헬퍼
    getSentimentLabel(entities) {
        if (!entities || entities.length === 0)
            return '중립';
        const avgSentiment = entities.reduce((sum, entity) => {
            return sum + (entity.sentiment_score || 0);
        }, 0) / entities.length;
        if (avgSentiment > 0.1)
            return '긍정';
        if (avgSentiment < -0.1)
            return '부정';
        return '중립';
    }
    // 실시간 트렌딩 뉴스
    async getTrendingNews(limit = 10) {
        try {
            return await this.getNews({
                limit: limit,
                sort: 'relevance_desc',
                filter_entities: true,
                group_similar: true
            });
        }
        catch (error) {
            console.error('MarketAux 트렌딩 뉴스 조회 오류:', error);
            return [];
        }
    }
    // API 상태 확인 (타입 오류 수정)
    async checkApiStatus() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/news/all`, {
                params: {
                    limit: 1,
                    api_token: this.apiKey
                },
                timeout: 5000
            });
            return response.status === 200 && !!response.data?.data;
        }
        catch (error) {
            console.error('MarketAux API 상태 확인 실패:', error);
            return false;
        }
    }
    // 배치 심볼 분석
    async getBatchSymbolInsights(symbols) {
        const results = {};
        // API 호출 제한을 고려한 배치 처리
        const batchSize = 3;
        for (let i = 0; i < symbols.length; i += batchSize) {
            const batch = symbols.slice(i, i + batchSize);
            const promises = batch.map(async (symbol) => {
                const insights = await this.getSymbolInsights(symbol);
                return { symbol, insights };
            });
            const batchResults = await Promise.allSettled(promises);
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    results[result.value.symbol] = result.value.insights;
                }
            });
            // API 호출 간격 조절
            if (i + batchSize < symbols.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        return results;
    }
}
exports.default = MarketauxService;
