"use strict";
// middleware/index.ts
// 모든 미들웨어들의 통합 관리
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.createLoggingMiddleware = exports.startPeriodicLogging = exports.createSelectiveLogger = exports.logSystemStats = exports.logError = exports.debugLogger = exports.businessLogger = exports.securityLogger = exports.performanceLogger = exports.requestLogger = exports.logger = exports.requireApiKey = exports.requireJSON = exports.validateDateRange = exports.validatePagination = exports.validateExternalSignal = exports.validateTelegramMessage = exports.validateWebhookSetup = exports.validateTradingAccount = exports.validateNumericQuery = exports.validatePositionId = exports.validateAccountId = exports.validateCollectionName = exports.validateSymbolParam = exports.validateTrade = exports.validateSignal = exports.requireBody = exports.handleAPIError = exports.handleDatabaseError = exports.handleValidationError = exports.notFoundHandler = exports.asyncHandler = exports.createError = exports.CustomError = exports.errorHandler = void 0;
exports.setupGlobalMiddleware = setupGlobalMiddleware;
exports.setupErrorHandlers = setupErrorHandlers;
exports.initializeMiddleware = initializeMiddleware;
exports.setupDevelopmentMiddleware = setupDevelopmentMiddleware;
exports.getMiddlewareStatus = getMiddlewareStatus;
// 에러 처리 미들웨어
var errorHandler_1 = require("./errorHandler");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return errorHandler_1.errorHandler; } });
Object.defineProperty(exports, "CustomError", { enumerable: true, get: function () { return errorHandler_1.CustomError; } });
Object.defineProperty(exports, "createError", { enumerable: true, get: function () { return errorHandler_1.createError; } });
Object.defineProperty(exports, "asyncHandler", { enumerable: true, get: function () { return errorHandler_1.asyncHandler; } });
Object.defineProperty(exports, "notFoundHandler", { enumerable: true, get: function () { return errorHandler_1.notFoundHandler; } });
Object.defineProperty(exports, "handleValidationError", { enumerable: true, get: function () { return errorHandler_1.handleValidationError; } });
Object.defineProperty(exports, "handleDatabaseError", { enumerable: true, get: function () { return errorHandler_1.handleDatabaseError; } });
Object.defineProperty(exports, "handleAPIError", { enumerable: true, get: function () { return errorHandler_1.handleAPIError; } });
// 유효성 검사 미들웨어
var validation_1 = require("./validation");
Object.defineProperty(exports, "requireBody", { enumerable: true, get: function () { return validation_1.requireBody; } });
Object.defineProperty(exports, "validateSignal", { enumerable: true, get: function () { return validation_1.validateSignal; } });
Object.defineProperty(exports, "validateTrade", { enumerable: true, get: function () { return validation_1.validateTrade; } });
Object.defineProperty(exports, "validateSymbolParam", { enumerable: true, get: function () { return validation_1.validateSymbolParam; } });
Object.defineProperty(exports, "validateCollectionName", { enumerable: true, get: function () { return validation_1.validateCollectionName; } });
Object.defineProperty(exports, "validateAccountId", { enumerable: true, get: function () { return validation_1.validateAccountId; } });
Object.defineProperty(exports, "validatePositionId", { enumerable: true, get: function () { return validation_1.validatePositionId; } });
Object.defineProperty(exports, "validateNumericQuery", { enumerable: true, get: function () { return validation_1.validateNumericQuery; } });
Object.defineProperty(exports, "validateTradingAccount", { enumerable: true, get: function () { return validation_1.validateTradingAccount; } });
Object.defineProperty(exports, "validateWebhookSetup", { enumerable: true, get: function () { return validation_1.validateWebhookSetup; } });
Object.defineProperty(exports, "validateTelegramMessage", { enumerable: true, get: function () { return validation_1.validateTelegramMessage; } });
Object.defineProperty(exports, "validateExternalSignal", { enumerable: true, get: function () { return validation_1.validateExternalSignal; } });
Object.defineProperty(exports, "validatePagination", { enumerable: true, get: function () { return validation_1.validatePagination; } });
Object.defineProperty(exports, "validateDateRange", { enumerable: true, get: function () { return validation_1.validateDateRange; } });
Object.defineProperty(exports, "requireJSON", { enumerable: true, get: function () { return validation_1.requireJSON; } });
Object.defineProperty(exports, "requireApiKey", { enumerable: true, get: function () { return validation_1.requireApiKey; } });
// 로깅 미들웨어
var logging_1 = require("./logging");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logging_1.logger; } });
Object.defineProperty(exports, "requestLogger", { enumerable: true, get: function () { return logging_1.requestLogger; } });
Object.defineProperty(exports, "performanceLogger", { enumerable: true, get: function () { return logging_1.performanceLogger; } });
Object.defineProperty(exports, "securityLogger", { enumerable: true, get: function () { return logging_1.securityLogger; } });
Object.defineProperty(exports, "businessLogger", { enumerable: true, get: function () { return logging_1.businessLogger; } });
Object.defineProperty(exports, "debugLogger", { enumerable: true, get: function () { return logging_1.debugLogger; } });
Object.defineProperty(exports, "logError", { enumerable: true, get: function () { return logging_1.logError; } });
Object.defineProperty(exports, "logSystemStats", { enumerable: true, get: function () { return logging_1.logSystemStats; } });
Object.defineProperty(exports, "createSelectiveLogger", { enumerable: true, get: function () { return logging_1.createSelectiveLogger; } });
Object.defineProperty(exports, "startPeriodicLogging", { enumerable: true, get: function () { return logging_1.startPeriodicLogging; } });
Object.defineProperty(exports, "createLoggingMiddleware", { enumerable: true, get: function () { return logging_1.createLoggingMiddleware; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logging_1.LogLevel; } });
const errorHandler_2 = require("./errorHandler");
const logging_2 = require("./logging");
// 전역 미들웨어 설정 함수
function setupGlobalMiddleware(app) {
    console.log('🛡️ 전역 미들웨어 설정 중...');
    // 1. 로깅 미들웨어 (가장 먼저)
    const loggingMiddlewares = (0, logging_2.createLoggingMiddleware)({
        excludePaths: ['/health', '/favicon.ico'],
        includePerformance: true,
        includeSecurity: true
    });
    loggingMiddlewares.forEach(middleware => {
        app.use(middleware);
    });
    // 2. 보안 헤더 설정
    app.use((req, res, next) => {
        // CORS 헤더
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
        // 보안 헤더
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        // OPTIONS 요청 처리
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        next();
    });
    // 3. 요청 크기 제한
    app.use((req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0', 10);
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (contentLength > maxSize) {
            const error = new errorHandler_2.CustomError('요청 크기가 너무 큽니다.', 413);
            return next(error);
        }
        next();
    });
    console.log('✅ 전역 미들웨어 설정 완료');
}
// 에러 처리 미들웨어 설정 (라우터 설정 후 호출)
function setupErrorHandlers(app) {
    console.log('🚨 에러 핸들러 설정 중...');
    // 404 핸들러 (모든 라우트 후에)
    app.use(errorHandler_2.notFoundHandler);
    // 전역 에러 핸들러 (가장 마지막)
    app.use(errorHandler_2.errorHandler);
    // 처리되지 않은 Promise 거부 처리
    process.on('unhandledRejection', (reason, promise) => {
        logging_2.logger.error('처리되지 않은 Promise 거부', {
            reason: reason?.message || reason,
            stack: reason?.stack,
            promise: promise.toString()
        });
        // 개발 환경에서는 프로세스 종료
        if (process.env.NODE_ENV === 'development') {
            process.exit(1);
        }
    });
    // 처리되지 않은 예외 처리
    process.on('uncaughtException', (error) => {
        logging_2.logger.error('처리되지 않은 예외', {
            message: error.message,
            stack: error.stack
        });
        // 안전하게 프로세스 종료
        process.exit(1);
    });
    console.log('✅ 에러 핸들러 설정 완료');
}
// 미들웨어 초기화 함수
function initializeMiddleware(app) {
    logging_2.logger.info('미들웨어 시스템 초기화 시작');
    // 전역 미들웨어 설정
    setupGlobalMiddleware(app);
    // 주기적 시스템 로깅 시작 (30분마다)
    const loggingInterval = (0, logging_2.startPeriodicLogging)(30);
    // 프로세스 종료 시 정리
    process.on('SIGINT', () => {
        logging_2.logger.info('프로세스 종료 신호 받음 - 미들웨어 정리');
        clearInterval(loggingInterval);
    });
    process.on('SIGTERM', () => {
        logging_2.logger.info('프로세스 종료 신호 받음 - 미들웨어 정리');
        clearInterval(loggingInterval);
    });
    logging_2.logger.info('미들웨어 시스템 초기화 완료');
}
// 개발 환경 전용 미들웨어
function setupDevelopmentMiddleware(app) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    console.log('🛠️ 개발 환경 미들웨어 설정 중...');
    // 개발 전용 디버그 엔드포인트
    app.get('/debug/middleware', (req, res) => {
        res.json({
            environment: process.env.NODE_ENV,
            middleware: {
                logging: true,
                errorHandling: true,
                validation: true,
                security: true
            },
            process: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version
            },
            timestamp: new Date().toISOString()
        });
    });
    // 테스트용 에러 발생 엔드포인트
    app.get('/debug/error/:type', (req, res, next) => {
        const errorType = req.params.type;
        switch (errorType) {
            case 'sync':
                throw new errorHandler_2.CustomError('동기 테스트 에러', 400);
            case 'async':
                Promise.reject(new errorHandler_2.CustomError('비동기 테스트 에러', 500))
                    .catch(next);
                break;
            case 'unhandled':
                setTimeout(() => {
                    throw new Error('처리되지 않은 테스트 에러');
                }, 100);
                res.json({ message: '처리되지 않은 에러가 곧 발생합니다' });
                break;
            default:
                res.json({ message: '지원하는 에러 타입: sync, async, unhandled' });
        }
    });
    console.log('✅ 개발 환경 미들웨어 설정 완료');
}
// 미들웨어 상태 확인
function getMiddlewareStatus() {
    return {
        errorHandler: true,
        validation: true,
        logging: true,
        security: true,
        cors: true,
        rateLimit: false, // 향후 구현 예정
        cache: false, // 향후 구현 예정
        timestamp: new Date().toISOString()
    };
}
exports.default = {
    setupGlobalMiddleware,
    setupErrorHandlers,
    initializeMiddleware,
    setupDevelopmentMiddleware,
    getMiddlewareStatus
};
