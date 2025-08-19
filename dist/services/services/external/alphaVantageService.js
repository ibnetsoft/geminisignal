"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/alphaVantageService.ts
const axios_1 = __importDefault(require("axios"));
class AlphaVantageService {
    constructor(apiKey) {
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.apiKey = apiKey;
    }
    // 종목별 뉴스 가져오기
    async getMarketNews(options = {}) {
        try {
            const params = new URLSearchParams({
                function: 'NEWS_SENTIMENT',
                apikey: this.apiKey,
                sort: options.sort || 'LATEST',
                limit: (options.limit || 50).toString()
            });
            if (options.tickers) {
                params.append('tickers', options.tickers);
            }
            if (options.topics) {
                params.append('topics', options.topics);
            }
            if (options.time_from) {
                params.append('time_from', options.time_from);
            }
            if (options.time_to) {
                params.append('time_to', options.time_to);
            }
            console.log(`Alpha Vantage API 호출: ${this.baseUrl}?${params.toString()}`);
            const response = await axios_1.default.get(`${this.baseUrl}?${params.toString()}`, {
                timeout: 10000
            });
            const data = response.data;
            if (data.Note) {
                throw new Error('API 호출 한도 초과: ' + data.Note);
            }
            if (data.Information) {
                throw new Error('API 정보: ' + data.Information);
            }
            const newsData = data;
            return newsData.feed || [];
        }
        catch (error) {
            console.error('Alpha Vantage API 호출 오류:', error);
            if (error.response) {
                // Axios 에러인 경우
                throw new Error(`API 호출 실패: ${error.response.status} - ${error.message}`);
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('알 수 없는 오류가 발생했습니다.');
        }
    }
    // 심볼별 관련 뉴스 필터링
    async getSymbolRelatedNews(symbol, limit = 10) {
        try {
            // 심볼별 티커 매핑
            const tickerMap = {
                'BTCUSD': 'CRYPTO:BTC',
                'XAUUSD': 'FOREX:XAUUSD',
                'EURUSD': 'FOREX:EURUSD',
                'NAS100': 'IXIC', // Nasdaq Composite
                'HKG33': 'HSI', // Hang Seng Index
                'USOUSD': 'CRUDE_OIL_WTI'
            };
            const ticker = tickerMap[symbol.toUpperCase()];
            let newsItems = [];
            if (ticker) {
                // 특정 티커로 뉴스 조회
                newsItems = await this.getMarketNews({
                    tickers: ticker,
                    limit: limit,
                    sort: 'LATEST'
                });
            }
            else {
                // 티커가 없으면 일반 금융 뉴스 조회
                newsItems = await this.getMarketNews({
                    topics: 'financial_markets',
                    limit: limit,
                    sort: 'LATEST'
                });
            }
            // 뉴스 요약 추출
            const insights = newsItems
                .filter(item => item.summary && item.summary.length > 20)
                .slice(0, limit)
                .map(item => {
                const sentiment = item.overall_sentiment_label === 'Bullish' ? '긍정적' :
                    item.overall_sentiment_label === 'Bearish' ? '부정적' : '중립적';
                return `[${sentiment}] ${item.title.substring(0, 100)}${item.title.length > 100 ? '...' : ''}`;
            });
            console.log(`${symbol}에 대한 ${insights.length}개의 뉴스 인사이트를 가져왔습니다.`);
            return insights;
        }
        catch (error) {
            console.error(`${symbol} 뉴스 조회 오류:`, error);
            // 오류 발생 시 빈 배열 반환 (기존 시스템 동작 유지)
            return [];
        }
    }
    // API 상태 확인
    async checkApiStatus() {
        try {
            const response = await this.getMarketNews({ limit: 1 });
            return response.length >= 0;
        }
        catch (error) {
            console.error('Alpha Vantage API 상태 확인 실패:', error);
            return false;
        }
    }
}
exports.default = AlphaVantageService;
