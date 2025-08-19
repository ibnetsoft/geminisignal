"use strict";
// routes/webhook.ts
// 웹훅 및 외부 통합 관련 라우트 정의
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../../controllers/controllers");
const router = (0, express_1.Router)();
// 컨트롤러 매니저에서 웹훅 컨트롤러 가져오기
const getWebhookController = () => (0, controllers_1.getControllerManager)().webhookController;
// === 텔레그램 웹훅 라우트 ===
// 텔레그램 웹훅 처리 (메인 엔드포인트)
// POST /webhook
router.post('/', async (req, res) => {
    const controller = getWebhookController();
    await controller.handleTelegramWebhook(req, res);
});
// === 웹훅 관리 라우트 ===
// 웹훅 상태 확인
// GET /api/webhook/status
router.get('/status', async (req, res) => {
    const controller = getWebhookController();
    await controller.getWebhookStatus(req, res);
});
// 웹훅 설정 (관리자용)
// POST /api/webhook/setup
router.post('/setup', async (req, res) => {
    const controller = getWebhookController();
    await controller.setupWebhook(req, res);
});
// 웹훅 삭제 (관리자용)
// DELETE /api/webhook/setup
router.delete('/setup', async (req, res) => {
    const controller = getWebhookController();
    await controller.deleteWebhook(req, res);
});
// === 텔레그램 봇 관련 라우트 ===
// 봇 정보 조회
// GET /api/webhook/bot/info
router.get('/bot/info', async (req, res) => {
    const controller = getWebhookController();
    await controller.getBotInfo(req, res);
});
// 테스트 메시지 전송
// POST /api/webhook/bot/test
router.post('/bot/test', async (req, res) => {
    const controller = getWebhookController();
    await controller.sendTestMessage(req, res);
});
// 메시지 브로드캐스트 (관리자용)
// POST /api/webhook/bot/broadcast
router.post('/bot/broadcast', async (req, res) => {
    const controller = getWebhookController();
    await controller.broadcastMessage(req, res);
});
// === 외부 신호 수신 라우트 ===
// 외부 신호 수신 (예: TradingView 웹훅)
// POST /api/webhook/signals/external
router.post('/signals/external', async (req, res) => {
    const controller = getWebhookController();
    await controller.receiveExternalSignal(req, res);
});
// TradingView 전용 웹훅 (별칭)
// POST /api/webhook/tradingview
router.post('/tradingview', async (req, res) => {
    const controller = getWebhookController();
    await controller.receiveExternalSignal(req, res);
});
exports.default = router;
