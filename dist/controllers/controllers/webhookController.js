"use strict";
// controllers/webhookController.ts
// 텔레그램 웹훅 및 외부 통합 관련 컨트롤러
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const utils_1 = require("../../utils/utils");
const telegramService_1 = require("../../services/services/telegramService");
class WebhookController {
    constructor(bot) {
        this.bot = bot;
    }
    // 텔레그램 웹훅 처리
    async handleTelegramWebhook(req, res) {
        try {
            console.log("📥 텔레그램 웹훅 수신");
            // 웹훅 데이터 로깅 (개발 중에만)
            if (process.env.NODE_ENV === 'development') {
                console.log("웹훅 데이터:", JSON.stringify(req.body, null, 2));
            }
            // 텔레그램 봇으로 업데이트 전달
            await this.bot.handleUpdate(req.body);
            res.status(200).json({ ok: true });
            console.log("✅ 웹훅 처리 완료");
        }
        catch (error) {
            console.error("❌ 웹훅 처리 오류:", error);
            // 텔레그램에는 항상 200으로 응답해서 재시도 방지
            res.status(200).json({ ok: true });
        }
    }
    // 웹훅 상태 확인
    async getWebhookStatus(req, res) {
        try {
            // 텔레그램 웹훅 정보 조회
            const webhookInfo = await this.bot.telegram.getWebhookInfo();
            res.json((0, utils_1.formatApiResponse)(true, {
                webhook_info: webhookInfo,
                bot_configured: !!process.env.TELEGRAM_BOT_TOKEN,
                chat_id_configured: !!process.env.TELEGRAM_CHAT_ID,
                webhook_url: process.env.WEBHOOK_URL || 'Not configured',
                last_check: new Date().toISOString()
            }, '웹훅 상태를 성공적으로 조회했습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `웹훅 상태 조회 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 웹훅 설정 (관리자용)
    async setupWebhook(req, res) {
        try {
            const { webhookUrl } = req.body;
            if (!webhookUrl) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '웹훅 URL이 필요합니다.'));
                return;
            }
            // 웹훅 설정
            await this.bot.telegram.setWebhook(webhookUrl);
            res.json((0, utils_1.formatApiResponse)(true, { webhook_url: webhookUrl }, '웹훅이 성공적으로 설정되었습니다.'));
            console.log(`📡 웹훅 재설정 완료: ${webhookUrl}`);
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `웹훅 설정 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 웹훅 삭제 (관리자용)
    async deleteWebhook(req, res) {
        try {
            await this.bot.telegram.deleteWebhook();
            res.json((0, utils_1.formatApiResponse)(true, null, '웹훅이 성공적으로 삭제되었습니다.'));
            console.log('🗑️ 웹훅 삭제 완료');
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `웹훅 삭제 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 테스트 메시지 전송 (관리자용)
    async sendTestMessage(req, res) {
        try {
            const { message, chatId } = req.body;
            if (!message) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '메시지 내용이 필요합니다.'));
                return;
            }
            const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;
            if (!targetChatId) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '채팅 ID가 설정되지 않았습니다.'));
                return;
            }
            // 테스트 메시지 전송
            await this.bot.telegram.sendMessage(targetChatId, `🧪 테스트 메시지\n\n${message}\n\n⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`, { parse_mode: 'Markdown' });
            res.json((0, utils_1.formatApiResponse)(true, {
                chat_id: targetChatId,
                message: message,
                sent_at: new Date().toISOString()
            }, '테스트 메시지가 성공적으로 전송되었습니다.'));
            console.log(`📤 테스트 메시지 전송 완료: ${targetChatId}`);
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `메시지 전송 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 봇 정보 조회
    async getBotInfo(req, res) {
        try {
            const botInfo = await this.bot.telegram.getMe();
            res.json((0, utils_1.formatApiResponse)(true, {
                bot_info: botInfo,
                supported_symbols: utils_1.VALID_SYMBOLS,
                webhook_configured: !!process.env.WEBHOOK_URL,
                chat_configured: !!process.env.TELEGRAM_CHAT_ID
            }, '봇 정보를 성공적으로 조회했습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `봇 정보 조회 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 메시지 브로드캐스트 (관리자용)
    async broadcastMessage(req, res) {
        try {
            const { message, targetType } = req.body;
            if (!message) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '메시지 내용이 필요합니다.'));
                return;
            }
            let sentCount = 0;
            const results = [];
            if (targetType === 'admin' || !targetType) {
                // 관리자 채팅에 전송
                const adminChatId = process.env.TELEGRAM_CHAT_ID;
                if (adminChatId) {
                    try {
                        await this.bot.telegram.sendMessage(adminChatId, `📢 공지사항\n\n${message}\n\n⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`, { parse_mode: 'Markdown' });
                        sentCount++;
                        results.push({ chat_id: adminChatId, status: 'success' });
                    }
                    catch (error) {
                        results.push({
                            chat_id: adminChatId,
                            status: 'failed',
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                }
            }
            res.json((0, utils_1.formatApiResponse)(true, {
                message: message,
                target_type: targetType || 'admin',
                sent_count: sentCount,
                results: results,
                broadcast_at: new Date().toISOString()
            }, `메시지가 ${sentCount}개 채팅으로 브로드캐스트되었습니다.`));
            console.log(`📡 메시지 브로드캐스트 완료: ${sentCount}개 채팅`);
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `브로드캐스트 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 외부 신호 수신 (예: TradingView 웹훅)
    async receiveExternalSignal(req, res) {
        try {
            const signalData = req.body;
            console.log('📡 외부 신호 수신:', signalData);
            // 기본 데이터 검증
            if (!signalData.symbol || !signalData.action) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '필수 필드가 누락되었습니다: symbol, action'));
                return;
            }
            // 지원 심볼 검증
            if (!utils_1.VALID_SYMBOLS.includes(signalData.symbol.toUpperCase())) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, `지원하지 않는 심볼입니다: ${signalData.symbol}`));
                return;
            }
            // 신호 데이터 정규화
            const normalizedSignal = {
                symbol: signalData.symbol.toUpperCase(),
                action: signalData.action.toLowerCase(),
                price: signalData.price || 0,
                confidence: signalData.confidence || 70,
                timestamp: new Date().toISOString(),
                source: 'external_webhook',
                raw_data: signalData
            };
            // 텔레그램으로 알림 전송 (TelegramService 사용)
            try {
                // telegramService already imported at top
                // 텔레그램 서비스가 초기화되지 않은 경우 초기화
                if (!telegramService_1.telegramService.isEnabled()) {
                    await telegramService_1.telegramService.initialize();
                }
                const alertData = {
                    symbol: normalizedSignal.symbol,
                    action: normalizedSignal.action,
                    price: normalizedSignal.price,
                    confidence: normalizedSignal.confidence,
                    timestamp: normalizedSignal.timestamp,
                    source: 'external_webhook'
                };
                const success = await telegramService_1.telegramService.sendSignalAlert(alertData);
                if (success) {
                    console.log('✅ 외부 신호 텔레그램 알림 전송 완료');
                }
                else {
                    console.warn('⚠️ 외부 신호 텔레그램 알림 전송 실패');
                }
            }
            catch (telegramError) {
                console.error('❌ 텔레그램 알림 전송 오류:', telegramError);
                // 알림 전송 실패해도 신호 처리는 계속 진행
            }
            res.json((0, utils_1.formatApiResponse)(true, {
                signal: normalizedSignal,
                processed_at: new Date().toISOString()
            }, '외부 신호가 성공적으로 수신되었습니다.'));
            console.log(`✅ 외부 신호 처리 완료: ${normalizedSignal.symbol} ${normalizedSignal.action}`);
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `외부 신호 처리 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
}
exports.WebhookController = WebhookController;
exports.default = WebhookController;
