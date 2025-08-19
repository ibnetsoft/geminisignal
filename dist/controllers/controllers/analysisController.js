"use strict";
// controllers/analysisController.ts
// 신호 분석 관련 API 컨트롤러
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisController = void 0;
const utils_1 = require("../../utils/utils");
const services_1 = require("../../services/services");
const firebaseService_1 = require("../../services/services/firebaseService");
class AnalysisController {
    constructor() {
        this.serviceManager = (0, services_1.getServiceManager)();
    }
    // 컬렉션 기반 신호 분석
    async analyzeSignalFromCollection(req, res) {
        const collectionName = req.params.collectionName;
        // 유효성 검사
        if (!collectionName) {
            res.status(400).json((0, utils_1.formatApiResponse)(false, null, '컬렉션 이름이 필요합니다. 예: /analyze/your_collection_name'));
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(collectionName)) {
            res.status(400).json((0, utils_1.formatApiResponse)(false, null, '컬렉션 이름은 영문, 숫자, 언더스코어, 하이픈만 사용 가능합니다.'));
            return;
        }
        try {
            console.log(`[API] 신호 분석 요청: ${collectionName}`);
            const result = await this.processCollectionSignal(collectionName);
            res.json(result);
        }
        catch (error) {
            console.error(`[API] 신호 분석 오류:`, error);
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, `신호 분석 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
    // 직접 신호 데이터 처리
    async processSignalData(req, res) {
        try {
            const validation = (0, utils_1.validateSignalData)(req.body);
            if (!validation.isValid) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, '유효하지 않은 신호 데이터', validation.errors));
                return;
            }
            console.log('📊 수동 신호 처리 요청:', req.body);
            const result = await this.serviceManager.processSignal(req.body);
            res.json((0, utils_1.formatApiResponse)(true, result, '신호 처리가 완료되었습니다.'));
        }
        catch (error) {
            console.error('신호 처리 오류:', error);
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 신호 분석 히스토리 조회
    async getAnalysisHistory(req, res) {
        try {
            const symbol = req.params.symbol?.toUpperCase();
            const limit = parseInt(req.query.limit) || 10;
            if (symbol && !this.validateSymbol(symbol)) {
                res.status(400).json((0, utils_1.formatApiResponse)(false, null, `지원하지 않는 심볼입니다: ${symbol}. 지원 심볼: ${utils_1.VALID_SYMBOLS.join(', ')}`));
                return;
            }
            let analysisHistory = [];
            if (symbol) {
                // 특정 심볼의 히스토리
                const collectionName = `signal_analyses_${symbol.toLowerCase()}`;
                const documents = await firebaseService_1.firebaseService.getCollectionData(collectionName, limit);
                analysisHistory = documents.map((doc) => ({
                    id: doc.id,
                    ...doc
                }));
            }
            else {
                // 모든 심볼의 최근 히스토리
                for (const sym of utils_1.VALID_SYMBOLS.slice(0, 3)) { // 최대 3개 심볼만
                    const collectionName = `signal_analyses_${sym.toLowerCase()}`;
                    const documents = await firebaseService_1.firebaseService.getCollectionData(collectionName, Math.ceil(limit / 3));
                    const docs = documents.map((doc) => ({
                        id: doc.id,
                        symbol: sym,
                        ...doc
                    }));
                    analysisHistory.push(...docs);
                }
                // 시간순 정렬 및 제한
                analysisHistory.sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime());
                analysisHistory = analysisHistory.slice(0, limit);
            }
            res.json((0, utils_1.formatApiResponse)(true, {
                history: analysisHistory,
                count: analysisHistory.length,
                symbol: symbol || 'all',
                limit: limit
            }, '분석 히스토리를 성공적으로 조회했습니다.'));
        }
        catch (error) {
            console.error('분석 히스토리 조회 오류:', error);
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 신호 통계 조회
    async getSignalStatistics(req, res) {
        try {
            const days = parseInt(req.query.days) || 7;
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const statistics = {
                period: `최근 ${days}일`,
                symbols: {},
                summary: {
                    totalSignals: 0,
                    totalAnalyses: 0,
                    averageConfidence: 0,
                    riskDistribution: {
                        low: 0,
                        medium: 0,
                        high: 0
                    }
                }
            };
            let allAnalyses = [];
            for (const symbol of utils_1.VALID_SYMBOLS) {
                const collectionName = `signal_analyses_${symbol.toLowerCase()}`;
                const documents = await firebaseService_1.firebaseService.getCollectionData(collectionName, 100); // 최대 100개 조회
                // 날짜 필터링 (클라이언트 사이드)
                const analyses = documents.filter((doc) => {
                    const analyzedAt = doc.analyzed_at || doc.timestamp;
                    return analyzedAt && new Date(analyzedAt) >= cutoffDate;
                });
                allAnalyses.push(...analyses);
                // 심볼별 통계
                const symbolStats = {
                    totalAnalyses: analyses.length,
                    averageConfidence: analyses.length > 0
                        ? analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length
                        : 0,
                    recommendations: {
                        buy: analyses.filter(a => a.action === 'buy').length,
                        sell: analyses.filter(a => a.action === 'sell').length,
                        hold: analyses.filter(a => a.action === 'hold').length
                    },
                    riskLevels: {
                        low: analyses.filter(a => a.risk_level === 'low').length,
                        medium: analyses.filter(a => a.risk_level === 'medium').length,
                        high: analyses.filter(a => a.risk_level === 'high').length
                    }
                };
                statistics.symbols[symbol] = symbolStats;
            }
            // 전체 요약 통계
            statistics.summary.totalAnalyses = allAnalyses.length;
            statistics.summary.averageConfidence = allAnalyses.length > 0
                ? allAnalyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / allAnalyses.length
                : 0;
            statistics.summary.riskDistribution = {
                low: allAnalyses.filter(a => a.risk_level === 'low').length,
                medium: allAnalyses.filter(a => a.risk_level === 'medium').length,
                high: allAnalyses.filter(a => a.risk_level === 'high').length
            };
            res.json((0, utils_1.formatApiResponse)(true, statistics, '신호 통계를 성공적으로 조회했습니다.'));
        }
        catch (error) {
            console.error('신호 통계 조회 오류:', error);
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // 시스템 상태 조회
    async getSystemStatus(req, res) {
        try {
            const systemStatus = await this.serviceManager.getSystemStatus();
            res.json({
                success: true,
                data: systemStatus,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(500).json((0, utils_1.formatApiResponse)(false, null, error instanceof Error ? error.message : String(error)));
        }
    }
    // === Private Methods ===
    // 컬렉션에서 신호 처리
    async processCollectionSignal(collectionName) {
        try {
            console.log(`🔍 신호 분석 시작: ${collectionName}`);
            // 1. Firebase 서비스를 통해 최신 신호 데이터 가져오기
            const documents = await firebaseService_1.firebaseService.getCollectionData(collectionName, 1);
            if (documents.length === 0) {
                console.log('최근 24시간 내 새로운 신호가 없습니다.');
                return {
                    success: false,
                    message: '최근 24시간 내 신규 데이터가 없습니다.',
                    timestamp: new Date().toISOString()
                };
            }
            // 2. 최신 신호 데이터 추출
            const latestSignal = documents[0];
            console.log(`📊 최신 신호 발견: ${latestSignal.symbol || 'Unknown'} - ${latestSignal.signal || 'Unknown'}`);
            // 3. 기본값 설정 및 유효성 검사
            const symbol = latestSignal.symbol || this.extractSymbolFromCollection(collectionName);
            const signal = latestSignal.signal || 'buy';
            if (!this.validateSymbol(symbol)) {
                throw new Error(`지원하지 않는 심볼입니다: ${symbol}`);
            }
            // 4. 신호 데이터 구성
            const signalData = {
                symbol: symbol,
                action: signal.toLowerCase().includes('buy') ? 'buy' :
                    signal.toLowerCase().includes('sell') ? 'sell' : 'buy',
                price: latestSignal.price || 0,
                confidence: 75, // 기본 신뢰도
                timestamp: latestSignal.generated_at || new Date().toISOString(),
                source: collectionName
            };
            // 5. 서비스 매니저를 통한 신호 처리
            console.log('🤖 AI 분석 및 거래 처리 시작...');
            const result = await this.serviceManager.processSignal(signalData);
            console.log('✅ 신호 분석 완료');
            return {
                success: true,
                message: '신호 분석이 성공적으로 완료되었습니다.',
                data: result,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error(`❌ 신호 분석 실패: ${collectionName}`, error);
            throw error;
        }
    }
    // 심볼 유효성 검사
    validateSymbol(symbol) {
        return utils_1.VALID_SYMBOLS.includes(symbol.toUpperCase());
    }
    // 컬렉션 이름에서 심볼 추출
    extractSymbolFromCollection(collectionName) {
        // "signals_btcusd" -> "BTCUSD" 형태로 변환
        const match = collectionName.match(/signals_(.+)/);
        if (match) {
            return match[1].toUpperCase();
        }
        // VALID_SYMBOLS에서 컬렉션 이름과 매칭되는 것 찾기
        const foundSymbol = utils_1.VALID_SYMBOLS.find(symbol => collectionName.toLowerCase().includes(symbol.toLowerCase()));
        if (foundSymbol) {
            return foundSymbol;
        }
        // 기본적으로 BTCUSD 반환 (임시)
        console.warn(`컬렉션 이름에서 심볼을 추출할 수 없음: ${collectionName}, BTCUSD를 기본값으로 사용`);
        return 'BTCUSD';
    }
}
exports.AnalysisController = AnalysisController;
exports.default = AnalysisController;
