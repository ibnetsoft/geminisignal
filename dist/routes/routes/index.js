"use strict";
// routes/index.ts
// 모든 라우터들의 통합 관리
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const utils_1 = require("../../utils/utils");
const config_1 = require("../../config");
const services_1 = require("../../services/services");
const controllers_1 = require("../../controllers/controllers");
const firebaseService_1 = require("../../services/services/firebaseService");
// 개별 라우터들 import
const analysis_1 = __importDefault(require("./analysis"));
const trading_1 = __importDefault(require("./trading"));
const webhook_1 = __importDefault(require("./webhook"));
// 라우터 설정 함수
function setupRoutes(app, bot) {
    console.log('🛤️ 라우터 설정 중...');
    // 컨트롤러 초기화
    (0, controllers_1.initializeControllers)(bot);
    // === API 라우터들 등록 ===
    // 신호 분석 관련 라우트
    app.use('/api/analysis', analysis_1.default);
    // 거래 관련 라우트
    app.use('/api/trading', trading_1.default);
    // 웹훅 관련 라우트
    app.use('/api/webhook', webhook_1.default);
    // === 기존 호환성 라우트 ===
    // 기존 /analyze/:collectionName 엔드포인트 (호환성 유지)
    app.get('/analyze/:collectionName', async (req, res) => {
        // 새로운 분석 라우트로 리다이렉트
        const collectionName = req.params.collectionName;
        try {
            const controller = require('../../controllers/controllers').getControllerManager().analysisController;
            await controller.analyzeSignalFromCollection(req, res);
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `분석 처리 실패: ${error instanceof Error ? error.message : String(error)}`));
        }
    });
    // 텔레그램 웹훅 메인 엔드포인트 (기존 경로 유지)
    app.use('/webhook', webhook_1.default);
    // === 시스템 라우트 ===
    // 루트 엔드포인트 (서버 상태 및 API 문서)
    app.get('/', async (req, res) => {
        try {
            const serviceManager = (0, services_1.getServiceManager)();
            const systemStatus = await serviceManager.getSystemStatus();
            res.json({
                status: 'running',
                message: '한국어 AI 분석 서버가 정상적으로 실행 중입니다.',
                version: '2.0.0 - 컨트롤러/라우터 분리 버전',
                // API 엔드포인트 문서
                endpoints: {
                    // 분석 관련
                    analysis: {
                        process_signal: 'POST /api/analysis/process - 신호 데이터 직접 처리',
                        collection_analysis: 'GET /api/analysis/collection/{collectionName} - 컬렉션 기반 분석',
                        history: 'GET /api/analysis/history[/{symbol}] - 분석 히스토리 조회',
                        statistics: 'GET /api/analysis/statistics - 신호 통계',
                        system_status: 'GET /api/analysis/system/status - 시스템 상태'
                    },
                    // 거래 관련
                    trading: {
                        execute: 'POST /api/trading/execute - 수동 거래 실행',
                        accounts: 'GET/POST/PUT /api/trading/accounts - 계정 관리',
                        executions: 'GET /api/trading/executions - 거래 기록',
                        positions: 'GET/DELETE /api/trading/positions - 포지션 관리',
                        health: 'GET /api/trading/health - 거래 시스템 상태',
                        config: 'GET /api/trading/config - 거래 설정'
                    },
                    // 웹훅 관련
                    webhook: {
                        main: 'POST /webhook - 텔레그램 웹훅',
                        status: 'GET /api/webhook/status - 웹훅 상태',
                        bot_info: 'GET /api/webhook/bot/info - 봇 정보',
                        test_message: 'POST /api/webhook/bot/test - 테스트 메시지',
                        broadcast: 'POST /api/webhook/bot/broadcast - 메시지 브로드캐스트',
                        external_signals: 'POST /api/webhook/signals/external - 외부 신호 수신'
                    },
                    // 호환성
                    legacy: {
                        analyze: 'GET /analyze/{collectionName} - 기존 분석 엔드포인트'
                    }
                },
                // 시스템 정보
                system_info: {
                    supported_symbols: utils_1.VALID_SYMBOLS,
                    trading_enabled: config_1.TRADING_CONFIG.enabled,
                    min_confidence: config_1.TRADING_CONFIG.signalCriteria.minConfidence * 100 + '%',
                    max_risk_level: config_1.TRADING_CONFIG.signalCriteria.maxRiskLevel,
                    features: {
                        ai_analysis: 'Gemini AI 한국어 분석',
                        trading_system: 'MetaAPI 실제 거래 연동',
                        telegram_integration: '텔레그램 실시간 알림',
                        news_analysis: '다중 뉴스 소스 분석',
                        risk_management: '자동 리스크 관리',
                        controller_architecture: '컨트롤러/라우터 기반 구조'
                    }
                },
                // 시스템 상태
                system_status: systemStatus,
                timestamp: (0, utils_1.formatDateTime)(new Date())
            });
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                message: '시스템 상태 조회 중 오류가 발생했습니다.',
                error: error instanceof Error ? error.message : String(error),
                timestamp: (0, utils_1.formatDateTime)(new Date())
            });
        }
    });
    // === 헬스 체크 엔드포인트 ===
    // 단순 헬스 체크
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: (0, utils_1.formatDateTime)(new Date()),
            uptime: process.uptime()
        });
    });
    // 상세 헬스 체크
    app.get('/health/detailed', async (req, res) => {
        try {
            const serviceManager = (0, services_1.getServiceManager)();
            const systemStatus = await serviceManager.getSystemStatus();
            res.json({
                status: 'healthy',
                system: systemStatus,
                firebase: {
                    connected: firebaseService_1.firebaseService.isConnected(),
                    status: firebaseService_1.firebaseService.isConnected() ? 'connected' : 'disconnected'
                },
                process: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    version: process.version
                },
                timestamp: (0, utils_1.formatDateTime)(new Date())
            });
        }
        catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error),
                timestamp: (0, utils_1.formatDateTime)(new Date())
            });
        }
    });
    // Firebase 헬스 체크
    app.get('/health/firebase', async (req, res) => {
        try {
            const isConnected = firebaseService_1.firebaseService.isConnected();
            if (isConnected) {
                // 연결 테스트
                try {
                    await firebaseService_1.firebaseService.getCollectionData('processed_signals', 1);
                    res.json({
                        status: 'healthy',
                        firebase: {
                            connected: true,
                            test: 'passed',
                            message: 'Firebase 연결이 정상입니다.'
                        },
                        timestamp: (0, utils_1.formatDateTime)(new Date())
                    });
                }
                catch (testError) {
                    res.json({
                        status: 'warning',
                        firebase: {
                            connected: true,
                            test: 'failed',
                            message: 'Firebase 연결은 되었지만 테스트에 실패했습니다.',
                            error: testError instanceof Error ? testError.message : String(testError)
                        },
                        timestamp: (0, utils_1.formatDateTime)(new Date())
                    });
                }
            }
            else {
                res.status(503).json({
                    status: 'unhealthy',
                    firebase: {
                        connected: false,
                        message: 'Firebase에 연결되지 않았습니다.'
                    },
                    timestamp: (0, utils_1.formatDateTime)(new Date())
                });
            }
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                firebase: {
                    connected: false,
                    message: 'Firebase 상태 확인 중 오류가 발생했습니다.',
                    error: error instanceof Error ? error.message : String(error)
                },
                timestamp: (0, utils_1.formatDateTime)(new Date())
            });
        }
    });
    // === 404 핸들러 ===
    app.use('*', (req, res) => {
        res.status(404).json((0, utils_1.formatApiResponse)(false, null, `엔드포인트를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`, [`사용 가능한 엔드포인트는 GET / 에서 확인하세요.`]));
    });
    console.log('✅ 모든 라우터 설정 완료');
    console.log('📋 사용 가능한 라우트:');
    console.log('   - GET / (API 문서 및 상태)');
    console.log('   - GET /health (헬스 체크)');
    console.log('   - GET /health/firebase (Firebase 상태)');
    console.log('   - POST /webhook (텔레그램 웹훅)');
    console.log('   - /api/analysis/* (신호 분석)');
    console.log('   - /api/trading/* (거래 관리)');
    console.log('   - /api/webhook/* (웹훅 관리)');
    console.log('   - GET /analyze/:collectionName (기존 호환성)');
}
exports.default = setupRoutes;
