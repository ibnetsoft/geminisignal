"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramService = void 0;
// services/telegramService.ts - 텔레그램 메시지 전송 서비스
const telegraf_1 = require("telegraf");
class TelegramService {
    constructor() {
        this.bot = null;
        this.isInitialized = false;
        this.config = {
            botToken: process.env.TELEGRAM_BOT_TOKEN || '',
            chatId: process.env.TELEGRAM_CHAT_ID || '',
            enabled: true
        };
    }
    static getInstance() {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }
    /**
     * 텔레그램 서비스 초기화
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ 텔레그램 서비스가 이미 초기화되어 있습니다.');
            return;
        }
        try {
            console.log('🔧 텔레그램 서비스 초기화 시작...');
            if (!this.config.botToken) {
                throw new Error('텔레그램 봇 토큰이 설정되지 않았습니다.');
            }
            if (!this.config.chatId) {
                throw new Error('텔레그램 채팅 ID가 설정되지 않았습니다.');
            }
            // 봇 인스턴스 생성
            this.bot = new telegraf_1.Telegraf(this.config.botToken);
            // 봇 정보 확인
            const botInfo = await this.bot.telegram.getMe();
            console.log(`✅ 텔레그램 봇 연결 성공: @${botInfo.username}`);
            this.isInitialized = true;
            console.log('✅ 텔레그램 서비스 초기화 완료');
        }
        catch (error) {
            console.error('❌ 텔레그램 서비스 초기화 실패:', error);
            this.config.enabled = false;
            throw error;
        }
    }
    /**
     * 메시지 전송
     */
    async sendMessage(message, parseMode = 'Markdown') {
        try {
            if (!this.isInitialized || !this.bot) {
                // 자동 초기화 시도
                try {
                    await this.initialize();
                }
                catch (initError) {
                    console.log('ℹ️ 텔레그램 서비스 초기화 실패, 메시지 전송을 건너뜁니다.');
                    return false;
                }
            }
            if (!this.config.enabled) {
                console.log('ℹ️ 텔레그램 서비스가 비활성화되어 있습니다.');
                return false;
            }
            await this.bot.telegram.sendMessage(this.config.chatId, message, { parse_mode: parseMode });
            console.log('✅ 텔레그램 메시지 전송 완료');
            return true;
        }
        catch (error) {
            console.error('❌ 텔레그램 메시지 전송 실패:', error);
            return false;
        }
    }
    /**
     * 신호 알림 전송
     */
    async sendSignalAlert(signalData) {
        try {
            const message = this.formatSignalMessage(signalData);
            return await this.sendMessage(message);
        }
        catch (error) {
            console.error('❌ 신호 알림 전송 실패:', error);
            return false;
        }
    }
    /**
     * 신호 메시지 포맷팅
     */
    formatSignalMessage(signalData) {
        const symbol = signalData.symbol || 'Unknown';
        const action = signalData.action || signalData.signal || 'Unknown';
        const price = signalData.price || 'N/A';
        const confidence = signalData.confidence || 'N/A';
        const timestamp = signalData.timestamp || signalData.generated_at || new Date().toISOString();
        // 시간대 변환 (UTC -> KST)
        const kstTime = this.convertToKST(timestamp);
        const emoji = action.toLowerCase() === 'buy' ? '🟢' : action.toLowerCase() === 'sell' ? '🔴' : '🟡';
        const actionText = action.toLowerCase() === 'buy' ? '매수' : action.toLowerCase() === 'sell' ? '매도' : '홀드';
        return `${emoji} **${symbol} ${actionText} 신호**\n\n` +
            `📊 **심볼:** ${symbol}\n` +
            `💰 **가격:** ${price}\n` +
            `📈 **신뢰도:** ${confidence}%\n` +
            `⏰ **시간:** ${kstTime}\n` +
            `🎯 **액션:** ${actionText.toUpperCase()}\n\n` +
            `_자동 분석 시스템에서 생성된 신호입니다._`;
    }
    /**
     * UTC 시간을 KST로 변환
     */
    convertToKST(utcTime) {
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
        }
        catch (error) {
            console.error('시간 변환 오류:', error);
            return utcTime;
        }
    }
    /**
     * 시스템 상태 메시지 전송
     */
    async sendSystemStatus(status) {
        try {
            const message = `🔧 **시스템 상태 업데이트**\n\n` +
                `📊 **상태:** ${status.status}\n` +
                `🔥 **Firebase:** ${status.services?.firebase ? '✅' : '❌'}\n` +
                `📱 **텔레그램:** ${status.services?.telegram ? '✅' : '❌'}\n` +
                `⏰ **시간:** ${this.convertToKST(new Date().toISOString())}`;
            return await this.sendMessage(message);
        }
        catch (error) {
            console.error('❌ 시스템 상태 메시지 전송 실패:', error);
            return false;
        }
    }
    /**
     * 에러 알림 전송
     */
    async sendErrorAlert(error, context = '') {
        try {
            const message = `⚠️ **시스템 오류 발생**\n\n` +
                `🔍 **컨텍스트:** ${context}\n` +
                `❌ **오류:** ${error.message || error}\n` +
                `⏰ **시간:** ${this.convertToKST(new Date().toISOString())}`;
            return await this.sendMessage(message);
        }
        catch (err) {
            console.error('❌ 에러 알림 전송 실패:', err);
            return false;
        }
    }
    /**
     * 서비스 상태 확인
     */
    isEnabled() {
        return this.isInitialized && this.config.enabled;
    }
    /**
     * 봇 인스턴스 반환
     */
    getBot() {
        return this.bot;
    }
    /**
     * 설정 정보 반환
     */
    getConfig() {
        return { ...this.config };
    }
}
// 싱글톤 인스턴스 내보내기
exports.telegramService = TelegramService.getInstance();
exports.default = exports.telegramService;
