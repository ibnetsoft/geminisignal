"use strict";
// middleware/errorHandler.ts
// 전역 에러 처리 미들웨어
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.CustomError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
exports.handleValidationError = handleValidationError;
exports.handleDatabaseError = handleDatabaseError;
exports.handleAPIError = handleAPIError;
const utils_1 = require("../../utils/utils");
// 커스텀 에러 클래스
class CustomError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
// 에러 로깅 함수
function logError(error, req) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    console.error(`[${timestamp}] ERROR:`, {
        message: error.message,
        statusCode: error.statusCode || 500,
        method,
        url,
        ip,
        stack: error.stack,
        isOperational: error.isOperational
    });
    // 개발 환경에서는 더 자세한 로그
    if (process.env.NODE_ENV === 'development') {
        console.error('Request body:', req.body);
        console.error('Request params:', req.params);
        console.error('Request query:', req.query);
    }
}
// 에러 타입별 상태 코드 결정
function getStatusCode(error) {
    if (error.statusCode) {
        return error.statusCode;
    }
    // 일반적인 에러 패턴 매칭
    const message = error.message.toLowerCase();
    if (message.includes('not found') || message.includes('찾을 수 없')) {
        return 404;
    }
    if (message.includes('unauthorized') || message.includes('권한') || message.includes('인증')) {
        return 401;
    }
    if (message.includes('forbidden') || message.includes('금지') || message.includes('허용되지 않')) {
        return 403;
    }
    if (message.includes('validation') || message.includes('유효하지 않') || message.includes('필수')) {
        return 400;
    }
    if (message.includes('timeout') || message.includes('시간 초과')) {
        return 408;
    }
    if (message.includes('too many') || message.includes('rate limit') || message.includes('제한')) {
        return 429;
    }
    return 500;
}
// 개발 환경용 에러 응답
function sendErrorDev(error, req, res) {
    const statusCode = getStatusCode(error);
    res.status(statusCode).json({
        success: false,
        error: {
            message: error.message,
            statusCode,
            stack: error.stack,
            isOperational: error.isOperational,
            timestamp: new Date().toISOString()
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query
        }
    });
}
// 프로덕션 환경용 에러 응답
function sendErrorProd(error, req, res) {
    const statusCode = getStatusCode(error);
    // 운영상 에러(예상된 에러)인 경우
    if (error.isOperational) {
        res.status(statusCode).json((0, utils_1.formatApiResponse)(false, null, error.message));
        return;
    }
    // 프로그래밍 에러나 예상치 못한 에러인 경우
    console.error('UNEXPECTED ERROR:', error);
    res.status(500).json((0, utils_1.formatApiResponse)(false, null, '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
}
// 메인 에러 핸들러 미들웨어
function errorHandler(error, req, res, next) {
    // 에러 로깅
    logError(error, req);
    // 이미 응답이 전송된 경우 기본 Express 에러 핸들러에 위임
    if (res.headersSent) {
        return next(error);
    }
    // 환경에 따른 에러 응답
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, req, res);
    }
    else {
        sendErrorProd(error, req, res);
    }
}
// 비동기 함수 래퍼 (try-catch 자동화)
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// 404 핸들러 미들웨어
function notFoundHandler(req, res, next) {
    const error = new CustomError(`엔드포인트를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`, 404);
    next(error);
}
// 특정 에러 타입 생성 헬퍼 함수들
exports.createError = {
    badRequest: (message) => new CustomError(message, 400),
    unauthorized: (message) => new CustomError(message, 401),
    forbidden: (message) => new CustomError(message, 403),
    notFound: (message) => new CustomError(message, 404),
    conflict: (message) => new CustomError(message, 409),
    unprocessable: (message) => new CustomError(message, 422),
    tooManyRequests: (message) => new CustomError(message, 429),
    internal: (message) => new CustomError(message, 500)
};
// 유효성 검사 에러 처리
function handleValidationError(errors) {
    const message = `유효성 검사 실패: ${errors.join(', ')}`;
    return new CustomError(message, 400);
}
// 데이터베이스 에러 처리
function handleDatabaseError(error) {
    if (error.code === 'permission-denied') {
        return new CustomError('데이터베이스 접근 권한이 없습니다.', 403);
    }
    if (error.code === 'not-found') {
        return new CustomError('요청한 데이터를 찾을 수 없습니다.', 404);
    }
    if (error.code === 'already-exists') {
        return new CustomError('이미 존재하는 데이터입니다.', 409);
    }
    return new CustomError('데이터베이스 오류가 발생했습니다.', 500);
}
// API 호출 에러 처리
function handleAPIError(error, serviceName) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return new CustomError(`${serviceName} 서비스에 연결할 수 없습니다.`, 503);
    }
    if (error.response?.status === 401) {
        return new CustomError(`${serviceName} API 인증이 실패했습니다.`, 401);
    }
    if (error.response?.status === 403) {
        return new CustomError(`${serviceName} API 접근 권한이 없습니다.`, 403);
    }
    if (error.response?.status === 429) {
        return new CustomError(`${serviceName} API 요청 한도를 초과했습니다.`, 429);
    }
    if (error.response?.status >= 500) {
        return new CustomError(`${serviceName} 서비스에 일시적인 문제가 발생했습니다.`, 503);
    }
    return new CustomError(`${serviceName} API 호출 중 오류가 발생했습니다.`, 500);
}
exports.default = errorHandler;
