/**
 * NewsItem Model - News data structure for market analysis
 */

export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: Date;
  relevanceScore?: number;
  sentimentScore?: number;
  symbols?: string[];
  category?: string;
  language?: string;
  metadata?: Record<string, any>;
}

export interface NewsSearchCriteria {
  symbols: string[];
  timeRange: {
    from: Date;
    to: Date;
  };
  maxResults?: number;
  sources?: string[];
  languages?: string[];
  minRelevanceScore?: number;
}

export interface NewsAnalysisResult {
  relevantNews: NewsItem[];
  sentimentAnalysis: {
    overall: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
    confidence: number; // 0 to 1
  };
  keyTopics: string[];
  marketImpact: {
    level: 'low' | 'medium' | 'high';
    direction: 'bullish' | 'bearish' | 'neutral';
    timeframe: 'short' | 'medium' | 'long';
  };
}

export class NewsItemValidator {
  static validate(data: any): { isValid: boolean; errors: string[]; normalizedNews?: NewsItem } {
    const errors: string[] = [];
    
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required and must be a string');
    }
    
    if (!data.url || typeof data.url !== 'string') {
      errors.push('URL is required and must be a string');
    }
    
    if (!data.source || typeof data.source !== 'string') {
      errors.push('Source is required and must be a string');
    }
    
    if (!data.publishedAt) {
      errors.push('PublishedAt is required');
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    
    const normalizedNews: NewsItem = {
      id: data.id || `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title,
      description: data.description || '',
      content: data.content || '',
      url: data.url,
      source: data.source,
      publishedAt: new Date(data.publishedAt),
      relevanceScore: data.relevanceScore || 0,
      sentimentScore: data.sentimentScore || 0,
      symbols: data.symbols || [],
      category: data.category || 'general',
      language: data.language || 'en',
      metadata: data.metadata || {}
    };
    
    return { isValid: true, errors: [], normalizedNews };
  }
}