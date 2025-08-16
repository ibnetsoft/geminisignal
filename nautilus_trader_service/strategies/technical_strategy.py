"""
Technical Analysis Strategy for Nautilus Trader
Uses multiple technical indicators for trading decisions
"""

import numpy as np
import pandas as pd
from typing import Optional, Dict
from datetime import datetime

from nautilus_trader.trading.strategy import Strategy
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.instruments import Instrument
from nautilus_trader.model.data import Bar, BarType
from nautilus_trader.model.orders import MarketOrder
from nautilus_trader.model.position import Position
from nautilus_trader.indicators.average.ema import ExponentialMovingAverage
from nautilus_trader.indicators.rsi import RelativeStrengthIndex
from nautilus_trader.indicators.atr import AverageTrueRange
from nautilus_trader.indicators.macd import MACD
from nautilus_trader.indicators.bollinger_bands import BollingerBands


class TechnicalStrategy(Strategy):
    """
    Multi-indicator technical analysis strategy
    
    Combines:
    - EMA crossover
    - RSI oversold/overbought
    - MACD signals
    - Bollinger Bands
    - ATR for position sizing
    """
    
    def __init__(
        self,
        instrument_id: InstrumentId,
        bar_type: BarType,
        risk_per_trade: float = 0.02,
        fast_ema: int = 12,
        slow_ema: int = 26,
        rsi_period: int = 14,
        atr_period: int = 14,
        bb_period: int = 20,
        bb_std: float = 2.0
    ):
        super().__init__()
        
        # Configuration
        self.instrument_id = instrument_id
        self.bar_type = bar_type
        self.risk_per_trade = risk_per_trade
        
        # Indicator parameters
        self.fast_ema_period = fast_ema
        self.slow_ema_period = slow_ema
        self.rsi_period = rsi_period
        self.atr_period = atr_period
        self.bb_period = bb_period
        self.bb_std = bb_std
        
        # Indicators (will be initialized in on_start)
        self.fast_ema = None
        self.slow_ema = None
        self.rsi = None
        self.atr = None
        self.macd = None
        self.bb = None
        
        # Trading state
        self.in_position = False
        self.position_side = None
        self.entry_price = None
        self.position_size = None
        
        # Signal tracking
        self.signals = {
            'ema_cross': 0,
            'rsi': 0,
            'macd': 0,
            'bb': 0
        }
        
    def on_start(self):
        """Called when the strategy starts"""
        self.log.info(f"Starting TechnicalStrategy for {self.instrument_id}")
        
        # Initialize indicators
        self.fast_ema = ExponentialMovingAverage(self.fast_ema_period)
        self.slow_ema = ExponentialMovingAverage(self.slow_ema_period)
        self.rsi = RelativeStrengthIndex(self.rsi_period)
        self.atr = AverageTrueRange(self.atr_period)
        
        # Initialize MACD
        self.macd = MACD(
            fast_period=self.fast_ema_period,
            slow_period=self.slow_ema_period,
            signal_period=9
        )
        
        # Initialize Bollinger Bands
        self.bb = BollingerBands(
            period=self.bb_period,
            k=self.bb_std
        )
        
        # Subscribe to market data
        self.subscribe_bars(self.bar_type)
        
        # Request historical bars for indicator warmup
        self.request_bars(self.bar_type, 200)
        
    def on_bar(self, bar: Bar):
        """
        Called when a new bar is received
        
        Args:
            bar: The new bar data
        """
        # Update indicators
        self.update_indicators(bar)
        
        # Check if indicators are ready
        if not self.indicators_ready():
            return
        
        # Generate trading signals
        self.generate_signals(bar)
        
        # Calculate overall signal strength
        signal_strength = self.calculate_signal_strength()
        
        # Trading logic
        if not self.in_position:
            # Check for entry signals
            if signal_strength >= 3:  # Strong buy signal
                self.enter_long(bar)
            elif signal_strength <= -3:  # Strong sell signal
                self.enter_short(bar)
        else:
            # Check for exit signals
            self.check_exit_conditions(bar)
    
    def update_indicators(self, bar: Bar):
        """
        Update all technical indicators
        
        Args:
            bar: The new bar data
        """
        # Update EMAs
        self.fast_ema.update(bar.close)
        self.slow_ema.update(bar.close)
        
        # Update RSI
        self.rsi.update(bar.close)
        
        # Update ATR
        self.atr.update(bar)
        
        # Update MACD
        self.macd.update(bar.close)
        
        # Update Bollinger Bands
        self.bb.update(bar.close)
    
    def indicators_ready(self) -> bool:
        """
        Check if all indicators have enough data
        
        Returns:
            True if indicators are ready, False otherwise
        """
        return (
            self.fast_ema.initialized and
            self.slow_ema.initialized and
            self.rsi.initialized and
            self.atr.initialized and
            self.macd.initialized and
            self.bb.initialized
        )
    
    def generate_signals(self, bar: Bar):
        """
        Generate trading signals from indicators
        
        Args:
            bar: The current bar data
        """
        # EMA Crossover Signal
        if self.fast_ema.value > self.slow_ema.value:
            self.signals['ema_cross'] = 1  # Bullish
        elif self.fast_ema.value < self.slow_ema.value:
            self.signals['ema_cross'] = -1  # Bearish
        else:
            self.signals['ema_cross'] = 0  # Neutral
        
        # RSI Signal
        rsi_value = self.rsi.value
        if rsi_value < 30:
            self.signals['rsi'] = 1  # Oversold - Buy signal
        elif rsi_value > 70:
            self.signals['rsi'] = -1  # Overbought - Sell signal
        else:
            self.signals['rsi'] = 0  # Neutral
        
        # MACD Signal
        macd_line = self.macd.line
        signal_line = self.macd.signal
        if macd_line > signal_line:
            self.signals['macd'] = 1  # Bullish
        elif macd_line < signal_line:
            self.signals['macd'] = -1  # Bearish
        else:
            self.signals['macd'] = 0  # Neutral
        
        # Bollinger Bands Signal
        upper_band = self.bb.upper
        lower_band = self.bb.lower
        middle_band = self.bb.middle
        
        if bar.close <= lower_band:
            self.signals['bb'] = 1  # Price at lower band - Buy signal
        elif bar.close >= upper_band:
            self.signals['bb'] = -1  # Price at upper band - Sell signal
        else:
            self.signals['bb'] = 0  # Neutral
    
    def calculate_signal_strength(self) -> int:
        """
        Calculate overall signal strength
        
        Returns:
            Signal strength (-4 to +4)
        """
        return sum(self.signals.values())
    
    def calculate_position_size(self, bar: Bar) -> float:
        """
        Calculate position size based on ATR and risk
        
        Args:
            bar: The current bar data
        
        Returns:
            Position size in lots
        """
        account_balance = self.portfolio.account.balance
        risk_amount = account_balance * self.risk_per_trade
        
        # Use ATR for stop loss distance
        atr_value = self.atr.value
        stop_distance = atr_value * 2  # 2x ATR stop loss
        
        # Calculate position size
        # Risk = Position Size * Stop Distance * Tick Value
        tick_value = 10  # This should be retrieved from instrument specs
        position_size = risk_amount / (stop_distance * tick_value)
        
        # Round to lot step
        lot_step = 0.01
        position_size = round(position_size / lot_step) * lot_step
        
        # Apply limits
        min_lot = 0.01
        max_lot = 1.0
        position_size = max(min_lot, min(max_lot, position_size))
        
        return position_size
    
    def enter_long(self, bar: Bar):
        """
        Enter a long position
        
        Args:
            bar: The current bar data
        """
        if self.in_position:
            return
        
        position_size = self.calculate_position_size(bar)
        
        # Create market order
        order = self.order_factory.market(
            instrument_id=self.instrument_id,
            order_side=OrderSide.BUY,
            quantity=Quantity.from_float(position_size)
        )
        
        # Submit order
        self.submit_order(order)
        
        # Update state
        self.in_position = True
        self.position_side = 'LONG'
        self.entry_price = bar.close
        self.position_size = position_size
        
        # Calculate stop loss and take profit
        atr_value = self.atr.value
        self.stop_loss = bar.close - (atr_value * 2)
        self.take_profit = bar.close + (atr_value * 3)
        
        self.log.info(
            f"LONG Entry: {self.instrument_id} @ {bar.close:.5f}, "
            f"Size: {position_size}, SL: {self.stop_loss:.5f}, "
            f"TP: {self.take_profit:.5f}"
        )
    
    def enter_short(self, bar: Bar):
        """
        Enter a short position
        
        Args:
            bar: The current bar data
        """
        if self.in_position:
            return
        
        position_size = self.calculate_position_size(bar)
        
        # Create market order
        order = self.order_factory.market(
            instrument_id=self.instrument_id,
            order_side=OrderSide.SELL,
            quantity=Quantity.from_float(position_size)
        )
        
        # Submit order
        self.submit_order(order)
        
        # Update state
        self.in_position = True
        self.position_side = 'SHORT'
        self.entry_price = bar.close
        self.position_size = position_size
        
        # Calculate stop loss and take profit
        atr_value = self.atr.value
        self.stop_loss = bar.close + (atr_value * 2)
        self.take_profit = bar.close - (atr_value * 3)
        
        self.log.info(
            f"SHORT Entry: {self.instrument_id} @ {bar.close:.5f}, "
            f"Size: {position_size}, SL: {self.stop_loss:.5f}, "
            f"TP: {self.take_profit:.5f}"
        )
    
    def check_exit_conditions(self, bar: Bar):
        """
        Check if position should be closed
        
        Args:
            bar: The current bar data
        """
        if not self.in_position:
            return
        
        # Check stop loss
        if self.position_side == 'LONG':
            if bar.close <= self.stop_loss:
                self.exit_position(bar, "Stop Loss")
            elif bar.close >= self.take_profit:
                self.exit_position(bar, "Take Profit")
            elif self.signals['ema_cross'] == -1 and self.signals['macd'] == -1:
                self.exit_position(bar, "Reversal Signal")
        
        elif self.position_side == 'SHORT':
            if bar.close >= self.stop_loss:
                self.exit_position(bar, "Stop Loss")
            elif bar.close <= self.take_profit:
                self.exit_position(bar, "Take Profit")
            elif self.signals['ema_cross'] == 1 and self.signals['macd'] == 1:
                self.exit_position(bar, "Reversal Signal")
    
    def exit_position(self, bar: Bar, reason: str):
        """
        Exit current position
        
        Args:
            bar: The current bar data
            reason: Reason for exit
        """
        if not self.in_position:
            return
        
        # Create closing order
        order_side = OrderSide.SELL if self.position_side == 'LONG' else OrderSide.BUY
        
        order = self.order_factory.market(
            instrument_id=self.instrument_id,
            order_side=order_side,
            quantity=Quantity.from_float(self.position_size)
        )
        
        # Submit order
        self.submit_order(order)
        
        # Calculate P&L
        if self.position_side == 'LONG':
            pnl = (bar.close - self.entry_price) * self.position_size
        else:
            pnl = (self.entry_price - bar.close) * self.position_size
        
        # Reset state
        self.in_position = False
        self.position_side = None
        self.entry_price = None
        self.position_size = None
        
        self.log.info(
            f"Position Closed: {reason} @ {bar.close:.5f}, P&L: {pnl:.2f}"
        )
    
    def on_stop(self):
        """Called when the strategy stops"""
        # Close any open positions
        if self.in_position:
            self.log.warning("Strategy stopping with open position")
        
        self.log.info("TechnicalStrategy stopped")
    
    def on_reset(self):
        """Reset strategy state"""
        self.in_position = False
        self.position_side = None
        self.entry_price = None
        self.position_size = None
        self.signals = {
            'ema_cross': 0,
            'rsi': 0,
            'macd': 0,
            'bb': 0
        }