"use strict";
// utils/validators.ts
// 유효성 검사 함수들
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSymbol = isValidSymbol;
exports.validateSignalData = validateSignalData;
exports.validateTradingRequest = validateTradingRequest;
exports.isValidConfidenceLevel = isValidConfidenceLevel;
exports.isValidRiskLevel = isValidRiskLevel;
exports.validateTelegramMessage = validateTelegramMessage;
exports.isInRange = isInRange;
exports.isValidEmail = isValidEmail;
exports.isValidURL = isValidURL;
exports.isValidISODate = isValidISODate;
exports.isEmpty = isEmpty;
const constants_1 = require("./constants");
// 심볼 유효성 검사
function isValidSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
        return false;
    }
    return constants_1.VALID_SYMBOLS.includes(symbol.toUpperCase());
}
// 신호 데이터 유효성 검사
function validateSignalData(data) {
    const errors = [];
    // 필수 필드 검사
    if (!data.symbol) {
        errors.push('symbol은 필수입니다');
    }
    else if (!isValidSymbol(data.symbol)) {
        errors.push(`지원하지 않는 심볼입니다: ${data.symbol}. 지원 심볼: ${constants_1.VALID_SYMBOLS.join(', ')}`);
    }
    if (!data.action) {
        errors.push('action은 필수입니다');
    }
    else if (!Object.values(constants_1.SIGNAL_TYPES).includes(data.action.toLowerCase())) {
        errors.push(`잘못된 액션입니다: ${data.action}. 허용값: ${Object.values(constants_1.SIGNAL_TYPES).join(', ')}`);
    }
    if (data.price === undefined || data.price === null) {
        errors.push('price는 필수입니다');
    }
    else if (typeof data.price !== 'number' || data.price <= 0) {
        errors.push('price는 0보다 큰 숫자여야 합니다');
    }
    // 선택적 필드 검사
    if (data.confidence !== undefined) {
        if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
            errors.push('confidence는 0-100 사이의 숫자여야 합니다');
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
// 거래 요청 유효성 검사
function validateTradingRequest(request) {
    const errors = [];
    if (!request.symbol || !isValidSymbol(request.symbol)) {
        errors.push('유효한 symbol이 필요합니다');
    }
    if (!request.action || !Object.values(constants_1.SIGNAL_TYPES).includes(request.action.toLowerCase())) {
        errors.push('유효한 action이 필요합니다 (buy/sell/hold)');
    }
    if (typeof request.volume !== 'number' || request.volume <= 0) {
        errors.push('volume은 0보다 큰 숫자여야 합니다');
    }
    if (request.stopLoss !== undefined && (typeof request.stopLoss !== 'number' || request.stopLoss <= 0)) {
        errors.push('stopLoss는 0보다 큰 숫자여야 합니다');
    }
    if (request.takeProfit !== undefined && (typeof request.takeProfit !== 'number' || request.takeProfit <= 0)) {
        errors.push('takeProfit는 0보다 큰 숫자여야 합니다');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
// 신뢰도 레벨 검사
function isValidConfidenceLevel(level) {
    return Object.values(constants_1.CONFIDENCE_LEVELS).includes(level);
}
// 리스크 레벨 검사
function isValidRiskLevel(level) {
    return Object.values(constants_1.RISK_LEVELS).includes(level);
}
// 텔레그램 메시지 데이터 유효성 검사
function validateTelegramMessage(data) {
    const errors = [];
    if (!data.message) {
        errors.push('message는 필수입니다');
    }
    if (!data.chat || !data.chat.id) {
        errors.push('chat.id는 필수입니다');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
// 숫자 범위 검사
function isInRange(value, min, max) {
    return value >= min && value <= max;
}
// 이메일 형식 검사
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// URL 형식 검사
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
// 날짜 형식 검사 (ISO 8601)
function isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}
// 객체가 비어있는지 검사
function isEmpty(obj) {
    if (obj === null || obj === undefined)
        return true;
    if (typeof obj === 'string' || Array.isArray(obj))
        return obj.length === 0;
    if (typeof obj === 'object')
        return Object.keys(obj).length === 0;
    return false;
}
