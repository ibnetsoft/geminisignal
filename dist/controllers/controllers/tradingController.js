"use strict";
// controllers/tradingController.ts
// 거래 관련 API 컨트롤러
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingController = void 0;
const utils_1 = require("../../utils/utils");
const services_1 = require("../../services/services");
const tradingService_1 = require("../../services/services/tradingService");
class TradingController {
    constructor() {
        this.serviceManager = (0, services_1.getServiceManager)();
    }
    // 거래 실행 (수동)
    async executeTrade(req, res) {
        try {
            const tradeRequest = req.body;
            // 기본 유효성 검사
            const validation = (0, utils_1.validateTradingRequest)(tradeRequest);
            if (!validation.isValid) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '유효하지 않은 거래 요청', validation.errors));
                return;
            }
            console.log('📤 수동 거래 실행 요청:', tradeRequest);
            // 거래 신호 구성
            const tradingSignal = {
                symbol: tradeRequest.symbol,
                action: tradeRequest.action,
                volume: tradeRequest.volume,
                price: tradeRequest.price,
                stopLoss: tradeRequest.stopLoss,
                takeProfit: tradeRequest.takeProfit,
                confidence: tradeRequest.confidence || 75,
                timestamp: new Date().toISOString(),
                source: 'manual_api_request',
                from_ai: false
            };
            // 서비스 매니저를 통한 거래 처리
            const result = await this.serviceManager.processSignal(tradingSignal);
            res.json((0, utils_1.formatApiResponse)(true, result, '거래가 성공적으로 실행되었습니다.'));
        }
        catch (error) {
            console.error('❌ 수동 거래 실행 실패:', error);
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 거래 계정 목록 조회
    async getTradingAccounts(req, res) {
        try {
            // 현재는 서비스 매니저를 통해 처리하지만, 
            // 향후 TradingService에서 직접 처리하도록 개선 가능
            const accounts = await this.getTradingAccountsData();
            res.json((0, utils_1.formatApiResponse)(true, {
                accounts: accounts,
                count: accounts.length
            }, '거래 계정 목록을 성공적으로 조회했습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 거래 계정 추가
    async addTradingAccount(req, res) {
        try {
            const accountData = req.body;
            // 필수 필드 검증
            const requiredFields = ['accountId', 'name', 'server', 'login', 'password'];
            const missingFields = requiredFields.filter(field => !accountData[field]);
            if (missingFields.length > 0) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`));
                return;
            }
            // 계정 추가 (향후 TradingService를 통해 처리)
            const accountId = await this.addTradingAccountData(accountData);
            res.json((0, utils_1.formatApiResponse)(true, { account_id: accountId }, '거래 계정이 성공적으로 추가되었습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 거래 계정 업데이트
    async updateTradingAccount(req, res) {
        try {
            const accountId = req.params.accountId;
            const updates = req.body;
            if (!accountId) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '계정 ID가 필요합니다.'));
                return;
            }
            // 계정 업데이트 (향후 TradingService를 통해 처리)
            await this.updateTradingAccountData(accountId, updates);
            res.json((0, utils_1.formatApiResponse)(true, null, '거래 계정이 성공적으로 업데이트되었습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 거래 실행 기록 조회
    async getTradeExecutions(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const symbol = req.query.symbol;
            // 거래 실행 기록 조회 (향후 TradingService를 통해 처리)
            const executions = await this.getTradeExecutionsData(limit, symbol);
            res.json((0, utils_1.formatApiResponse)(true, {
                executions: executions,
                count: executions.length,
                limit: limit,
                symbol: symbol || 'all'
            }, '거래 실행 기록을 성공적으로 조회했습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 거래 시스템 상태 확인
    async getTradingSystemHealth(req, res) {
        try {
            // 시스템 상태 확인 (향후 TradingService를 통해 처리)
            const healthStatus = await this.checkTradingSystemHealth();
            res.json({
                service: 'Trading System',
                status: healthStatus.isHealthy ? 'healthy' : 'unhealthy',
                details: healthStatus,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json({
                service: 'Trading System',
                status: 'error',
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });
        }
    }
    // 거래 설정 조회
    async getTradingConfig(req, res) {
        try {
            const config = {
                enabled: process.env.ENABLE_TRADING_SYSTEM === 'true',
                min_confidence: parseFloat(process.env.MIN_CONFIDENCE || '0.75'),
                max_risk_level: process.env.MAX_RISK_LEVEL || 'medium',
                supported_symbols: utils_1.VALID_SYMBOLS,
                trading_limits: utils_1.TRADING_LIMITS,
                metaapi_configured: !!process.env.METAAPI_TOKEN
            };
            res.json((0, utils_1.formatApiResponse)(true, config, '거래 설정을 성공적으로 조회했습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 포지션 조회
    async getOpenPositions(req, res) {
        try {
            const accountId = req.query.accountId;
            // 열린 포지션 조회 (향후 TradingService를 통해 처리)
            const positions = await this.getOpenPositionsData(accountId);
            res.json((0, utils_1.formatApiResponse)(true, {
                positions: positions,
                count: positions.length,
                account_id: accountId || 'all'
            }, '열린 포지션을 성공적으로 조회했습니다.'));
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 포지션 종료
    async closePosition(req, res) {
        try {
            const positionId = req.params.positionId;
            const accountId = req.body.accountId;
            if (!positionId) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '포지션 ID가 필요합니다.'));
                return;
            }
            // 포지션 종료 (향후 TradingService를 통해 처리)
            const success = await this.closePositionData(positionId, accountId);
            if (success) {
                res.json((0, utils_1.formatApiResponse)(true, { position_id: positionId }, '포지션이 성공적으로 종료되었습니다.'));
            }
            else {
                res.status(500).json((0, utils_1.formatApiResponse)(false, null, '포지션 종료에 실패했습니다.'));
            }
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // === Private Methods (임시 구현) ===
    // 향후 TradingService로 이동 예정
    async getTradingAccountsData() {
        // 임시 구현 - 향후 TradingService에서 실제 데이터 조회
        return [
            {
                id: 'demo_account_1',
                name: 'Demo Account',
                balance: 10000,
                equity: 10000,
                margin: 0,
                freeMargin: 10000,
                isConnected: false
            }
        ];
    }
    async addTradingAccountData(accountData) {
        // 임시 구현 - 향후 TradingService에서 실제 계정 추가
        console.log('거래 계정 추가 요청:', accountData);
        return `account_${Date.now()}`;
    }
    async updateTradingAccountData(accountId, updates) {
        // 임시 구현 - 향후 TradingService에서 실제 계정 업데이트
        console.log(`거래 계정 업데이트: ${accountId}`, updates);
    }
    async getTradeExecutionsData(limit, symbol) {
        // 임시 구현 - 향후 TradingService에서 실제 데이터 조회
        return [
            {
                id: 'trade_1',
                symbol: symbol || 'BTCUSD',
                action: 'buy',
                volume: 0.1,
                openPrice: 50000,
                status: 'executed',
                openTime: new Date().toISOString(),
                profit: 0
            }
        ];
    }
    async checkTradingSystemHealth() {
        // 임시 구현 - 향후 TradingService에서 실제 상태 확인
        return {
            isHealthy: process.env.METAAPI_TOKEN ? true : false,
            metaapi_configured: !!process.env.METAAPI_TOKEN,
            accounts_connected: 0,
            last_check: new Date().toISOString()
        };
    }
    async getOpenPositionsData(accountId) {
        // 임시 구현 - 향후 TradingService에서 실제 포지션 조회
        return [];
    }
    async closePositionData(positionId, accountId) {
        // 임시 구현 - 향후 TradingService에서 실제 포지션 종료
        console.log(`포지션 종료 요청: ${positionId}, 계정: ${accountId}`);
        return true;
    }
    // === 전략 실행 관련 메서드 ===
    // EMA 교차 전략 시작 (Nautilus Trader Python 서비스 연동)
    async startEmaCrossStrategy(req, res) {
        try {
            const params = req.body;
            // 필수 파라미터 검증
            const requiredParams = ['instrumentId', 'barSpec', 'tradeSize', 'fastEmaPeriod', 'slowEmaPeriod'];
            const missingParams = requiredParams.filter(p => !params[p]);
            if (missingParams.length > 0) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, `필수 파라미터가 누락되었습니다: ${missingParams.join(', ')}`));
                return;
            }
            console.log('🚀 Nautilus Trader EMA 교차 전략 시작 요청:', params);
            // Python 서비스 호출을 위한 tradingService import
            // startEmaCrossStrategy already imported at top
            // Nautilus Trader Python 서비스 호출
            const result = await (0, tradingService_1.startEmaCrossStrategy)({
                instrumentId: params.instrumentId,
                barSpec: params.barSpec,
                tradeSize: params.tradeSize,
                fastEmaPeriod: params.fastEmaPeriod,
                slowEmaPeriod: params.slowEmaPeriod
            });
            res.json((0, utils_1.formatApiResponse)(true, result, 'Nautilus Trader EMA 교차 전략을 성공적으로 시작했습니다.'));
        }
        catch (error) {
            console.error('❌ Nautilus Trader EMA 교차 전략 시작 실패:', error);
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
}
exports.TradingController = TradingController;
exports.default = TradingController;
