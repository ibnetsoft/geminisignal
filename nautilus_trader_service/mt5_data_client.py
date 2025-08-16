"""
MetaTrader 5 Data Client for Nautilus Trader
Handles real-time and historical data from MT5
"""

import MetaTrader5 as mt5
import pandas as pd
import numpy as np
from datetime import datetime, timezone
import asyncio
from typing import List, Dict, Optional
import pytz

from nautilus_trader.core.datetime import dt_to_unix_nanos
from nautilus_trader.model.data import Bar, BarType, BarSpecification, BarAggregation
from nautilus_trader.model.identifiers import InstrumentId, Symbol, Venue
from nautilus_trader.model.objects import Price, Quantity
from nautilus_trader.live.data_client import LiveMarketDataClient

from config import config


class MT5DataClient(LiveMarketDataClient):
    """
    MetaTrader 5 Data Client for Nautilus Trader
    """
    
    def __init__(self):
        super().__init__()
        self.mt5_initialized = False
        self.subscribed_symbols = set()
        self.symbol_info_cache = {}
        
    async def connect(self):
        """Connect to MetaTrader 5"""
        try:
            # Initialize MT5
            if not mt5.initialize(
                login=config.MT5_LOGIN,
                password=config.MT5_PASSWORD,
                server=config.MT5_SERVER,
                path=config.MT5_PATH if config.MT5_PATH else None
            ):
                error = mt5.last_error()
                raise ConnectionError(f"MT5 initialization failed: {error}")
            
            self.mt5_initialized = True
            
            # Get account info
            account_info = mt5.account_info()
            if account_info:
                print(f"✅ Connected to MT5")
                print(f"   Account: {account_info.login}")
                print(f"   Server: {account_info.server}")
                print(f"   Balance: {account_info.balance}")
                print(f"   Leverage: {account_info.leverage}")
            
            # Cache symbol information
            await self._cache_symbols()
            
            return True
            
        except Exception as e:
            print(f"❌ MT5 connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from MetaTrader 5"""
        if self.mt5_initialized:
            mt5.shutdown()
            self.mt5_initialized = False
            print("✅ Disconnected from MT5")
    
    async def _cache_symbols(self):
        """Cache symbol information from MT5"""
        symbols = mt5.symbols_get()
        if symbols:
            for symbol in symbols:
                self.symbol_info_cache[symbol.name] = {
                    'point': symbol.point,
                    'digits': symbol.digits,
                    'contract_size': symbol.trade_contract_size,
                    'tick_size': symbol.trade_tick_size,
                    'tick_value': symbol.trade_tick_value,
                    'min_lot': symbol.volume_min,
                    'max_lot': symbol.volume_max,
                    'lot_step': symbol.volume_step,
                    'spread': symbol.spread
                }
            print(f"📊 Cached {len(self.symbol_info_cache)} symbols")
    
    async def get_historical_bars(
        self,
        symbol: str,
        timeframe: str = 'M15',
        count: int = 1000
    ) -> pd.DataFrame:
        """
        Get historical bars from MT5
        
        Args:
            symbol: Trading symbol
            timeframe: Timeframe (M1, M5, M15, M30, H1, H4, D1)
            count: Number of bars to retrieve
        
        Returns:
            DataFrame with OHLCV data
        """
        if not self.mt5_initialized:
            raise RuntimeError("MT5 not connected")
        
        # Convert timeframe string to MT5 constant
        timeframe_map = {
            'M1': mt5.TIMEFRAME_M1,
            'M5': mt5.TIMEFRAME_M5,
            'M15': mt5.TIMEFRAME_M15,
            'M30': mt5.TIMEFRAME_M30,
            'H1': mt5.TIMEFRAME_H1,
            'H4': mt5.TIMEFRAME_H4,
            'D1': mt5.TIMEFRAME_D1,
            'W1': mt5.TIMEFRAME_W1,
            'MN1': mt5.TIMEFRAME_MN1
        }
        
        mt5_timeframe = timeframe_map.get(timeframe, mt5.TIMEFRAME_M15)
        
        # Get bars from MT5
        rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, count)
        
        if rates is None or len(rates) == 0:
            print(f"⚠️ No data received for {symbol}")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        df.set_index('time', inplace=True)
        
        # Add technical indicators columns placeholder
        df['sma_20'] = None
        df['ema_12'] = None
        df['ema_26'] = None
        df['rsi_14'] = None
        df['atr_14'] = None
        
        return df
    
    async def get_current_prices(self, symbols: List[str]) -> Dict[str, Dict]:
        """
        Get current prices for multiple symbols
        
        Args:
            symbols: List of trading symbols
        
        Returns:
            Dictionary with current price data
        """
        if not self.mt5_initialized:
            raise RuntimeError("MT5 not connected")
        
        prices = {}
        
        for symbol in symbols:
            tick = mt5.symbol_info_tick(symbol)
            if tick:
                prices[symbol] = {
                    'bid': tick.bid,
                    'ask': tick.ask,
                    'last': tick.last,
                    'volume': tick.volume,
                    'time': datetime.fromtimestamp(tick.time, tz=pytz.UTC),
                    'spread': tick.ask - tick.bid
                }
            else:
                print(f"⚠️ No tick data for {symbol}")
        
        return prices
    
    async def subscribe_bars(
        self,
        symbol: str,
        timeframe: str = 'M15',
        callback=None
    ):
        """
        Subscribe to real-time bar updates
        
        Args:
            symbol: Trading symbol
            timeframe: Timeframe for bars
            callback: Callback function for new bars
        """
        if not self.mt5_initialized:
            raise RuntimeError("MT5 not connected")
        
        self.subscribed_symbols.add(symbol)
        
        # Start real-time monitoring
        asyncio.create_task(
            self._monitor_bars(symbol, timeframe, callback)
        )
        
        print(f"✅ Subscribed to {symbol} {timeframe} bars")
    
    async def _monitor_bars(
        self,
        symbol: str,
        timeframe: str,
        callback
    ):
        """
        Monitor and emit new bars
        
        Args:
            symbol: Trading symbol
            timeframe: Timeframe for bars
            callback: Callback function for new bars
        """
        last_bar_time = None
        timeframe_seconds = self._get_timeframe_seconds(timeframe)
        
        while symbol in self.subscribed_symbols:
            try:
                # Get latest bar
                bars = await self.get_historical_bars(symbol, timeframe, 2)
                
                if not bars.empty:
                    current_bar = bars.iloc[-1]
                    current_time = bars.index[-1]
                    
                    # Check if new bar
                    if last_bar_time is None or current_time > last_bar_time:
                        last_bar_time = current_time
                        
                        # Create bar data
                        bar_data = {
                            'symbol': symbol,
                            'timeframe': timeframe,
                            'time': current_time,
                            'open': current_bar['open'],
                            'high': current_bar['high'],
                            'low': current_bar['low'],
                            'close': current_bar['close'],
                            'volume': current_bar['tick_volume']
                        }
                        
                        # Call callback if provided
                        if callback:
                            await callback(bar_data)
                
                # Wait for next check
                await asyncio.sleep(timeframe_seconds / 2)
                
            except Exception as e:
                print(f"❌ Error monitoring {symbol}: {e}")
                await asyncio.sleep(5)
    
    async def subscribe_ticks(
        self,
        symbol: str,
        callback=None
    ):
        """
        Subscribe to real-time tick updates
        
        Args:
            symbol: Trading symbol
            callback: Callback function for new ticks
        """
        if not self.mt5_initialized:
            raise RuntimeError("MT5 not connected")
        
        self.subscribed_symbols.add(symbol)
        
        # Start real-time monitoring
        asyncio.create_task(
            self._monitor_ticks(symbol, callback)
        )
        
        print(f"✅ Subscribed to {symbol} ticks")
    
    async def _monitor_ticks(
        self,
        symbol: str,
        callback
    ):
        """
        Monitor and emit new ticks
        
        Args:
            symbol: Trading symbol
            callback: Callback function for new ticks
        """
        last_tick_time = None
        
        while symbol in self.subscribed_symbols:
            try:
                # Get latest tick
                tick = mt5.symbol_info_tick(symbol)
                
                if tick and (last_tick_time is None or tick.time > last_tick_time):
                    last_tick_time = tick.time
                    
                    # Create tick data
                    tick_data = {
                        'symbol': symbol,
                        'time': datetime.fromtimestamp(tick.time, tz=pytz.UTC),
                        'bid': tick.bid,
                        'ask': tick.ask,
                        'last': tick.last,
                        'volume': tick.volume
                    }
                    
                    # Call callback if provided
                    if callback:
                        await callback(tick_data)
                
                # Small delay to prevent overwhelming
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Error monitoring ticks for {symbol}: {e}")
                await asyncio.sleep(1)
    
    async def unsubscribe(self, symbol: str):
        """
        Unsubscribe from symbol updates
        
        Args:
            symbol: Trading symbol
        """
        if symbol in self.subscribed_symbols:
            self.subscribed_symbols.remove(symbol)
            print(f"✅ Unsubscribed from {symbol}")
    
    def _get_timeframe_seconds(self, timeframe: str) -> int:
        """
        Get timeframe duration in seconds
        
        Args:
            timeframe: Timeframe string
        
        Returns:
            Duration in seconds
        """
        timeframe_map = {
            'M1': 60,
            'M5': 300,
            'M15': 900,
            'M30': 1800,
            'H1': 3600,
            'H4': 14400,
            'D1': 86400,
            'W1': 604800,
            'MN1': 2592000
        }
        return timeframe_map.get(timeframe, 900)
    
    async def get_account_info(self) -> Dict:
        """
        Get current account information
        
        Returns:
            Dictionary with account details
        """
        if not self.mt5_initialized:
            raise RuntimeError("MT5 not connected")
        
        account = mt5.account_info()
        if account:
            return {
                'login': account.login,
                'server': account.server,
                'balance': account.balance,
                'equity': account.equity,
                'margin': account.margin,
                'free_margin': account.margin_free,
                'margin_level': account.margin_level,
                'profit': account.profit,
                'leverage': account.leverage,
                'currency': account.currency
            }
        return {}
    
    async def get_positions(self) -> List[Dict]:
        """
        Get current open positions
        
        Returns:
            List of position dictionaries
        """
        if not self.mt5_initialized:
            raise RuntimeError("MT5 not connected")
        
        positions = mt5.positions_get()
        if positions:
            return [
                {
                    'ticket': pos.ticket,
                    'symbol': pos.symbol,
                    'type': 'BUY' if pos.type == mt5.ORDER_TYPE_BUY else 'SELL',
                    'volume': pos.volume,
                    'price_open': pos.price_open,
                    'price_current': pos.price_current,
                    'sl': pos.sl,
                    'tp': pos.tp,
                    'profit': pos.profit,
                    'swap': pos.swap,
                    'commission': pos.commission,
                    'comment': pos.comment,
                    'time': datetime.fromtimestamp(pos.time, tz=pytz.UTC)
                }
                for pos in positions
            ]
        return []


# Singleton instance
mt5_data_client = MT5DataClient()