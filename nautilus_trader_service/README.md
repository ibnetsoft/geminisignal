# Nautilus Trader Service with MT5 Integration

## 📋 Overview
Professional trading system using Nautilus Trader framework with MetaTrader 5 integration for real-time data and execution.

## 🚀 Features
- **Real-time MT5 Data**: Direct connection to MetaTrader 5 for live market data
- **Technical Analysis Strategy**: Multi-indicator trading strategy (EMA, RSI, MACD, Bollinger Bands, ATR)
- **Risk Management**: Position sizing based on ATR and account risk
- **Backtesting**: Historical data analysis and strategy testing
- **Live Trading**: Automated trade execution through MT5

## 📁 Project Structure
```
nautilus_trader_service/
├── config.py                 # Configuration settings
├── mt5_data_client.py       # MT5 data integration
├── main.py                   # Main application
├── requirements.txt          # Python dependencies
├── strategies/
│   └── technical_strategy.py # Trading strategy implementation
└── README.md                 # This file
```

## 🛠️ Installation

### 1. Install Python Dependencies
```bash
cd nautilus_trader_service
pip install -r requirements.txt
```

### 2. Install MetaTrader 5
- Download and install MT5 from your broker
- Open an account (demo or live)
- Note your login credentials

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# MT5 Credentials
MT5_LOGIN=your_account_number
MT5_PASSWORD=your_password
MT5_SERVER=your_broker_server
MT5_PATH=C:/Program Files/MetaTrader 5/terminal64.exe  # Optional

# Database (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Logging
LOG_LEVEL=INFO
```

## 🏃 Running the System

### Start Live Trading
```bash
python main.py
```

### Run Backtests
Edit `main.py` and set `if True:` in the backtest section, then:
```bash
python main.py
```

## 📊 Trading Strategy

### Technical Indicators Used
1. **EMA Crossover** (12/26): Trend direction
2. **RSI** (14): Overbought/Oversold conditions
3. **MACD**: Momentum and trend confirmation
4. **Bollinger Bands** (20,2): Volatility and support/resistance
5. **ATR** (14): Position sizing and stop-loss placement

### Entry Signals
- **Long Entry**: Signal strength ≥ 3 (multiple bullish indicators)
- **Short Entry**: Signal strength ≤ -3 (multiple bearish indicators)

### Exit Conditions
- Stop Loss: 2x ATR from entry
- Take Profit: 3x ATR from entry
- Reversal Signal: Opposite indicators alignment

### Risk Management
- Max risk per trade: 2% of account
- Position sizing: Based on ATR and stop distance
- Max open positions: 5

## 📈 Supported Symbols
- **Forex**: EURUSD, GBPUSD, USDJPY, AUDUSD
- **Commodities**: XAUUSD (Gold), USOUSD (Oil)
- **Indices**: HKG33, NAS100, US30
- **Crypto**: BTCUSD, ETHUSD, SOLUSD, XRPUSD

## 🔧 Advanced Configuration

### Modify Strategy Parameters
Edit `config.py`:
```python
# Risk Management
MAX_RISK_PER_TRADE = 0.02  # 2% per trade
MAX_DAILY_LOSS = 0.06      # 6% daily loss limit
MAX_OPEN_POSITIONS = 5

# Timeframes
DEFAULT_TIMEFRAME = 'M15'  # 15-minute bars
```

### Add Custom Strategies
1. Create new strategy file in `strategies/` folder
2. Inherit from `nautilus_trader.trading.strategy.Strategy`
3. Implement required methods: `on_start()`, `on_bar()`, `on_stop()`
4. Register in `main.py`

## 📊 Monitoring

### Account Status
The system displays:
- Account balance and equity
- Margin usage and level
- Open positions with P&L
- Real-time bar updates

### Logging
- Logs are saved to `nautilus_trader.log`
- Console output shows real-time updates
- Configure log level in `.env` file

## ⚠️ Important Notes

### Safety
- **Always test on demo account first**
- Set appropriate risk limits
- Monitor system during operation
- Use stop-loss orders

### MT5 Connection
- Ensure MT5 terminal is installed
- Terminal must be running for connection
- Check firewall settings if connection fails

### Performance
- System updates every 15 minutes (M15 timeframe)
- Adjust `updateInterval` for different frequencies
- Monitor CPU/memory usage for multiple symbols

## 🐛 Troubleshooting

### MT5 Connection Issues
```python
# Test connection manually
import MetaTrader5 as mt5
mt5.initialize()
print(mt5.terminal_info())
print(mt5.account_info())
mt5.shutdown()
```

### Missing Dependencies
```bash
# Reinstall Nautilus Trader
pip install --upgrade nautilus-trader

# Install MT5 package
pip install MetaTrader5
```

### Data Issues
- Check symbol names match broker's format
- Verify market is open
- Ensure sufficient historical data exists

## 📚 Resources
- [Nautilus Trader Documentation](https://nautilustrader.io/)
- [MetaTrader 5 Python](https://www.mql5.com/en/docs/python_metatrader5)
- [Technical Analysis Library](https://github.com/bukosabino/ta)

## 📝 License
Internal use only. Do not distribute without permission.