"use strict";
// utils/formatters.ts
// 데이터 포맷팅 함수들
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrice = formatPrice;
exports.formatCurrency = formatCurrency;
exports.formatPercentage = formatPercentage;
exports.formatDateTime = formatDateTime;
exports.formatTime = formatTime;
exports.formatDate = formatDate;
exports.formatRelativeTime = formatRelativeTime;
exports.formatSignalType = formatSignalType;
exports.formatConfidenceLevel = formatConfidenceLevel;
exports.formatRiskLevel = formatRiskLevel;
exports.formatSymbolName = formatSymbolName;
exports.formatVolume = formatVolume;
exports.formatLotSize = formatLotSize;
exports.formatProfitLoss = formatProfitLoss;
exports.formatRiskRewardRatio = formatRiskRewardRatio;
exports.formatConfidencePercentage = formatConfidencePercentage;
exports.formatTelegramMessage = formatTelegramMessage;
exports.formatApiResponse = formatApiResponse;
exports.formatTradeExecution = formatTradeExecution;
exports.formatLargeNumber = formatLargeNumber;
exports.truncateString = truncateString;
exports.formatJSON = formatJSON;
const constants_1 = require("./constants");
// 가격 포맷팅 (심볼별 소수점 자리수)
function formatPrice(price, symbol) {
    const decimalPlaces = {
        'EURUSD': 5,
        'GBPUSD': 5,
        'USDJPY': 3,
        'XAUUSD': 2,
        'USOUSD': 2,
        'BTCUSD': 2,
        'NAS100': 1,
        'HKG33': 1
    };
    const places = decimalPlaces[symbol.toUpperCase()] || 2;
    return price.toFixed(places);
}
// 통화 포맷팅
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
// 퍼센트 포맷팅
function formatPercentage(value, decimalPlaces = 2) {
    return `${value.toFixed(decimalPlaces)}%`;
}
// 날짜/시간 포맷팅 (한국 시간)
function formatDateTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
// 시간만 포맷팅
function formatTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
// 날짜만 포맷팅
function formatDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
// 상대 시간 포맷팅 (예: "3분 전", "1시간 전")
function formatRelativeTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSeconds < 60) {
        return `${diffSeconds}초 전`;
    }
    else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    }
    else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    }
    else {
        return `${diffDays}일 전`;
    }
}
// 신호 타입 한글 변환
function formatSignalType(type) {
    const typeMap = {
        [constants_1.SIGNAL_TYPES.BUY]: '매수',
        [constants_1.SIGNAL_TYPES.SELL]: '매도',
        [constants_1.SIGNAL_TYPES.HOLD]: '관망'
    };
    return typeMap[type.toLowerCase()] || type;
}
// 신뢰도 레벨 한글 변환
function formatConfidenceLevel(level) {
    const levelMap = {
        [constants_1.CONFIDENCE_LEVELS.LOW]: '낮음',
        [constants_1.CONFIDENCE_LEVELS.MEDIUM]: '보통',
        [constants_1.CONFIDENCE_LEVELS.HIGH]: '높음',
        [constants_1.CONFIDENCE_LEVELS.VERY_HIGH]: '매우 높음'
    };
    return levelMap[level.toLowerCase()] || level;
}
// 리스크 레벨 한글 변환
function formatRiskLevel(level) {
    const levelMap = {
        [constants_1.RISK_LEVELS.LOW]: '낮음',
        [constants_1.RISK_LEVELS.MEDIUM]: '보통',
        [constants_1.RISK_LEVELS.HIGH]: '높음'
    };
    return levelMap[level.toLowerCase()] || level;
}
// 심볼 한글 이름 변환
function formatSymbolName(symbol) {
    const symbolMap = {
        'EURUSD': '유로/달러',
        'GBPUSD': '파운드/달러',
        'USDJPY': '달러/엔',
        'XAUUSD': '금/달러',
        'USOUSD': '원유/달러',
        'BTCUSD': '비트코인/달러',
        'NAS100': '나스닥 100',
        'HKG33': '항셍 지수'
    };
    return symbolMap[symbol.toUpperCase()] || symbol;
}
// 거래량 포맷팅
function formatVolume(volume) {
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
    }
    else if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}K`;
    }
    else {
        return volume.toFixed(2);
    }
}
// 로트 사이즈 포맷팅
function formatLotSize(lotSize) {
    return lotSize.toFixed(2);
}
// 손익 포맷팅 (색상 이모지 포함)
function formatProfitLoss(amount, currency = 'USD') {
    const formatted = formatCurrency(amount, currency);
    const emoji = amount > 0 ? '🟢' : amount < 0 ? '🔴' : '⚪';
    return `${emoji} ${formatted}`;
}
// 리스크-리워드 비율 포맷팅
function formatRiskRewardRatio(ratio) {
    return `1:${ratio.toFixed(2)}`;
}
// 신뢰도 퍼센트 포맷팅 (색상 이모지 포함)
function formatConfidencePercentage(confidence) {
    let emoji = '⚪';
    if (confidence >= 90)
        emoji = '🟢';
    else if (confidence >= 75)
        emoji = '🟡';
    else if (confidence >= 50)
        emoji = '🟠';
    else
        emoji = '🔴';
    return `${emoji} ${confidence.toFixed(1)}%`;
}
// 텔레그램 메시지 포맷팅
function formatTelegramMessage(data) {
    const symbolName = formatSymbolName(data.symbol);
    const actionName = formatSignalType(data.action);
    const formattedPrice = formatPrice(data.price, data.symbol);
    const time = data.timestamp ? formatTime(data.timestamp) : formatTime(new Date());
    let message = `📊 *거래 신호*\n\n`;
    message += `🎯 종목: ${symbolName} (${data.symbol})\n`;
    message += `📈 액션: *${actionName}*\n`;
    message += `💰 가격: ${formattedPrice}\n`;
    if (data.confidence) {
        message += `${formatConfidencePercentage(data.confidence)} 신뢰도\n`;
    }
    message += `⏰ 시간: ${time}\n`;
    if (data.analysis) {
        message += `\n📋 분석:\n${data.analysis}`;
    }
    return message;
}
// API 응답 포맷팅
function formatApiResponse(success, data, message, errors) {
    const response = {
        success,
        timestamp: new Date().toISOString()
    };
    if (success) {
        if (data)
            response.data = data;
        if (message)
            response.message = message;
    }
    else {
        if (message)
            response.error = message;
        if (errors && errors.length > 0)
            response.errors = errors;
    }
    return response;
}
// 거래 실행 결과 포맷팅
function formatTradeExecution(trade) {
    const symbolName = formatSymbolName(trade.symbol);
    const actionName = formatSignalType(trade.action);
    const formattedPrice = formatPrice(trade.price, trade.symbol);
    const formattedVolume = formatLotSize(trade.volume);
    let message = `🚀 *거래 실행*\n\n`;
    message += `🎯 종목: ${symbolName}\n`;
    message += `📈 액션: ${actionName}\n`;
    message += `📊 물량: ${formattedVolume} 로트\n`;
    message += `💰 가격: ${formattedPrice}\n`;
    message += `📋 상태: ${trade.status}\n`;
    if (trade.profit !== undefined) {
        message += `💵 손익: ${formatProfitLoss(trade.profit)}\n`;
    }
    message += `⏰ 시간: ${formatTime(new Date())}`;
    return message;
}
// 숫자 단위 포맷팅 (K, M, B)
function formatLargeNumber(num) {
    if (num >= 1e9) {
        return `${(num / 1e9).toFixed(1)}B`;
    }
    else if (num >= 1e6) {
        return `${(num / 1e6).toFixed(1)}M`;
    }
    else if (num >= 1e3) {
        return `${(num / 1e3).toFixed(1)}K`;
    }
    else {
        return num.toString();
    }
}
// 문자열 자르기 (말줄임표 포함)
function truncateString(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
}
// JSON 예쁘게 포맷팅
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}
