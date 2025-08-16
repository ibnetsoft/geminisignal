"""
Nautilus Trader API Server
Node.js와 통신하기 위한 FastAPI 서버
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import asyncio
import uvicorn

from config import config
from mt5_data_client import mt5_data_client
from strategies.technical_strategy import TechnicalStrategy

app = FastAPI(title="Nautilus Trader API", version="1.0.0")

# CORS 설정 (Node.js에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수
strategies = {}
backtest_results = {}


class BacktestRequest(BaseModel):
    symbol: str
    strategy: str = "technical_strategy"
    period: str = "30d"
    capital: float = 10000
    risk_per_trade: float = 0.02


class SignalResponse(BaseModel):
    symbol: str
    action: str  # BUY, SELL, HOLD
    confidence: float
    indicators: Dict
    timestamp: datetime


@app.on_event("startup")
async def startup_event():
    """서버 시작 시 MT5 연결"""
    print("🚀 Starting Nautilus Trader API Server...")
    connected = await mt5_data_client.connect()
    if connected:
        print("✅ MT5 Connected")
    else:
        print("❌ MT5 Connection Failed")


@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 정리"""
    await mt5_data_client.disconnect()
    print("✅ Server shutdown complete")


@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "mt5_connected": mt5_data_client.mt5_initialized,
        "timestamp": datetime.now()
    }


@app.get("/status")
async def get_status():
    """시스템 상태 조회"""
    account_info = await mt5_data_client.get_account_info()
    positions = await mt5_data_client.get_positions()
    
    return {
        "status": "connected" if mt5_data_client.mt5_initialized else "disconnected",
        "account": account_info,
        "open_positions": len(positions),
        "active_strategies": len(strategies),
        "timestamp": datetime.now()
    }


@app.post("/backtest")
async def run_backtest(request: BacktestRequest):
    """백테스트 실행"""
    try:
        print(f"📊 Running backtest for {request.symbol}...")
        
        # 과거 데이터 가져오기
        days = int(request.period.replace('d', ''))
        bars_needed = days * 96  # M15 기준 하루 96개 바
        
        historical_data = await mt5_data_client.get_historical_bars(
            request.symbol,
            'M15',
            bars_needed
        )
        
        if historical_data.empty:
            raise HTTPException(status_code=404, detail=f"No data for {request.symbol}")
        
        # 백테스트 실행 (간단한 시뮬레이션)
        results = simulate_backtest(historical_data, request)
        
        # 결과 저장
        backtest_results[request.symbol] = results
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/performance/{symbol}")
async def get_performance(symbol: str):
    """성과 지표 조회"""
    if symbol not in backtest_results:
        raise HTTPException(status_code=404, detail=f"No backtest results for {symbol}")
    
    results = backtest_results[symbol]
    
    return {
        "symbol": symbol,
        "sharpe_ratio": results.get("sharpe_ratio", 0),
        "sortino_ratio": results.get("sortino_ratio", 0),
        "max_drawdown": results.get("max_drawdown", 0),
        "win_rate": results.get("win_rate", 0),
        "profit_factor": results.get("profit_factor", 0),
        "total_return": results.get("total_return", 0),
        "total_trades": results.get("total_trades", 0)
    }


@app.get("/risk/{symbol}")
async def get_risk_metrics(symbol: str):
    """리스크 지표 조회"""
    if symbol not in backtest_results:
        raise HTTPException(status_code=404, detail=f"No backtest results for {symbol}")
    
    results = backtest_results[symbol]
    
    return {
        "symbol": symbol,
        "var_95": results.get("var_95", 0),
        "cvar_95": results.get("cvar_95", 0),
        "volatility": results.get("volatility", 0),
        "beta": results.get("beta", 1.0),
        "correlation": results.get("correlation", {}),
        "downside_deviation": results.get("downside_deviation", 0)
    }


@app.get("/indicators/{symbol}")
async def get_current_indicators(symbol: str):
    """현재 기술 지표 조회"""
    try:
        # 최신 데이터 가져오기
        bars = await mt5_data_client.get_historical_bars(symbol, 'M15', 100)
        
        if bars.empty:
            raise HTTPException(status_code=404, detail=f"No data for {symbol}")
        
        # 지표 계산
        indicators = calculate_indicators(bars)
        
        # 신호 생성
        signal = generate_signal(indicators)
        
        return SignalResponse(
            symbol=symbol,
            action=signal['action'],
            confidence=signal['confidence'],
            indicators=indicators,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/prices")
async def get_current_prices(symbols: Optional[List[str]] = None):
    """현재 가격 조회"""
    if not symbols:
        symbols = config.SYMBOLS
    
    prices = await mt5_data_client.get_current_prices(symbols)
    return prices


@app.post("/subscribe/{symbol}")
async def subscribe_to_symbol(symbol: str):
    """심볼 구독 시작"""
    try:
        await mt5_data_client.subscribe_bars(
            symbol,
            config.DEFAULT_TIMEFRAME,
            callback=None  # 콜백은 내부적으로 처리
        )
        return {"status": "subscribed", "symbol": symbol}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/subscribe/{symbol}")
async def unsubscribe_from_symbol(symbol: str):
    """심볼 구독 해제"""
    await mt5_data_client.unsubscribe(symbol)
    return {"status": "unsubscribed", "symbol": symbol}


def simulate_backtest(data, request):
    """간단한 백테스트 시뮬레이션"""
    import numpy as np
    import pandas as pd
    
    # 지표 계산
    data['returns'] = data['close'].pct_change()
    data['sma_20'] = data['close'].rolling(window=20).mean()
    data['rsi'] = calculate_rsi(data['close'])
    
    # 신호 생성
    data['signal'] = 0
    data.loc[data['close'] > data['sma_20'], 'signal'] = 1
    data.loc[data['close'] < data['sma_20'], 'signal'] = -1
    
    # 포지션 및 수익 계산
    data['position'] = data['signal'].shift(1)
    data['strategy_returns'] = data['position'] * data['returns']
    
    # 성과 지표 계산
    total_return = (1 + data['strategy_returns']).prod() - 1
    sharpe_ratio = data['strategy_returns'].mean() / data['strategy_returns'].std() * np.sqrt(252)
    
    # 낙폭 계산
    cumulative = (1 + data['strategy_returns']).cumprod()
    running_max = cumulative.cummax()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min()
    
    # 거래 통계
    trades = data['signal'].diff().fillna(0)
    total_trades = abs(trades).sum() / 2
    
    winning_trades = data[data['strategy_returns'] > 0]['strategy_returns'].count()
    losing_trades = data[data['strategy_returns'] < 0]['strategy_returns'].count()
    win_rate = winning_trades / (winning_trades + losing_trades) * 100 if (winning_trades + losing_trades) > 0 else 0
    
    return {
        "symbol": request.symbol,
        "period": request.period,
        "capital": request.capital,
        "total_return": float(total_return * 100),
        "sharpe_ratio": float(sharpe_ratio),
        "sortino_ratio": float(sharpe_ratio * 0.8),  # 간단한 추정
        "max_drawdown": float(max_drawdown * 100),
        "win_rate": float(win_rate),
        "profit_factor": 1.5,  # 임시값
        "total_trades": int(total_trades),
        "var_95": float(data['returns'].quantile(0.05) * 100),
        "cvar_95": float(data['returns'][data['returns'] <= data['returns'].quantile(0.05)].mean() * 100),
        "volatility": float(data['returns'].std() * np.sqrt(252) * 100),
        "beta": 1.0,
        "downside_deviation": float(data[data['returns'] < 0]['returns'].std() * np.sqrt(252) * 100)
    }


def calculate_rsi(prices, period=14):
    """RSI 계산"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calculate_indicators(data):
    """기술 지표 계산"""
    close = data['close']
    
    # 이동평균
    sma_20 = close.rolling(window=20).mean().iloc[-1]
    ema_12 = close.ewm(span=12).mean().iloc[-1]
    ema_26 = close.ewm(span=26).mean().iloc[-1]
    
    # RSI
    rsi = calculate_rsi(close).iloc[-1]
    
    # MACD
    macd_line = ema_12 - ema_26
    
    # ATR
    high_low = data['high'] - data['low']
    high_close = abs(data['high'] - close.shift())
    low_close = abs(data['low'] - close.shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    atr = true_range.rolling(window=14).mean().iloc[-1]
    
    return {
        "sma_20": float(sma_20),
        "ema_12": float(ema_12),
        "ema_26": float(ema_26),
        "rsi": float(rsi),
        "macd": float(macd_line),
        "atr": float(atr),
        "current_price": float(close.iloc[-1])
    }


def generate_signal(indicators):
    """거래 신호 생성"""
    score = 0
    
    # RSI 신호
    if indicators['rsi'] < 30:
        score += 2  # 과매도
    elif indicators['rsi'] > 70:
        score -= 2  # 과매수
        
    # 이동평균 신호
    if indicators['ema_12'] > indicators['ema_26']:
        score += 1
    else:
        score -= 1
        
    # MACD 신호
    if indicators['macd'] > 0:
        score += 1
    else:
        score -= 1
    
    # 최종 결정
    if score >= 2:
        action = "BUY"
        confidence = min(score * 20, 100)
    elif score <= -2:
        action = "SELL"
        confidence = min(abs(score) * 20, 100)
    else:
        action = "HOLD"
        confidence = 50
    
    return {
        "action": action,
        "confidence": confidence,
        "score": score
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=config.API_HOST,
        port=config.API_PORT,
        log_level=config.LOG_LEVEL.lower()
    )