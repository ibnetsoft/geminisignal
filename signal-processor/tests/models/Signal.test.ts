/**
 * Signal Model Tests
 */

import { SignalValidator } from '../../src/models/Signal';

describe('SignalValidator', () => {
  describe('validate', () => {
    it('should validate a correct signal', () => {
      const signalData = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        source: 'test-source',
        quantity: 1.5,
        price: 50000,
        confidence: 0.8
      };

      const result = SignalValidator.validate(signalData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedSignal).toBeDefined();
      expect(result.normalizedSignal?.symbol).toBe('BTCUSDT');
      expect(result.normalizedSignal?.action).toBe('BUY');
      expect(result.normalizedSignal?.processingStatus).toBe('pending');
    });

    it('should reject signal with missing required fields', () => {
      const signalData = {
        action: 'BUY'
        // Missing symbol and source
      };

      const result = SignalValidator.validate(signalData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Symbol is required and must be a string');
      expect(result.errors).toContain('Source is required and must be a string');
    });

    it('should reject signal with invalid action', () => {
      const signalData = {
        symbol: 'BTCUSDT',
        action: 'INVALID',
        source: 'test-source'
      };

      const result = SignalValidator.validate(signalData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action must be either BUY or SELL');
    });

    it('should normalize symbol to uppercase', () => {
      const signalData = {
        symbol: 'btcusdt',
        action: 'BUY',
        source: 'test-source'
      };

      const result = SignalValidator.validate(signalData);

      expect(result.isValid).toBe(true);
      expect(result.normalizedSignal?.symbol).toBe('BTCUSDT');
    });

    it('should generate ID if not provided', () => {
      const signalData = {
        symbol: 'BTCUSDT',
        action: 'BUY',
        source: 'test-source'
      };

      const result = SignalValidator.validate(signalData);

      expect(result.isValid).toBe(true);
      expect(result.normalizedSignal?.id).toBeDefined();
      expect(result.normalizedSignal?.id).toMatch(/^signal_\d+_[a-z0-9]+$/);
    });
  });
});