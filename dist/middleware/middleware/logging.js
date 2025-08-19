"use strict";
// middleware/logging.ts
// 요청/응답 로깅 미들웨어
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugLogger = exports.businessLogger = exports.logger = exports.LogLevel = void 0;
exports.requestLogger = requestLogger;
exports.performanceLogger = performanceLogger;
exports.securityLogger = securityLogger;
exports.logError = logError;
exports.logSystemStats = logSystemStats;
exports.createSelectiveLogger = createSelectiveLogger;
exports.startPeriodicLogging = startPeriodicLogging;
exports.createLoggingMiddleware = createLoggingMiddleware;
const utils_1 = require("../../utils/utils");
// 로그 레벨
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// 현재 로그 레벨 (환경변수에서 설정)
const getCurrentLogLevel = () => {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
        case 'ERROR': return LogLevel.ERROR;
        case 'WARN': return LogLevel.WARN;
        case 'INFO': return LogLevel.INFO;
        case 'DEBUG': return LogLevel.DEBUG;
        default: return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
};
const currentLogLevel = getCurrentLogLevel();
// 로그 출력 함수들
exports.logger = {
    error: (message, data) => {
        if (currentLogLevel >= LogLevel.ERROR) {
            console.error(`[${(0, utils_1.formatDateTime)(new Date())}] ERROR: ${message}`, data || '');
        }
    },
    warn: (message, data) => {
        if (currentLogLevel >= LogLevel.WARN) {
            console.warn(`[${(0, utils_1.formatDateTime)(new Date())}] WARN: ${message}`, data || '');
        }
    },
    info: (message, data) => {
        if (currentLogLevel >= LogLevel.INFO) {
            console.log(`[${(0, utils_1.formatDateTime)(new Date())}] INFO: ${message}`, data || '');
        }
    },
    debug: (message, data) => {
        if (currentLogLevel >= LogLevel.DEBUG) {
            console.log(`[${(0, utils_1.formatDateTime)(new Date())}] DEBUG: ${message}`, data || '');
        }
    }
};
// 요청 정보 추출
function getRequestInfo(req) {
    return {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        params: req.params,
        query: req.query,
        // 민감한 정보 제외하고 바디 일부만 로깅
        bodyPreview: getBodyPreview(req.body)
    };
}
// 응답 정보 추출
function getResponseInfo(res, responseTime) {
    return {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        contentType: res.get('Content-Type'),
        contentLength: res.get('Content-Length'),
        responseTime: `${responseTime}ms`
    };
}
// 요청 바디 미리보기 (민감한 정보 필터링)
function getBodyPreview(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
    const preview = {};
    Object.keys(body).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            preview[key] = '[REDACTED]';
        }
        else if (typeof body[key] === 'string' && body[key].length > 100) {
            preview[key] = body[key].substring(0, 100) + '...';
        }
        else {
            preview[key] = body[key];
        }
    });
    return preview;
}
// 메인 로깅 미들웨어
function requestLogger(req, res, next) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    // 요청 ID를 req에 저장
    req.requestId = requestId;
    // 요청 로그
    exports.logger.info(`[${requestId}] 요청 시작`, getRequestInfo(req));
    // 응답 완료 시 로그
    res.on('finish', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const logMessage = `[${requestId}] 요청 완료`;
        const logData = getResponseInfo(res, responseTime);
        // 상태 코드에 따른 로그 레벨 결정
        if (res.statusCode >= 500) {
            exports.logger.error(logMessage, logData);
        }
        else if (res.statusCode >= 400) {
            exports.logger.warn(logMessage, logData);
        }
        else {
            exports.logger.info(logMessage, logData);
        }
    });
    next();
}
// 간단한 요청 ID 생성
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}
// API 성능 모니터링 미들웨어
function performanceLogger(req, res, next) {
    const startTime = process.hrtime();
    const startTimestamp = Date.now();
    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const duration = diff[0] * 1000 + diff[1] * 1e-6; // 밀리초로 변환
        // 느린 요청 감지 (1초 이상)
        if (duration > 1000) {
            exports.logger.warn('느린 요청 감지', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration.toFixed(2)}ms`,
                statusCode: res.statusCode
            });
        }
        // 성능 통계 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development' && duration > 100) {
            exports.logger.debug('요청 성능', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration.toFixed(2)}ms`,
                memory: process.memoryUsage(),
                statusCode: res.statusCode
            });
        }
    });
    next();
}
// 보안 관련 로깅 미들웨어
function securityLogger(req, res, next) {
    // 의심스러운 요청 패턴 감지
    const suspiciousPatterns = [
        /\.\.\//, // 디렉토리 탐색
        /<script/i, // XSS 시도
        /union.*select/i, // SQL 인젝션
        /cmd.*exec/i // 명령어 실행 시도
    ];
    const requestData = JSON.stringify({
        url: req.originalUrl,
        body: req.body,
        query: req.query
    });
    suspiciousPatterns.forEach(pattern => {
        if (pattern.test(requestData)) {
            exports.logger.warn('의심스러운 요청 감지', {
                pattern: pattern.toString(),
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                body: getBodyPreview(req.body)
            });
        }
    });
    // 비정상적으로 큰 요청 감지
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);
    if (contentLength > 10 * 1024 * 1024) { // 10MB 이상
        exports.logger.warn('큰 요청 크기 감지', {
            contentLength: `${contentLength} bytes`,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip
        });
    }
    next();
}
// 에러 로깅 (에러 핸들러와 함께 사용)
function logError(error, req) {
    exports.logger.error('요청 처리 중 오류 발생', {
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        request: getRequestInfo(req),
        timestamp: (0, utils_1.formatDateTime)(new Date())
    });
}
// 비즈니스 로직 로깅
exports.businessLogger = {
    signalProcessed: (symbol, action, confidence) => {
        exports.logger.info('신호 처리 완료', { symbol, action, confidence });
    },
    tradeExecuted: (symbol, action, volume, price) => {
        exports.logger.info('거래 실행', { symbol, action, volume, price });
    },
    tradeFailed: (symbol, action, reason) => {
        exports.logger.warn('거래 실행 실패', { symbol, action, reason });
    },
    analysisCompleted: (symbol, confidence, riskLevel) => {
        exports.logger.info('AI 분석 완료', { symbol, confidence, riskLevel });
    },
    webhookReceived: (source, data) => {
        exports.logger.info('웹훅 수신', { source, data: getBodyPreview(data) });
    },
    telegramMessage: (chatId, messageType) => {
        exports.logger.info('텔레그램 메시지 전송', { chatId, messageType });
    },
    apiConnection: (service, status, responseTime) => {
        if (status === 'success') {
            exports.logger.info('외부 API 호출 성공', { service, responseTime: responseTime ? `${responseTime}ms` : undefined });
        }
        else {
            exports.logger.warn('외부 API 호출 실패', { service });
        }
    },
    systemStatus: (component, status, details) => {
        if (status === 'healthy') {
            exports.logger.info('시스템 컴포넌트 정상', { component, details });
        }
        else {
            exports.logger.warn('시스템 컴포넌트 비정상', { component, details });
        }
    }
};
// 디버그 로깅 (개발 환경에서만)
exports.debugLogger = {
    apiCall: (service, endpoint, params) => {
        exports.logger.debug(`API 호출: ${service}`, { endpoint, params });
    },
    databaseQuery: (collection, operation, filters) => {
        exports.logger.debug(`DB 쿼리: ${collection}`, { operation, filters });
    },
    cacheOperation: (operation, key, hit) => {
        exports.logger.debug(`캐시 ${operation}`, { key, hit });
    },
    configLoaded: (configType, values) => {
        exports.logger.debug(`설정 로드: ${configType}`, values);
    }
};
// 통계 로깅 (주기적으로 시스템 상태 로그)
function logSystemStats() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    exports.logger.info('시스템 통계', {
        uptime: `${Math.floor(process.uptime())}s`,
        memory: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        },
        cpu: {
            user: `${Math.round(cpuUsage.user / 1000)}ms`,
            system: `${Math.round(cpuUsage.system / 1000)}ms`
        }
    });
}
// 로그 필터링 (특정 경로 제외)
function createSelectiveLogger(excludePaths = []) {
    return (req, res, next) => {
        // 제외할 경로인지 확인
        const shouldSkip = excludePaths.some(path => {
            if (path.includes('*')) {
                const regex = new RegExp(path.replace(/\*/g, '.*'));
                return regex.test(req.originalUrl);
            }
            return req.originalUrl.startsWith(path);
        });
        if (shouldSkip) {
            return next();
        }
        // 일반 로깅 수행
        requestLogger(req, res, next);
    };
}
// 주기적 통계 로깅 시작
function startPeriodicLogging(intervalMinutes = 30) {
    const interval = intervalMinutes * 60 * 1000;
    exports.logger.info('주기적 시스템 로깅 시작', { intervalMinutes });
    return setInterval(() => {
        logSystemStats();
    }, interval);
}
// 로깅 미들웨어 조합
function createLoggingMiddleware(options) {
    const middlewares = [];
    // 기본 요청 로깅
    if (options?.excludePaths) {
        middlewares.push(createSelectiveLogger(options.excludePaths));
    }
    else {
        middlewares.push(requestLogger);
    }
    // 성능 로깅
    if (options?.includePerformance !== false) {
        middlewares.push(performanceLogger);
    }
    // 보안 로깅
    if (options?.includeSecurity !== false) {
        middlewares.push(securityLogger);
    }
    return middlewares;
}
exports.default = {
    logger: exports.logger,
    requestLogger,
    performanceLogger,
    securityLogger,
    businessLogger: exports.businessLogger,
    debugLogger: exports.debugLogger,
    logError,
    logSystemStats,
    createSelectiveLogger,
    startPeriodicLogging,
    createLoggingMiddleware
};
