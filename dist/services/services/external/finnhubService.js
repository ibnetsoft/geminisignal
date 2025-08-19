"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/finnhubService.ts
const axios_1 = __importDefault(require("axios"));
class FinnhubService {
    constructor(apiKey) {
        this.baseUrl = 'https://finnhub.io/api/v1';
        this.apiKey = apiKey;
    }
    // 종목별 뉴스 가져오기
    async getCompanyNews(symbol, from, to) {
        try {
            const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const toDate = to || new Date().toISOString().split('T')[0];
            const response = await axios_1.default.get(`${this.baseUrl}/company-news`, {
                params: {
                    symbol: symbol,
                    from: fromDate,
                    to: toDate,
                    token: this.apiKey
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            console.error(`Finnhub ${symbol} 뉴스 조회 오류:`, error);
            return [];
        }
    }
    // 일반 마켓 뉴스 가져오기
    async getMarketNews(category = 'general') {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/news`, {
                params: {
                    category: category,
                    token: this.apiKey
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            console.error('Finnhub 마켓 뉴스 조회 오류:', error);
            return [];
        }
    }
    // 경제 캘린더 가져오기
    async getEconomicCalendar(from, to) {
        const fromDate = from || new Date().toISOString().split('T')[0];
        const toDate = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/calendar/economic`, {
                params: {
                    from: fromDate,
                    to: toDate,
                    token: this.apiKey
                },
                timeout: 10000
            });
            // 타입 안전하게 처리
            const data = response.data;
            if (data && data.economicCalendar && Array.isArray(data.economicCalendar)) {
                return data.economicCalendar;
            }
            console.warn('경제 캘린더 데이터가 없습니다:', response.data);
            return [];
        }
        catch (error) {
            console.error('Finnhub 경제 캘린더 조회 오류:', error);
            if (error.response?.status === 429) {
                console.error('API 호출 한도 초과');
            }
            return [];
        }
    }
    // 실시간 가격 정보
    async getQuote(symbol) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/quote`, {
                params: {
                    symbol: symbol,
                    token: this.apiKey
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            console.error(`Finnhub ${symbol} 가격 조회 오류:`, error);
            return null;
        }
    }
    // 암호화폐 뉴스
    async getCryptoNews() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/news`, {
                params: {
                    category: 'crypto',
                    token: this.apiKey
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            console.error('Finnhub 암호화폐 뉴스 조회 오류:', error);
            return [];
        }
    }
    // 암호화폐 심볼 목록 가져오기
    async getCryptoSymbols(exchange = 'BINANCE') {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/crypto/symbol`, {
                params: {
                    exchange: exchange,
                    token: this.apiKey
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            console.error('암호화폐 심볼 조회 오류:', error);
            return [];
        }
    }
    // 포렉스 심볼 목록 가져오기
    async getForexSymbols() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/forex/symbol`, {
                params: {
                    exchange: 'oanda',
                    token: this.apiKey
                },
                timeout: 10000
            });
            // 타입 안전하게 처리
            const data = response.data;
            return Array.isArray(data) ? data : [];
        }
        catch (error) {
            console.error('포렉스 심볼 조회 오류:', error);
            return [];
        }
    }
    // 기술적 지표 가져오기 (RSI)
    async getTechnicalIndicator(symbol, resolution = 'D') {
        try {
            const to = Math.floor(Date.now() / 1000);
            const from = to - (30 * 24 * 60 * 60); // 30일 전
            const response = await axios_1.default.get(`${this.baseUrl}/indicator`, {
                params: {
                    symbol: symbol,
                    resolution: resolution,
                    from: from,
                    to: to,
                    indicator: 'rsi',
                    'indicator_fields[timeperiod]': 14,
                    token: this.apiKey
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            console.error('기술적 지표 조회 오류:', error);
            return null;
        }
    }
    // 심볼별 관련 뉴스 및 데이터 가져오기
    async getSymbolInsights(symbol) {
        try {
            const insights = [];
            // Finnhub에서 지원하는 심볼로 매핑
            const symbolMap = {
                'BTCUSD': { ticker: 'BTCUSD', category: 'crypto' },
                'XAUUSD': { ticker: 'XAUUSD' }, // 금
                'EURUSD': { ticker: 'EURUSD' }, // 유로/달러
                'NAS100': { ticker: 'IXIC' }, // 나스닥
                'HKG33': { ticker: 'HSI' }, // 항셍지수
                'USOUSD': { ticker: 'CL=F' }, // 원유
                'SPX500': { ticker: 'SPX' }, // S&P 500
                'GER40': { ticker: 'DAX' }, // DAX
                'UK100': { ticker: 'UKX' } // FTSE 100
            };
            const config = symbolMap[symbol.toUpperCase()];
            if (config?.ticker) {
                // 1. 가격 정보 가져오기
                const quote = await this.getQuote(config.ticker);
                if (quote && quote.c) {
                    const changePercent = quote.dp > 0 ? '+' + quote.dp.toFixed(2) : quote.dp.toFixed(2);
                    insights.push(`${symbol} 현재가: ${quote.c}, 변동률: ${changePercent}%`);
                }
                // 2. 관련 뉴스 가져오기
                if (config.category === 'crypto') {
                    const cryptoNews = await this.getCryptoNews();
                    const recentNews = cryptoNews.slice(0, 2);
                    recentNews.forEach(item => {
                        insights.push(`[${item.source}] ${item.headline.substring(0, 100)}...`);
                    });
                }
                else {
                    // 일반 마켓 뉴스
                    const marketNews = await this.getMarketNews('general');
                    const recentNews = marketNews.slice(0, 2);
                    recentNews.forEach(item => {
                        insights.push(`[${item.source}] ${item.headline.substring(0, 100)}...`);
                    });
                }
            }
            // 3. 경제 캘린더에서 고영향 이벤트
            const economicEvents = await this.getEconomicCalendar();
            const highImpactEvents = economicEvents
                .filter(event => event.impact === 'high')
                .slice(0, 2);
            highImpactEvents.forEach(event => {
                insights.push(`[경제일정] ${event.event} (${event.country})`);
            });
            console.log(`${symbol}에 대한 ${insights.length}개의 Finnhub 인사이트를 가져왔습니다.`);
            return insights;
        }
        catch (error) {
            console.error(`${symbol} Finnhub 인사이트 조회 오류:`, error);
            return [];
        }
    }
    // API 호출 제한을 고려한 배치 처리
    async getBatchQuotes(symbols) {
        const results = {};
        // API 호출 제한을 위해 배치 크기 제한
        const batchSize = 5;
        for (let i = 0; i < symbols.length; i += batchSize) {
            const batch = symbols.slice(i, i + batchSize);
            const promises = batch.map(async (symbol) => {
                const quote = await this.getQuote(symbol);
                return { symbol, quote };
            });
            const batchResults = await Promise.allSettled(promises);
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    results[result.value.symbol] = result.value.quote;
                }
            });
            // API 호출 간격 조절 (무료 플랜의 경우)
            if (i + batchSize < symbols.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return results;
    }
    // API 상태 확인
    async checkApiStatus() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/news`, {
                params: {
                    category: 'general',
                    token: this.apiKey
                },
                timeout: 5000
            });
            return Array.isArray(response.data) && response.data.length >= 0;
        }
        catch (error) {
            console.error('Finnhub API 상태 확인 실패:', error);
            return false;
        }
    }
}
exports.default = FinnhubService;
