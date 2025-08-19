"use strict";
// utils/calculators.ts
// 거래 관련 계산 함수들
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePositionSize = calculatePositionSize;
exports.calculateRiskRewardRatio = calculateRiskRewardRatio;
exports.getContractSize = getContractSize;
exports.calculateProfitLoss = calculateProfitLoss;
exports.calculateMarginRequirement = calculateMarginRequirement;
exports.calculateSwapPoints = calculateSwapPoints;
exports.calculateVolatilityStopLoss = calculateVolatilityStopLoss;
exports.adjustPositionByConfidence = adjustPositionByConfidence;
exports.calculateDrawdown = calculateDrawdown;
exports.calculateSharpeRatio = calculateSharpeRatio;
exports.calculateCompoundGrowth = calculateCompoundGrowth;
exports.calculateBeta = calculateBeta;
const constants_1 = require("./constants");
// 포지션 사이즈 계산 (리스크 기반)
function calculatePositionSize(params) {
    const { entryPrice, stopLoss, accountBalance, riskPercentage } = params;
    if (!stopLoss || stopLoss <= 0) {
        return {
            lotSize: 0,
            riskAmount: 0,
            stopLossDistance: 0,
            recommendation: '스탑로스가 설정되지 않아 포지션 계산을 할 수 없습니다'
        };
    }
    // 스탑로스 거리 계산
    const stopLossDistance = Math.abs(entryPrice - stopLoss);
    // 리스크 금액 계산
    const maxRiskPercentage = Math.min(riskPercentage, constants_1.TRADING_LIMITS.MAX_RISK_PER_TRADE * 100);
    const riskAmount = accountBalance * (maxRiskPercentage / 100);
    // 기본 로트 사이즈 계산 (1 lot = 100,000 units for forex)
    let lotSize = riskAmount / (stopLossDistance * getContractSize(params.symbol));
    // 최소/최대 로트 사이즈 제한
    lotSize = Math.max(constants_1.TRADING_LIMITS.MIN_LOT_SIZE, Math.min(lotSize, constants_1.TRADING_LIMITS.MAX_LOT_SIZE));
    // 소수점 2자리로 반올림
    lotSize = Math.round(lotSize * 100) / 100;
    let recommendation = '';
    if (lotSize === constants_1.TRADING_LIMITS.MIN_LOT_SIZE) {
        recommendation = '최소 로트 사이즈로 설정되었습니다';
    }
    else if (lotSize === constants_1.TRADING_LIMITS.MAX_LOT_SIZE) {
        recommendation = '최대 로트 사이즈로 제한되었습니다';
    }
    else {
        recommendation = '리스크 기반으로 계산된 적정 포지션 사이즈입니다';
    }
    return {
        lotSize,
        riskAmount,
        stopLossDistance,
        recommendation
    };
}
// 리스크-리워드 비율 계산
function calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit) {
    const riskAmount = Math.abs(entryPrice - stopLoss);
    const rewardAmount = Math.abs(takeProfit - entryPrice);
    const ratio = rewardAmount / riskAmount;
    const isAcceptable = ratio >= 1.5; // 1:1.5 이상을 권장
    return {
        ratio: Math.round(ratio * 100) / 100,
        riskAmount,
        rewardAmount,
        isAcceptable
    };
}
// 심볼별 계약 크기 반환
function getContractSize(symbol) {
    const contractSizes = {
        'EURUSD': 100000,
        'GBPUSD': 100000,
        'USDJPY': 100000,
        'XAUUSD': 100, // 금
        'USOUSD': 1000, // 원유
        'BTCUSD': 1, // 비트코인
        'NAS100': 1, // 나스닥
        'HKG33': 1 // 항셍
    };
    return contractSizes[symbol.toUpperCase()] || 100000;
}
// 수익률 계산
function calculateProfitLoss(action, entryPrice, exitPrice, lotSize, symbol) {
    const contractSize = getContractSize(symbol);
    const priceDifference = action.toLowerCase() === 'buy'
        ? exitPrice - entryPrice
        : entryPrice - exitPrice;
    return priceDifference * lotSize * contractSize;
}
// 마진 요구사항 계산
function calculateMarginRequirement(lotSize, price, symbol, leverage = 100) {
    const contractSize = getContractSize(symbol);
    const notionalValue = lotSize * contractSize * price;
    return notionalValue / leverage;
}
// 스왑 포인트 계산 (일일 금융비용)
function calculateSwapPoints(symbol, action, lotSize) {
    // 심볼별 스왑 레이트 (예시 값들)
    const swapRates = {
        'EURUSD': { buy: -0.5, sell: 0.1 },
        'GBPUSD': { buy: -0.3, sell: -0.1 },
        'USDJPY': { buy: 0.2, sell: -0.8 },
        'XAUUSD': { buy: -2.0, sell: -1.5 },
        'USOUSD': { buy: -0.1, sell: -0.2 },
        'BTCUSD': { buy: 0, sell: 0 },
        'NAS100': { buy: -0.5, sell: -0.3 },
        'HKG33': { buy: -0.4, sell: -0.2 }
    };
    const rates = swapRates[symbol.toUpperCase()];
    if (!rates)
        return 0;
    const rate = action.toLowerCase() === 'buy' ? rates.buy : rates.sell;
    return rate * lotSize;
}
// 변동성 기반 스탑로스 계산
function calculateVolatilityStopLoss(currentPrice, action, atr, // Average True Range
multiplier = 2) {
    const stopDistance = atr * multiplier;
    if (action.toLowerCase() === 'buy') {
        return currentPrice - stopDistance;
    }
    else {
        return currentPrice + stopDistance;
    }
}
// 신뢰도 기반 포지션 조정
function adjustPositionByConfidence(basePositionSize, confidence) {
    // 신뢰도가 높을수록 포지션 크기 증가
    const confidenceMultiplier = Math.min(confidence / 100, 1);
    return basePositionSize * confidenceMultiplier;
}
// 드로다운 계산
function calculateDrawdown(peakValue, currentValue) {
    return ((peakValue - currentValue) / peakValue) * 100;
}
// 샤프 비율 계산
function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
    if (returns.length === 0)
        return 0;
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const excessReturn = avgReturn - riskFreeRate;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);
    return standardDeviation === 0 ? 0 : excessReturn / standardDeviation;
}
// 복리 계산
function calculateCompoundGrowth(principal, monthlyReturnRate, months) {
    return principal * Math.pow(1 + monthlyReturnRate, months);
}
// 포트폴리오 베타 계산
function calculateBeta(assetReturns, marketReturns) {
    if (assetReturns.length !== marketReturns.length || assetReturns.length === 0) {
        return 1; // 기본값
    }
    const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / assetReturns.length;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
    let covariance = 0;
    let marketVariance = 0;
    for (let i = 0; i < assetReturns.length; i++) {
        covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
        marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }
    return marketVariance === 0 ? 1 : covariance / marketVariance;
}
