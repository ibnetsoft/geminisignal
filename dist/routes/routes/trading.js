"use strict";
// routes/trading.ts
// 거래 관련 라우트 정의
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../../controllers/controllers");
const router = (0, express_1.Router)();
// 컨트롤러 매니저에서 거래 컨트롤러 가져오기
const getTradingController = () => (0, controllers_1.getControllerManager)().tradingController;
// === 거래 실행 관련 라우트 ===
// 수동 거래 실행
// POST /api/trading/execute
router.post('/execute', async (req, res) => {
    const controller = getTradingController();
    await controller.executeTrade(req, res);
});
// === 거래 계정 관리 라우트 ===
// 거래 계정 목록 조회
// GET /api/trading/accounts
router.get('/accounts', async (req, res) => {
    const controller = getTradingController();
    await controller.getTradingAccounts(req, res);
});
// 거래 계정 추가
// POST /api/trading/accounts
router.post('/accounts', async (req, res) => {
    const controller = getTradingController();
    await controller.addTradingAccount(req, res);
});
// 거래 계정 업데이트
// PUT /api/trading/accounts/:accountId
router.put('/accounts/:accountId', async (req, res) => {
    const controller = getTradingController();
    await controller.updateTradingAccount(req, res);
});
// === 거래 실행 기록 관련 라우트 ===
// 거래 실행 기록 조회
// GET /api/trading/executions
router.get('/executions', async (req, res) => {
    const controller = getTradingController();
    await controller.getTradeExecutions(req, res);
});
// === 포지션 관리 라우트 ===
// 열린 포지션 조회
// GET /api/trading/positions
router.get('/positions', async (req, res) => {
    const controller = getTradingController();
    await controller.getOpenPositions(req, res);
});
// 포지션 종료
// DELETE /api/trading/positions/:positionId
router.delete('/positions/:positionId', async (req, res) => {
    const controller = getTradingController();
    await controller.closePosition(req, res);
});
// === 시스템 상태 및 설정 라우트 ===
// 거래 시스템 상태 확인
// GET /api/trading/health
router.get('/health', async (req, res) => {
    const controller = getTradingController();
    await controller.getTradingSystemHealth(req, res);
});
// 거래 설정 조회
// GET /api/trading/config
router.get('/config', async (req, res) => {
    const controller = getTradingController();
    await controller.getTradingConfig(req, res);
});
// === 전략 실행 라우트 ===
// EMA 교차 전략 시작 (Nautilus Trader Python 서비스 연동)
// POST /api/trading/strategy/start
router.post('/strategy/start', async (req, res) => {
    const controller = getTradingController();
    await controller.startEmaCrossStrategy(req, res);
});
// EMA 교차 전략 시작 (기존 호환성)
// POST /api/trading/strategy/ema-cross/start
router.post('/strategy/ema-cross/start', async (req, res) => {
    const controller = getTradingController();
    await controller.startEmaCrossStrategy(req, res);
});
exports.default = router;
