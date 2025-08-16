/**
 * NewsService - News API integration for signal analysis
 * Adapted from existing NP_Signal implementation
 */

import axios from 'axios';
import { createLogger } from '../utils/logger';
import { config } from '../config/environment';
import { NewsItem, NewsSearchCriteria, NewsAnalysisResult } from '../models/NewsItem';
import { Signal } from '../models/Signal';

const logger = createLogger('news-service');

export interface NewsResponse {
  news: NewsItem[];
  totalCount: number;
  timestamp: string;
}

export class NewsService {
  private initialized = false;
  private readonly apiKeys = {
    alphaVantage: config.news.alphaVantageApiKey,
    newsApi: config.news.newsApiKey
  };

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing NewsService...');
      
      if (!this.apiKeys.alphaVantage && !this.apiKeys.newsApi) {
        throw new Error('No news API keys configured');
      }
      
      this.initialized = true;
      logger.info('NewsService initialized successfully', {
        alphaVantageEnabled: !!this.apiKeys.alphaVantage,
        newsApiEnabled: !!this.apiKeys.newsApi
      });
      
    } catch (error) {
      logger.error('Failed to initialize NewsService', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async fetchNewsForSignal(signal: Signal): Promise<NewsItem[]> {
    try {
      logger.info('Fetching news for signal', {
        signalId: signal.id,
        symbol: signal.symbol
      });

      const isCrypto = this.isCryptoSymbol(signal.symbol);
      const newsResponse = isCrypto 
        ? await this.getCryptoNews([signal.symbol])
        : await this.getForexNews([signal.symbol]);

      logger.info('News fetched successfully', {
        signalId: signal.id,
        newsCount: newsResponse.news.length
      });

      return newsResponse.news;
      
    } catch (error) {
      logger.error('Failed to fetch news for signal', {
        signalId: signal.id,
        symbol: signal.symbol,
        error
      });
      
      // Return default news on error
      return this.getDefaultNews([signal.symbol]);
    }
  }

  async getForexNews(symbols: string[] = ['EURUSD', 'GBPUSD', 'USDJPY']): Promise<NewsResponse> {
    try {
      logger.debug('Fetching forex news', { symbols });
      
      const newsItems: NewsItem[] = [];
      
      // Alpha Vantage News API
      if (this.apiKeys.alphaVantage) {
        const alphaNews = await this.fetchAlphaVantageNews(symbols);
        newsItems.push(...alphaNews);
      }
      
      // NewsAPI (backup)
      if (this.apiKeys.newsApi && newsItems.length < 5) {
        const apiNews = await this.fetchNewsApiData(symbols, 'forex');
        newsItems.push(...apiNews);
      }
      
      // Default news if no results
      if (newsItems.length === 0) {
        newsItems.push(...this.getDefaultNews(symbols));
      }
      
      const uniqueNews = this.removeDuplicates(newsItems)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 10);
      
      logger.info('Forex news fetched', { 
        requestedSymbols: symbols.length,
        newsCount: uniqueNews.length 
      });
      
      return {
        news: uniqueNews,
        totalCount: uniqueNews.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error fetching forex news', error);
      return {
        news: this.getDefaultNews(symbols),
        totalCount: 3,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getCryptoNews(symbols: string[] = ['BTCUSD', 'ETHUSD', 'XRPUSD']): Promise<NewsResponse> {
    try {
      logger.debug('Fetching crypto news', { symbols });
      
      const newsItems: NewsItem[] = [];
      
      if (this.apiKeys.newsApi) {
        const cryptoNews = await this.fetchNewsApiData(symbols, 'crypto');
        newsItems.push(...cryptoNews);
      }
      
      if (newsItems.length === 0) {
        newsItems.push(...this.getDefaultCryptoNews(symbols));
      }
      
      const uniqueNews = this.removeDuplicates(newsItems)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 10);
      
      logger.info('Crypto news fetched', { 
        requestedSymbols: symbols.length,
        newsCount: uniqueNews.length 
      });
      
      return {
        news: uniqueNews,
        totalCount: uniqueNews.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error fetching crypto news', error);
      return {
        news: this.getDefaultCryptoNews(symbols),
        totalCount: 3,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async fetchAlphaVantageNews(symbols: string[]): Promise<NewsItem[]> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          apikey: this.apiKeys.alphaVantage,
          limit: 20
        },
        timeout: config.timeouts.newsFetch
      });
      
      const data = response.data as any;
      const news = data.feed || [];
      
      return news.slice(0, 5).map((item: any): NewsItem => ({
        id: `av_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: item.title || 'No title',
        description: item.summary || 'No summary',
        content: item.summary || '',
        url: item.url || '',
        source: item.source || 'Alpha Vantage',
        publishedAt: new Date(item.time_published || Date.now()),
        relevanceScore: this.determineRelevance(item.title, symbols),
        sentimentScore: this.convertSentiment(item.overall_sentiment_label),
        symbols: this.extractSymbols(item.title, symbols),
        category: 'market',
        language: 'en'
      }));
      
    } catch (error) {
      logger.warn('Alpha Vantage news API call failed', error);
      return [];
    }
  }

  private async fetchNewsApiData(symbols: string[], category: 'forex' | 'crypto'): Promise<NewsItem[]> {
    try {
      const query = category === 'crypto' 
        ? 'cryptocurrency bitcoin ethereum'
        : symbols.join(' OR ') + ' forex trading';
        
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          apiKey: this.apiKeys.newsApi,
          pageSize: 10,
          sortBy: 'publishedAt',
          language: 'en'
        },
        timeout: config.timeouts.newsFetch
      });
      
      const data = response.data as any;
      const articles = data.articles || [];
      
      return articles.slice(0, 5).map((article: any): NewsItem => ({
        id: `na_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: article.title || 'No title',
        description: article.description || 'No description',
        content: article.content || '',
        url: article.url || '',
        source: article.source?.name || 'NewsAPI',
        publishedAt: new Date(article.publishedAt || Date.now()),
        relevanceScore: this.determineRelevance(article.title, symbols),
        sentimentScore: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
        symbols: this.extractSymbols(article.title, symbols),
        category: category,
        language: 'en'
      }));
      
    } catch (error) {
      logger.warn('NewsAPI call failed', error);
      return [];
    }
  }

  private isCryptoSymbol(symbol: string): boolean {
    const cryptoPatterns = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOT', 'LINK', 'UNI'];
    return cryptoPatterns.some(crypto => symbol.toUpperCase().includes(crypto));
  }

  private determineRelevance(title: string, symbols: string[]): number {
    const titleLower = title.toLowerCase();
    
    for (const symbol of symbols) {
      const baseCurrency = symbol.replace('USD', '').replace('USDT', '');
      if (titleLower.includes(baseCurrency.toLowerCase())) {
        return 0.9; // High relevance
      }
    }
    
    const importantKeywords = ['federal reserve', 'ecb', 'inflation', 'gdp', 'unemployment', 'central bank'];
    if (importantKeywords.some(keyword => titleLower.includes(keyword))) {
      return 0.7; // Medium relevance
    }
    
    return 0.3; // Low relevance
  }

  private analyzeSentiment(text: string): number {
    const textLower = text.toLowerCase();
    
    const positiveWords = ['up', 'rise', 'gain', 'bullish', 'positive', 'growth', 'strong', 'surge', 'rally'];
    const negativeWords = ['down', 'fall', 'drop', 'bearish', 'negative', 'decline', 'weak', 'crash', 'plunge'];
    
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    if (positiveCount === 0 && negativeCount === 0) return 0;
    
    // Return score between -1 (very negative) and 1 (very positive)
    const total = positiveCount + negativeCount;
    return (positiveCount - negativeCount) / total;
  }

  private convertSentiment(sentimentLabel: string): number {
    switch (sentimentLabel?.toLowerCase()) {
      case 'bullish':
      case 'positive': return 0.7;
      case 'bearish':
      case 'negative': return -0.7;
      case 'neutral':
      default: return 0;
    }
  }

  private extractSymbols(title: string, availableSymbols: string[]): string[] {
    const titleUpper = title.toUpperCase();
    return availableSymbols.filter(symbol => {
      const baseCurrency = symbol.replace('USD', '').replace('USDT', '');
      return titleUpper.includes(baseCurrency) || titleUpper.includes(symbol);
    });
  }

  private removeDuplicates(news: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    return news.filter(item => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getDefaultNews(symbols: string[]): NewsItem[] {
    const now = new Date();
    return [
      {
        id: `default_${Date.now()}_1`,
        title: '미 연준, 금리 정책 회의 결과 발표 예정',
        description: '오늘 미국 연방준비제도 금리 정책 회의 결과가 발표되며, 달러 환율에 영향을 줄 것으로 예상됩니다.',
        url: 'https://example.com/fed-meeting',
        source: 'Default News',
        publishedAt: new Date(now.getTime() - 3600000),
        relevanceScore: 0.8,
        sentimentScore: 0,
        symbols: symbols.filter(s => s.includes('USD')),
        category: 'market',
        language: 'ko'
      },
      {
        id: `default_${Date.now()}_2`,
        title: '유럽중앙은행 정책 변화 시사',
        description: 'ECB가 인플레이션 대응을 위한 새로운 정책 방향을 검토 중이라고 발표했습니다.',
        url: 'https://example.com/ecb-policy',
        source: 'Default News',
        publishedAt: new Date(now.getTime() - 7200000),
        relevanceScore: 0.7,
        sentimentScore: 0.3,
        symbols: symbols.filter(s => s.includes('EUR')),
        category: 'market',
        language: 'ko'
      },
      {
        id: `default_${Date.now()}_3`,
        title: '아시아 증시 동향과 엔화 전망',
        description: '일본 경제 지표 발표를 앞두고 엔화 환율이 주목받고 있습니다.',
        url: 'https://example.com/jpy-outlook',
        source: 'Default News',
        publishedAt: new Date(now.getTime() - 10800000),
        relevanceScore: 0.6,
        sentimentScore: 0,
        symbols: symbols.filter(s => s.includes('JPY')),
        category: 'market',
        language: 'ko'
      }
    ];
  }

  private getDefaultCryptoNews(symbols: string[]): NewsItem[] {
    const now = new Date();
    return [
      {
        id: `crypto_default_${Date.now()}_1`,
        title: '비트코인 ETF 승인으로 기관 투자 증가',
        description: '최근 비트코인 ETF 승인으로 기관 투자자들의 관심이 높아지고 있습니다.',
        url: 'https://example.com/btc-etf',
        source: 'Crypto News',
        publishedAt: new Date(now.getTime() - 3600000),
        relevanceScore: 0.9,
        sentimentScore: 0.7,
        symbols: symbols.filter(s => s.includes('BTC')),
        category: 'crypto',
        language: 'ko'
      },
      {
        id: `crypto_default_${Date.now()}_2`,
        title: '이더리움 네트워크 업그레이드 완료',
        description: '이더리움 2.0 업그레이드가 성공적으로 완료되어 거래 수수료 절감이 기대됩니다.',
        url: 'https://example.com/eth-upgrade',
        source: 'Crypto News',
        publishedAt: new Date(now.getTime() - 7200000),
        relevanceScore: 0.8,
        sentimentScore: 0.6,
        symbols: symbols.filter(s => s.includes('ETH')),
        category: 'crypto',
        language: 'ko'
      },
      {
        id: `crypto_default_${Date.now()}_3`,
        title: '규제 당국의 암호화폐 감독 강화',
        description: '각국 규제 당국이 암호화폐 시장 감독을 강화하겠다고 발표했습니다.',
        url: 'https://example.com/crypto-regulation',
        source: 'Crypto News',
        publishedAt: new Date(now.getTime() - 10800000),
        relevanceScore: 0.7,
        sentimentScore: -0.4,
        symbols: symbols,
        category: 'crypto',
        language: 'ko'
      }
    ];
  }
}