"""
Nautilus Trader Configuration
MT5 Integration Settings
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

class Config:
    """Main configuration class for Nautilus Trader"""
    
    # MetaTrader 5 Settings
    MT5_LOGIN = int(os.getenv('MT5_LOGIN', '0'))
    MT5_PASSWORD = os.getenv('MT5_PASSWORD', '')
    MT5_SERVER = os.getenv('MT5_SERVER', '')
    MT5_PATH = os.getenv('MT5_PATH', '')
    
    # Nautilus Trader Settings
    DATA_ENGINE_CACHE = True
    DATA_ENGINE_VALIDATE = True
    RISK_ENGINE_ENABLED = True
    
    # Trading Settings
    BASE_CURRENCY = 'USD'
    DEFAULT_LEVERAGE = 100
    MAX_POSITION_SIZE = 1.0  # Lots
    
    # Symbols to Trade
    SYMBOLS = [
        'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD',
        'XAUUSD', 'USOUSD',
        'HKG33', 'NAS100', 'US30',
        'BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'
    ]
    
    # Timeframes
    TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1']
    DEFAULT_TIMEFRAME = 'M15'
    
    # Risk Management
    MAX_RISK_PER_TRADE = 0.02  # 2% per trade
    MAX_DAILY_LOSS = 0.06  # 6% daily loss limit
    MAX_OPEN_POSITIONS = 5
    
    # Data Settings
    HISTORICAL_BARS = 1000
    TICK_BUFFER_SIZE = 10000
    
    # API Settings
    API_HOST = '0.0.0.0'
    API_PORT = 8000
    
    # Database Settings
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = 'nautilus_trader.log'
    
    # Backtest Settings
    BACKTEST_START_DATE = '2023-01-01'
    BACKTEST_END_DATE = '2024-01-01'
    BACKTEST_CAPITAL = 10000.0
    
    @classmethod
    def validate(cls):
        """Validate configuration"""
        if not cls.MT5_LOGIN:
            raise ValueError("MT5_LOGIN is required")
        if not cls.MT5_PASSWORD:
            raise ValueError("MT5_PASSWORD is required")
        if not cls.MT5_SERVER:
            raise ValueError("MT5_SERVER is required")
        return True

# Create config instance
config = Config()