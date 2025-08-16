"""
Nautilus Trader Main Application
Integrates MT5 data and executes trading strategies
"""

import asyncio
import sys
from datetime import datetime
import MetaTrader5 as mt5
from typing import Dict, List

from nautilus_trader.backtest.node import BacktestNode
from nautilus_trader.config import BacktestConfig
from nautilus_trader.core.datetime import dt_to_unix_nanos
from nautilus_trader.model.identifiers import InstrumentId, Symbol, Venue
from nautilus_trader.model.data import BarType, BarSpecification, BarAggregation

from config import config
from mt5_data_client import mt5_data_client
from strategies.technical_strategy import TechnicalStrategy


class NautilusTraderApp:
    """
    Main application for Nautilus Trader with MT5 integration
    """
    
    def __init__(self):
        self.data_client = mt5_data_client
        self.strategies = {}
        self.running = False
        
    async def initialize(self):
        """Initialize the trading system"""
        print("🚀 Initializing Nautilus Trader with MT5...")
        
        # Validate configuration
        try:
            config.validate()
        except ValueError as e:
            print(f"❌ Configuration error: {e}")
            return False
        
        # Connect to MT5
        connected = await self.data_client.connect()
        if not connected:
            print("❌ Failed to connect to MT5")
            return False
        
        # Initialize strategies for configured symbols
        await self.initialize_strategies()
        
        print("✅ Nautilus Trader initialized successfully")
        return True
    
    async def initialize_strategies(self):
        """Initialize trading strategies for all symbols"""
        for symbol in config.SYMBOLS:
            try:
                # Create instrument ID
                instrument_id = InstrumentId(
                    symbol=Symbol(symbol),
                    venue=Venue("MT5")
                )
                
                # Create bar type
                bar_type = BarType(
                    instrument_id=instrument_id,
                    bar_spec=BarSpecification(
                        step=15,
                        aggregation=BarAggregation.MINUTE
                    )
                )
                
                # Create strategy instance
                strategy = TechnicalStrategy(
                    instrument_id=instrument_id,
                    bar_type=bar_type,
                    risk_per_trade=config.MAX_RISK_PER_TRADE
                )
                
                self.strategies[symbol] = strategy
                print(f"  📊 Strategy initialized for {symbol}")
                
            except Exception as e:
                print(f"  ❌ Failed to initialize strategy for {symbol}: {e}")
    
    async def start_trading(self):
        """Start live trading"""
        if not self.strategies:
            print("❌ No strategies initialized")
            return
        
        self.running = True
        print("\n📈 Starting live trading...")
        
        # Start data feeds for all symbols
        tasks = []
        for symbol in config.SYMBOLS:
            tasks.append(
                self.data_client.subscribe_bars(
                    symbol,
                    config.DEFAULT_TIMEFRAME,
                    self.on_new_bar
                )
            )
        
        # Run all data feeds concurrently
        await asyncio.gather(*tasks)
        
        # Keep running until stopped
        while self.running:
            await self.monitor_positions()
            await asyncio.sleep(10)
    
    async def on_new_bar(self, bar_data: Dict):
        """
        Handle new bar data
        
        Args:
            bar_data: Dictionary with bar information
        """
        symbol = bar_data['symbol']
        
        # Log bar data
        print(f"📊 {symbol} - New {bar_data['timeframe']} bar: "
              f"O:{bar_data['open']:.5f} H:{bar_data['high']:.5f} "
              f"L:{bar_data['low']:.5f} C:{bar_data['close']:.5f}")
        
        # Send to strategy if exists
        if symbol in self.strategies:
            strategy = self.strategies[symbol]
            # strategy.on_bar(bar_data)  # Would need conversion to Nautilus Bar object
    
    async def monitor_positions(self):
        """Monitor and display current positions"""
        try:
            # Get account info
            account_info = await self.data_client.get_account_info()
            if account_info:
                print(f"\n💰 Account Status:")
                print(f"   Balance: ${account_info['balance']:.2f}")
                print(f"   Equity: ${account_info['equity']:.2f}")
                print(f"   Margin: ${account_info['margin']:.2f}")
                print(f"   Free Margin: ${account_info['free_margin']:.2f}")
                if account_info['margin_level']:
                    print(f"   Margin Level: {account_info['margin_level']:.2f}%")
            
            # Get open positions
            positions = await self.data_client.get_positions()
            if positions:
                print(f"\n📋 Open Positions ({len(positions)}):")
                for pos in positions:
                    print(f"   {pos['symbol']} {pos['type']}: "
                          f"Volume={pos['volume']}, "
                          f"Price={pos['price_open']:.5f}, "
                          f"Current={pos['price_current']:.5f}, "
                          f"P&L=${pos['profit']:.2f}")
            
        except Exception as e:
            print(f"❌ Error monitoring positions: {e}")
    
    async def backtest_strategy(self, symbol: str, start_date: str, end_date: str):
        """
        Run backtest for a specific symbol
        
        Args:
            symbol: Trading symbol
            start_date: Backtest start date
            end_date: Backtest end date
        """
        print(f"\n🔬 Running backtest for {symbol}...")
        print(f"   Period: {start_date} to {end_date}")
        
        # Get historical data
        historical_data = await self.data_client.get_historical_bars(
            symbol,
            config.DEFAULT_TIMEFRAME,
            config.HISTORICAL_BARS
        )
        
        if historical_data.empty:
            print(f"❌ No historical data available for {symbol}")
            return
        
        print(f"   Loaded {len(historical_data)} bars")
        
        # Calculate indicators on historical data
        await self.calculate_indicators(symbol, historical_data)
        
        # Run strategy logic on historical data
        # This would involve creating a BacktestNode and running the strategy
        # For now, we'll just analyze the data
        
        print(f"✅ Backtest completed for {symbol}")
    
    async def calculate_indicators(self, symbol: str, data: pd.DataFrame):
        """
        Calculate technical indicators on data
        
        Args:
            symbol: Trading symbol
            data: DataFrame with OHLCV data
        """
        try:
            # Calculate SMA
            data['sma_20'] = data['close'].rolling(window=20).mean()
            
            # Calculate EMA
            data['ema_12'] = data['close'].ewm(span=12, adjust=False).mean()
            data['ema_26'] = data['close'].ewm(span=26, adjust=False).mean()
            
            # Calculate RSI
            delta = data['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            data['rsi_14'] = 100 - (100 / (1 + rs))
            
            # Calculate ATR
            high_low = data['high'] - data['low']
            high_close = np.abs(data['high'] - data['close'].shift())
            low_close = np.abs(data['low'] - data['close'].shift())
            ranges = pd.concat([high_low, high_close, low_close], axis=1)
            true_range = np.max(ranges, axis=1)
            data['atr_14'] = true_range.rolling(window=14).mean()
            
            print(f"   ✅ Indicators calculated for {symbol}")
            
            # Display latest values
            latest = data.iloc[-1]
            print(f"   Latest indicators:")
            print(f"     SMA(20): {latest['sma_20']:.5f}")
            print(f"     EMA(12): {latest['ema_12']:.5f}")
            print(f"     EMA(26): {latest['ema_26']:.5f}")
            print(f"     RSI(14): {latest['rsi_14']:.2f}")
            print(f"     ATR(14): {latest['atr_14']:.5f}")
            
        except Exception as e:
            print(f"❌ Error calculating indicators: {e}")
    
    async def stop(self):
        """Stop the trading system"""
        print("\n⏹️ Stopping Nautilus Trader...")
        
        self.running = False
        
        # Unsubscribe from all symbols
        for symbol in config.SYMBOLS:
            await self.data_client.unsubscribe(symbol)
        
        # Disconnect from MT5
        await self.data_client.disconnect()
        
        print("✅ Nautilus Trader stopped")
    
    async def run(self):
        """Main run loop"""
        try:
            # Initialize
            if not await self.initialize():
                return
            
            # Run backtests if configured
            if False:  # Set to True to run backtests
                for symbol in config.SYMBOLS[:3]:  # Test first 3 symbols
                    await self.backtest_strategy(
                        symbol,
                        config.BACKTEST_START_DATE,
                        config.BACKTEST_END_DATE
                    )
            
            # Start live trading
            await self.start_trading()
            
        except KeyboardInterrupt:
            print("\n⚠️ Interrupted by user")
        except Exception as e:
            print(f"\n❌ Error: {e}")
        finally:
            await self.stop()


async def main():
    """Main entry point"""
    app = NautilusTraderApp()
    await app.run()


if __name__ == "__main__":
    # Run the application
    asyncio.run(main())