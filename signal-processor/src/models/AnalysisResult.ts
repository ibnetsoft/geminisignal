/**
 * AnalysisResult Model - AI analysis output structure
 */

export interface AnalysisResult {
  signalId: string;
  signal: {
    symbol: string;
    action: 'BUY' | 'SELL';
    confidence: number;
    source: string;
  };
  analysis: {
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number; // 0 to 1
    reasoning: string;
    keyFactors: string[];
  };
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    score: number; // 0 to 1
    factors: string[];
    mitigation: string[];
  };
  marketContext: {
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    volatility: 'LOW' | 'MEDIUM' | 'HIGH';
    newsImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    timeframe: 'SHORT' | 'MEDIUM' | 'LONG';
  };
  newsAnalysis: {
    relevantNewsCount: number;
    sentimentScore: number; // -1 to 1
    keyTopics: string[];
    impactAssessment: string;
  };
  timestamp: Date;
  processingTime: number; // milliseconds
  aiModel: string;
  version: string;
}

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  disableWebPagePreview?: boolean;
  replyToMessageId?: number;
}

export interface ProcessingMetrics {
  signalId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'processing' | 'completed' | 'failed';
  steps: {
    signalValidation: { duration: number; success: boolean };
    newsRetrieval: { duration: number; success: boolean; newsCount?: number };
    aiAnalysis: { duration: number; success: boolean; tokenUsage?: number };
    telegramSend: { duration: number; success: boolean };
  };
  errors?: string[];
}

export class AnalysisResultFormatter {
  static formatForTelegram(result: AnalysisResult): TelegramMessage {
    const { signal, analysis, riskAssessment, marketContext, newsAnalysis } = result;
    
    const riskEmoji = {
      'LOW': '🟢',
      'MEDIUM': '🟡', 
      'HIGH': '🟠',
      'VERY_HIGH': '🔴'
    }[riskAssessment.level];
    
    const actionEmoji = signal.action === 'BUY' ? '📈' : '📉';
    const recommendationEmoji = {
      'STRONG_BUY': '🚀',
      'BUY': '📈',
      'HOLD': '⏸️',
      'SELL': '📉',
      'STRONG_SELL': '💥'
    }[analysis.recommendation];
    
    const text = `
${actionEmoji} <b>신호 분석 결과</b>

📊 <b>종목:</b> ${signal.symbol}
🎯 <b>액션:</b> ${signal.action}
⭐ <b>추천:</b> ${recommendationEmoji} ${analysis.recommendation}
🎯 <b>신뢰도:</b> ${Math.round(analysis.confidence * 100)}%

${riskEmoji} <b>리스크 평가:</b> ${riskAssessment.level}
📰 <b>뉴스 분석:</b> ${newsAnalysis.relevantNewsCount}개 기사, 감정점수 ${newsAnalysis.sentimentScore.toFixed(2)}

<b>📝 분석 요약:</b>
${analysis.reasoning}

<b>🔑 주요 요인:</b>
${analysis.keyFactors.map(factor => `• ${factor}`).join('\n')}

<b>⚠️ 리스크 요인:</b>
${riskAssessment.factors.map(factor => `• ${factor}`).join('\n')}

<b>📊 시장 컨텍스트:</b>
• 감정: ${marketContext.sentiment}
• 변동성: ${marketContext.volatility}
• 뉴스 영향: ${marketContext.newsImpact}

<i>분석 시간: ${result.processingTime}ms</i>
    `.trim();

    return {
      chatId: '', // Will be filled by service
      text,
      parseMode: 'HTML',
      disableWebPagePreview: true
    };
  }
  
  static formatErrorForTelegram(signalId: string, error: string): TelegramMessage {
    const text = `
⚠️ <b>신호 처리 오류</b>

🆔 <b>신호 ID:</b> ${signalId}
❌ <b>오류:</b> ${error}

시스템 관리자에게 문의하세요.
    `.trim();

    return {
      chatId: '',
      text,
      parseMode: 'HTML'
    };
  }
}