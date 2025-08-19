"use strict";
// middleware/validation.ts
// 요청 데이터 유효성 검사 미들웨어
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBody = requireBody;
exports.validateSignal = validateSignal;
exports.validateTrade = validateTrade;
exports.validateSymbolParam = validateSymbolParam;
exports.validateCollectionName = validateCollectionName;
exports.validateAccountId = validateAccountId;
exports.validatePositionId = validatePositionId;
exports.validateNumericQuery = validateNumericQuery;
exports.validateTradingAccount = validateTradingAccount;
exports.validateWebhookSetup = validateWebhookSetup;
exports.validateTelegramMessage = validateTelegramMessage;
exports.validateExternalSignal = validateExternalSignal;
exports.validatePagination = validatePagination;
exports.validateDateRange = validateDateRange;
exports.requireJSON = requireJSON;
exports.requireApiKey = requireApiKey;
const utils_1 = require("../../utils/utils");
const errorHandler_1 = require("./errorHandler");
// 요청 바디 존재 여부 확인
function requireBody(req, res, next) {
    if (!req.body || Object.keys(req.body).length === 0) {
        throw new errorHandler_1.CustomError('요청 바디가 필요합니다.', 400);
    }
    next();
}
// 신호 데이터 유효성 검사 미들웨어
function validateSignal(req, res, next) {
    const validation = (0, utils_1.validateSignalData)(req.body);
    if (!validation.isValid) {
        throw (0, errorHandler_1.handleValidationError)(validation.errors);
    }
    next();
}
// 거래 요청 유효성 검사 미들웨어
function validateTrade(req, res, next) {
    const validation = (0, utils_1.validateTradingRequest)(req.body);
    if (!validation.isValid) {
        throw (0, errorHandler_1.handleValidationError)(validation.errors);
    }
    next();
}
// 심볼 파라미터 유효성 검사
function validateSymbolParam(req, res, next) {
    const symbol = req.params.symbol?.toUpperCase();
    if (!symbol) {
        throw new errorHandler_1.CustomError('심볼 파라미터가 필요합니다.', 400);
    }
    if (!utils_1.VALID_SYMBOLS.includes(symbol)) {
        throw new errorHandler_1.CustomError(`지원하지 않는 심볼입니다: ${symbol}. 지원 심볼: ${utils_1.VALID_SYMBOLS.join(', ')}`, 400);
    }
    // 검증된 심볼을 req에 저장
    req.params.symbol = symbol;
    next();
}
// 컬렉션 이름 유효성 검사
function validateCollectionName(req, res, next) {
    const collectionName = req.params.collectionName;
    if (!collectionName) {
        throw new errorHandler_1.CustomError('컬렉션 이름이 필요합니다.', 400);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(collectionName)) {
        throw new errorHandler_1.CustomError('컬렉션 이름은 영문, 숫자, 언더스코어, 하이픈만 사용 가능합니다.', 400);
    }
    next();
}
// 계정 ID 유효성 검사
function validateAccountId(req, res, next) {
    const accountId = req.params.accountId;
    if (!accountId) {
        throw new errorHandler_1.CustomError('계정 ID가 필요합니다.', 400);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(accountId)) {
        throw new errorHandler_1.CustomError('유효하지 않은 계정 ID 형식입니다.', 400);
    }
    next();
}
// 포지션 ID 유효성 검사
function validatePositionId(req, res, next) {
    const positionId = req.params.positionId;
    if (!positionId) {
        throw new errorHandler_1.CustomError('포지션 ID가 필요합니다.', 400);
    }
    next();
}
// 숫자 쿼리 파라미터 유효성 검사
function validateNumericQuery(paramName, min, max) {
    return (req, res, next) => {
        const value = req.query[paramName];
        if (value !== undefined) {
            const numValue = parseInt(value, 10);
            if (isNaN(numValue)) {
                throw new errorHandler_1.CustomError(`${paramName}는 숫자여야 합니다.`, 400);
            }
            if (min !== undefined && numValue < min) {
                throw new errorHandler_1.CustomError(`${paramName}는 ${min} 이상이어야 합니다.`, 400);
            }
            if (max !== undefined && numValue > max) {
                throw new errorHandler_1.CustomError(`${paramName}는 ${max} 이하여야 합니다.`, 400);
            }
            // 검증된 숫자 값을 저장
            req.query[paramName] = numValue.toString();
        }
        next();
    };
}
// 거래 계정 데이터 유효성 검사
function validateTradingAccount(req, res, next) {
    const { accountId, name, server, login, password } = req.body;
    const errors = [];
    if (!accountId || typeof accountId !== 'string') {
        errors.push('accountId는 필수 문자열입니다.');
    }
    if (!name || typeof name !== 'string') {
        errors.push('name은 필수 문자열입니다.');
    }
    if (!server || typeof server !== 'string') {
        errors.push('server는 필수 문자열입니다.');
    }
    if (!login || typeof login !== 'string') {
        errors.push('login은 필수 문자열입니다.');
    }
    if (!password || typeof password !== 'string') {
        errors.push('password는 필수 문자열입니다.');
    }
    if (errors.length > 0) {
        throw (0, errorHandler_1.handleValidationError)(errors);
    }
    next();
}
// 웹훅 설정 데이터 유효성 검사
function validateWebhookSetup(req, res, next) {
    const { webhookUrl } = req.body;
    if (!webhookUrl || typeof webhookUrl !== 'string') {
        throw new errorHandler_1.CustomError('webhookUrl은 필수 문자열입니다.', 400);
    }
    // URL 형식 검사
    try {
        new URL(webhookUrl);
    }
    catch {
        throw new errorHandler_1.CustomError('유효하지 않은 URL 형식입니다.', 400);
    }
    // HTTPS 확인 (프로덕션 환경)
    if (process.env.NODE_ENV === 'production' && !webhookUrl.startsWith('https://')) {
        throw new errorHandler_1.CustomError('프로덕션 환경에서는 HTTPS URL이 필요합니다.', 400);
    }
    next();
}
// 텔레그램 메시지 데이터 유효성 검사
function validateTelegramMessage(req, res, next) {
    const { message, chatId } = req.body;
    const errors = [];
    if (!message || typeof message !== 'string') {
        errors.push('message는 필수 문자열입니다.');
    }
    else if (message.length === 0) {
        errors.push('message는 비어있을 수 없습니다.');
    }
    else if (message.length > 4096) {
        errors.push('message는 4096자를 초과할 수 없습니다.');
    }
    if (chatId && typeof chatId !== 'string') {
        errors.push('chatId는 문자열이어야 합니다.');
    }
    if (errors.length > 0) {
        throw (0, errorHandler_1.handleValidationError)(errors);
    }
    next();
}
// 외부 신호 데이터 유효성 검사
function validateExternalSignal(req, res, next) {
    const { symbol, action, price } = req.body;
    const errors = [];
    if (!symbol || typeof symbol !== 'string') {
        errors.push('symbol은 필수 문자열입니다.');
    }
    else if (!utils_1.VALID_SYMBOLS.includes(symbol.toUpperCase())) {
        errors.push(`지원하지 않는 심볼입니다: ${symbol}`);
    }
    if (!action || typeof action !== 'string') {
        errors.push('action은 필수 문자열입니다.');
    }
    else if (!['buy', 'sell', 'hold'].includes(action.toLowerCase())) {
        errors.push('action은 buy, sell, hold 중 하나여야 합니다.');
    }
    if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
            errors.push('price는 0보다 큰 숫자여야 합니다.');
        }
    }
    if (errors.length > 0) {
        throw (0, errorHandler_1.handleValidationError)(errors);
    }
    // 정규화된 데이터 저장
    req.body.symbol = symbol.toUpperCase();
    req.body.action = action.toLowerCase();
    next();
}
// 페이지네이션 파라미터 유효성 검사
function validatePagination(req, res, next) {
    const limit = req.query.limit;
    const offset = req.query.offset;
    if (limit) {
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            throw new errorHandler_1.CustomError('limit은 1~1000 사이의 숫자여야 합니다.', 400);
        }
        req.query.limit = limitNum.toString();
    }
    if (offset) {
        const offsetNum = parseInt(offset, 10);
        if (isNaN(offsetNum) || offsetNum < 0) {
            throw new errorHandler_1.CustomError('offset은 0 이상의 숫자여야 합니다.', 400);
        }
        req.query.offset = offsetNum.toString();
    }
    next();
}
// 날짜 범위 쿼리 파라미터 유효성 검사
function validateDateRange(req, res, next) {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const days = req.query.days;
    if (startDate && !isValidISODate(startDate)) {
        throw new errorHandler_1.CustomError('startDate는 유효한 ISO 8601 날짜 형식이어야 합니다.', 400);
    }
    if (endDate && !isValidISODate(endDate)) {
        throw new errorHandler_1.CustomError('endDate는 유효한 ISO 8601 날짜 형식이어야 합니다.', 400);
    }
    if (days) {
        const daysNum = parseInt(days, 10);
        if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
            throw new errorHandler_1.CustomError('days는 1~365 사이의 숫자여야 합니다.', 400);
        }
        req.query.days = daysNum.toString();
    }
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            throw new errorHandler_1.CustomError('startDate는 endDate보다 이전이어야 합니다.', 400);
        }
    }
    next();
}
// 헬퍼 함수: ISO 8601 날짜 형식 검사
function isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) &&
        date.toISOString().substring(0, 10) === dateString.substring(0, 10);
}
// Content-Type 검사 미들웨어
function requireJSON(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new errorHandler_1.CustomError('Content-Type은 application/json이어야 합니다.', 400);
        }
    }
    next();
}
// API 키 검사 (간단한 구현)
function requireApiKey(req, res, next) {
    const apiKey = req.get('X-API-Key') || req.query.apiKey;
    const validApiKey = process.env.API_KEY;
    if (!validApiKey) {
        // API 키가 설정되지 않은 경우 통과
        return next();
    }
    if (!apiKey) {
        throw new errorHandler_1.CustomError('API 키가 필요합니다. X-API-Key 헤더 또는 apiKey 쿼리 파라미터를 제공해주세요.', 401);
    }
    if (apiKey !== validApiKey) {
        throw new errorHandler_1.CustomError('유효하지 않은 API 키입니다.', 401);
    }
    next();
}
exports.default = {
    requireBody,
    validateSignal,
    validateTrade,
    validateSymbolParam,
    validateCollectionName,
    validateAccountId,
    validatePositionId,
    validateNumericQuery,
    validateTradingAccount,
    validateWebhookSetup,
    validateTelegramMessage,
    validateExternalSignal,
    validatePagination,
    validateDateRange,
    requireJSON,
    requireApiKey
};
