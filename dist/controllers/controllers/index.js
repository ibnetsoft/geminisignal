"use strict";
// controllers/index.ts
// 모든 컨트롤러들의 통합 관리
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = exports.TradingController = exports.AnalysisController = exports.ControllerManager = void 0;
exports.initializeControllers = initializeControllers;
exports.getControllerManager = getControllerManager;
exports.shutdownControllers = shutdownControllers;
const analysisController_1 = __importDefault(require("./analysisController"));
exports.AnalysisController = analysisController_1.default;
const tradingController_1 = __importDefault(require("./tradingController"));
exports.TradingController = tradingController_1.default;
const webhookController_1 = __importDefault(require("./webhookController"));
exports.WebhookController = webhookController_1.default;
// 컨트롤러 인스턴스들을 관리하는 클래스
class ControllerManager {
    constructor(bot) {
        console.log('🎮 컨트롤러 매니저 초기화 중...');
        // 각 컨트롤러 인스턴스 생성
        this.analysisController = new analysisController_1.default();
        this.tradingController = new tradingController_1.default();
        this.webhookController = new webhookController_1.default(bot);
        console.log('✅ 모든 컨트롤러 초기화 완료');
    }
    // 컨트롤러 상태 확인
    getStatus() {
        return {
            analysis: !!this.analysisController,
            trading: !!this.tradingController,
            webhook: !!this.webhookController,
            initialized_at: new Date().toISOString()
        };
    }
}
exports.ControllerManager = ControllerManager;
// 싱글톤 패턴 (옵션)
let controllerManager = null;
function initializeControllers(bot) {
    if (!controllerManager) {
        controllerManager = new ControllerManager(bot);
    }
    return controllerManager;
}
function getControllerManager() {
    if (!controllerManager) {
        throw new Error('컨트롤러 매니저가 초기화되지 않았습니다. initializeControllers()를 먼저 호출하세요.');
    }
    return controllerManager;
}
// 컨트롤러 정리 함수
function shutdownControllers() {
    if (controllerManager) {
        console.log('🛑 컨트롤러 매니저 종료 중...');
        controllerManager = null;
        console.log('✅ 컨트롤러 매니저 종료 완료');
    }
}
