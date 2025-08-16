/**
 * TelegramService - Telegram notification service
 * Adapted from existing NP_Signal implementation
 */

import { Telegraf } from 'telegraf';
import { createLogger } from '../utils/logger';
import { config } from '../config/environment';
import { AnalysisResult, TelegramMessage, AnalysisResultFormatter } from '../models/AnalysisResult';

const logger = createLogger('telegram-service');

export class TelegramService {
  private initialized = false;
  private bot: Telegraf | null = null;
  private readonly botConfig = {
    botToken: config.telegram.botToken,
    chatId: config.telegram.chatId,
    enabled: true
  };

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing TelegramService...');

      if (!this.botConfig.botToken) {
        throw new Error('Telegram bot token not configured');
      }

      if (!this.botConfig.chatId) {
        throw new Error('Telegram chat ID not configured');
      }

      // Create bot instance
      this.bot = new Telegraf(this.botConfig.botToken);

      // Test bot connection
      const botInfo = await this.bot.telegram.getMe();
      logger.info('Telegram bot connected successfully', {
        username: botInfo.username,
        id: botInfo.id
      });

      this.initialized = true;
      logger.info('TelegramService initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize TelegramService', error);
      this.botConfig.enabled = false;
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async sendAnalysis(analysisResult: AnalysisResult): Promise<boolean> {
    try {
      if (!this.initialized || !this.bot) {
        logger.warn('TelegramService not initialized, attempting auto-initialization');
        await this.initialize();
      }

      if (!this.botConfig.enabled) {
        logger.info('Telegram service disabled, skipping message send');
        return false;
      }

      const message = AnalysisResultFormatter.formatForTelegram(analysisResult);
      message.chatId = this.botConfig.chatId;

      const options: any = {
        parse_mode: message.parseMode as 'HTML' | 'Markdown'
      };
      
      if (message.disableWebPagePreview) {
        options.link_preview_options = { is_disabled: true };
      }
      
      if (message.replyToMessageId) {
        options.reply_parameters = { message_id: message.replyToMessageId };
      }

      await this.bot!.telegram.sendMessage(
        message.chatId,
        message.text,
        options
      );

      logger.info('Analysis result sent to Telegram successfully', {
        signalId: analysisResult.signalId,
        symbol: analysisResult.signal.symbol,
        recommendation: analysisResult.analysis.recommendation
      });

      return true;

    } catch (error) {
      logger.error('Failed to send analysis to Telegram', {
        signalId: analysisResult.signalId,
        error
      });
      return false;
    }
  }

  async sendError(signalId: string, error: string): Promise<boolean> {
    try {
      if (!this.initialized || !this.bot || !this.botConfig.enabled) {
        logger.debug('Cannot send error message - service not ready');
        return false;
      }

      const message = AnalysisResultFormatter.formatErrorForTelegram(signalId, error);
      message.chatId = this.botConfig.chatId;

      await this.bot.telegram.sendMessage(
        message.chatId,
        message.text,
        { parse_mode: message.parseMode as 'HTML' | 'Markdown' }
      );

      logger.info('Error notification sent to Telegram', { signalId });
      return true;

    } catch (err) {
      logger.error('Failed to send error notification to Telegram', {
        signalId,
        originalError: error,
        sendError: err
      });
      return false;
    }
  }

  async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    try {
      if (!this.initialized || !this.bot || !this.botConfig.enabled) {
        logger.debug('Cannot send message - service not ready');
        return false;
      }

      await this.bot.telegram.sendMessage(
        this.botConfig.chatId,
        text,
        { parse_mode: parseMode }
      );

      logger.info('Message sent to Telegram successfully');
      return true;

    } catch (error) {
      logger.error('Failed to send message to Telegram', error);
      return false;
    }
  }

  async sendSystemStatus(status: {
    status: string;
    services?: Record<string, boolean>;
    timestamp?: string;
  }): Promise<boolean> {
    try {
      const kstTime = this.convertToKST(new Date().toISOString());
      
      const message = `🔧 <b>시스템 상태 업데이트</b>

📊 <b>상태:</b> ${status.status}
🔥 <b>Firebase:</b> ${status.services?.firebase ? '✅' : '❌'}
📱 <b>텔레그램:</b> ${status.services?.telegram ? '✅' : '❌'}
🧠 <b>AI 분석:</b> ${status.services?.gemini ? '✅' : '❌'}
📰 <b>뉴스 API:</b> ${status.services?.news ? '✅' : '❌'}
⏰ <b>시간:</b> ${kstTime}`;

      return await this.sendMessage(message);

    } catch (error) {
      logger.error('Failed to send system status', error);
      return false;
    }
  }

  async sendStartupNotification(): Promise<boolean> {
    try {
      const message = `🚀 <b>Signal Processor 시작됨</b>

✅ External Signal Processor가 성공적으로 시작되었습니다.
📡 Firestore 신호 모니터링 활성화
🤖 AI 분석 엔진 준비 완료

시스템이 외부 신호를 모니터링하고 있습니다.`;

      return await this.sendMessage(message);

    } catch (error) {
      logger.error('Failed to send startup notification', error);
      return false;
    }
  }

  async sendShutdownNotification(): Promise<boolean> {
    try {
      const message = `⏹️ <b>Signal Processor 종료됨</b>

External Signal Processor가 안전하게 종료되었습니다.
📡 신호 모니터링 중단됨

⏰ <b>종료 시간:</b> ${this.convertToKST(new Date().toISOString())}`;

      return await this.sendMessage(message);

    } catch (error) {
      logger.error('Failed to send shutdown notification', error);
      return false;
    }
  }

  private convertToKST(utcTime: string): string {
    try {
      const date = new Date(utcTime);
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      
      return kstDate.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      logger.error('Time conversion error', error);
      return utcTime;
    }
  }

  getConfig() {
    return {
      enabled: this.botConfig.enabled,
      hasToken: !!this.botConfig.botToken,
      hasChatId: !!this.botConfig.chatId,
      initialized: this.initialized
    };
  }

  disable(): void {
    this.botConfig.enabled = false;
    logger.info('TelegramService disabled');
  }

  enable(): void {
    if (this.initialized) {
      this.botConfig.enabled = true;
      logger.info('TelegramService enabled');
    } else {
      logger.warn('Cannot enable TelegramService - not initialized');
    }
  }
}