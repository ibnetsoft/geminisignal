/**
 * Signal Model - External trading signal data structure
 */

export interface Signal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity?: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  processed?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface SignalValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedSignal?: Signal;
}

export class SignalValidator {
  static validate(data: any): SignalValidationResult {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.symbol || typeof data.symbol !== 'string') {
      errors.push('Symbol is required and must be a string');
    }
    
    if (!data.action || !['BUY', 'SELL'].includes(data.action)) {
      errors.push('Action must be either BUY or SELL');
    }
    
    if (!data.source || typeof data.source !== 'string') {
      errors.push('Source is required and must be a string');
    }
    
    // Optional fields validation
    if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity <= 0)) {
      errors.push('Quantity must be a positive number');
    }
    
    if (data.price !== undefined && (typeof data.price !== 'number' || data.price <= 0)) {
      errors.push('Price must be a positive number');
    }
    
    if (data.confidence !== undefined && (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1)) {
      errors.push('Confidence must be a number between 0 and 1');
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    
    // Normalize signal data
    const normalizedSignal: Signal = {
      id: data.id || `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: data.symbol.toUpperCase(),
      action: data.action,
      quantity: data.quantity,
      price: data.price,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit,
      confidence: data.confidence || 0.5,
      source: data.source,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: data.metadata || {},
      processed: false,
      processingStatus: 'pending'
    };
    
    return { isValid: true, errors: [], normalizedSignal };
  }
}