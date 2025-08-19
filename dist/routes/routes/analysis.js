"use strict";
// routes/analysis.ts
// 신호 분석 관련 라우트 정의
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../../controllers/controllers");
const router = (0, express_1.Router)();
// 컨트롤러 매니저에서 분석 컨트롤러 가져오기
const getAnalysisController = () => (0, controllers_1.getControllerManager)().analysisController;
// === 신호 분석 관련 라우트 ===
// 컬렉션 기반 신호 분석
// GET /api/analysis/collection/:collectionName
router.get('/collection/:collectionName', async (req, res) => {
    const controller = getAnalysisController();
    await controller.analyzeSignalFromCollection(req, res);
});
// 직접 신호 데이터 처리
// POST /api/analysis/process
router.post('/process', async (req, res) => {
    const controller = getAnalysisController();
    await controller.processSignalData(req, res);
});
// 분석 히스토리 조회 (전체)
// GET /api/analysis/history
router.get('/history', async (req, res) => {
    const controller = getAnalysisController();
    await controller.getAnalysisHistory(req, res);
});
// 분석 히스토리 조회 (특정 심볼)
// GET /api/analysis/history/:symbol
router.get('/history/:symbol', async (req, res) => {
    const controller = getAnalysisController();
    await controller.getAnalysisHistory(req, res);
});
// 신호 통계 조회
// GET /api/analysis/statistics
router.get('/statistics', async (req, res) => {
    const controller = getAnalysisController();
    await controller.getSignalStatistics(req, res);
});
// 시스템 상태 조회
// GET /api/analysis/system/status
router.get('/system/status', async (req, res) => {
    const controller = getAnalysisController();
    await controller.getSystemStatus(req, res);
});
// === 호환성을 위한 기존 엔드포인트 ===
// 기존 /analyze/:collectionName 엔드포인트 호환성 유지
// GET /analyze/:collectionName (기존 엔드포인트)
router.get('/legacy/:collectionName', async (req, res) => {
    const controller = getAnalysisController();
    await controller.analyzeSignalFromCollection(req, res);
});
exports.default = router;
