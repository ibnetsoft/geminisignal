-- 사용자 전략 학습 시스템 Supabase 테이블 구조
-- ChatGPT 기반 거래 전략 저장 및 관리

-- 1. 사용자 거래 전략 테이블 (메인)
CREATE TABLE IF NOT EXISTS user_trading_strategies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    strategy_name TEXT NOT NULL,
    strategy_number INTEGER CHECK (strategy_number >= 1 AND strategy_number <= 10),
    
    -- 전략 설명
    description TEXT NOT NULL,
    original_conversation TEXT, -- 사용자가 ChatGPT에게 한 원본 설명
    
    -- 기술적 지표 설정
    technical_indicators JSONB DEFAULT '{}', -- RSI, MACD, SMA, EMA 등
    entry_conditions JSONB DEFAULT '{}',     -- 진입 조건
    exit_conditions JSONB DEFAULT '{}',      -- 청산 조건
    
    -- 리스크 관리 설정
    risk_management JSONB DEFAULT '{}',      -- 손절, 익절, 포지션 크기
    timeframes TEXT[] DEFAULT '{}',          -- 사용 시간대
    symbols TEXT[] DEFAULT '{}',             -- 적용 가능 종목
    
    -- 전략 상태
    is_active BOOLEAN DEFAULT false,         -- 현재 활성화 여부
    is_running BOOLEAN DEFAULT false,        -- 실행 중 여부
    
    -- 성과 데이터
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_profit DECIMAL(12,4) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- 제약조건: 사용자당 전략 번호는 유일
    CONSTRAINT unique_user_strategy_number UNIQUE(user_id, strategy_number),
    CONSTRAINT unique_user_strategy_name UNIQUE(user_id, strategy_name)
);

-- 2. 전략 실행 세션 테이블
CREATE TABLE IF NOT EXISTS strategy_execution_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    strategy_id UUID NOT NULL REFERENCES user_trading_strategies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- 세션 정보
    session_name TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- 실행 파라미터
    execution_mode TEXT DEFAULT 'live' CHECK (execution_mode IN ('live', 'paper', 'backtest')),
    initial_balance DECIMAL(12,2),
    symbols_traded TEXT[] DEFAULT '{}',
    timeframe TEXT DEFAULT '15m',
    
    -- 성과 요약
    total_trades INTEGER DEFAULT 0,
    profitable_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(12,4) DEFAULT 0,
    max_consecutive_wins INTEGER DEFAULT 0,
    max_consecutive_losses INTEGER DEFAULT 0,
    largest_win DECIMAL(12,4) DEFAULT 0,
    largest_loss DECIMAL(12,4) DEFAULT 0,
    
    -- 상태
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'completed', 'error')),
    stop_reason TEXT,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 전략별 거래 기록 테이블
CREATE TABLE IF NOT EXISTS strategy_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    strategy_id UUID NOT NULL REFERENCES user_trading_strategies(id) ON DELETE CASCADE,
    session_id UUID REFERENCES strategy_execution_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- 거래 정보
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
    volume DECIMAL(10,4) NOT NULL,
    entry_price DECIMAL(15,8),
    exit_price DECIMAL(15,8),
    
    -- 전략 신호 정보
    signal_strength DECIMAL(5,2), -- 0-100 신호 강도
    entry_reason TEXT,             -- 진입 이유
    exit_reason TEXT,              -- 청산 이유
    
    -- 기술적 지표 값 (진입 시점)
    rsi_value DECIMAL(5,2),
    macd_value DECIMAL(10,6),
    macd_signal DECIMAL(10,6),
    macd_histogram DECIMAL(10,6),
    sma_20 DECIMAL(15,8),
    sma_50 DECIMAL(15,8),
    ema_12 DECIMAL(15,8),
    ema_26 DECIMAL(15,8),
    
    -- 손익 정보
    realized_pnl DECIMAL(12,4),
    unrealized_pnl DECIMAL(12,4),
    commission DECIMAL(8,4) DEFAULT 0,
    swap DECIMAL(8,4) DEFAULT 0,
    
    -- 시간 정보
    entry_time TIMESTAMPTZ DEFAULT NOW(),
    exit_time TIMESTAMPTZ,
    holding_time_minutes INTEGER,
    
    -- 상태
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 전략 신호 분석 로그
CREATE TABLE IF NOT EXISTS strategy_signal_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    strategy_id UUID NOT NULL REFERENCES user_trading_strategies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- 신호 정보
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'CLOSE', 'HOLD')),
    signal_strength DECIMAL(5,2), -- 0-100
    
    -- 기술적 분석 데이터
    market_data JSONB DEFAULT '{}',       -- OHLCV 데이터
    indicator_values JSONB DEFAULT '{}',  -- 모든 지표 값
    pattern_detected TEXT,                -- 감지된 패턴
    
    -- 결정 과정
    decision_factors TEXT[],              -- 결정에 영향을 준 요소들
    confidence_score DECIMAL(5,2),       -- 신뢰도 점수
    risk_assessment JSONB DEFAULT '{}',   -- 리스크 평가
    
    -- 실행 여부
    action_taken BOOLEAN DEFAULT false,
    action_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 전략 백테스팅 결과
CREATE TABLE IF NOT EXISTS strategy_backtest_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    strategy_id UUID NOT NULL REFERENCES user_trading_strategies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- 백테스팅 설정
    test_period_start DATE NOT NULL,
    test_period_end DATE NOT NULL,
    initial_balance DECIMAL(12,2) NOT NULL,
    symbols_tested TEXT[] NOT NULL,
    timeframe TEXT NOT NULL,
    
    -- 결과 요약
    total_trades INTEGER NOT NULL,
    winning_trades INTEGER NOT NULL,
    losing_trades INTEGER NOT NULL,
    win_rate DECIMAL(5,2) NOT NULL,
    
    -- 수익성 지표
    total_return DECIMAL(12,4) NOT NULL,
    annual_return DECIMAL(8,4),
    max_drawdown DECIMAL(5,2),
    profit_factor DECIMAL(8,4),
    sharpe_ratio DECIMAL(6,4),
    sortino_ratio DECIMAL(6,4),
    
    -- 거래 통계
    avg_win DECIMAL(12,4),
    avg_loss DECIMAL(12,4),
    largest_win DECIMAL(12,4),
    largest_loss DECIMAL(12,4),
    avg_trade_duration_hours DECIMAL(8,2),
    
    -- 상세 결과 (JSON)
    detailed_results JSONB DEFAULT '{}',
    equity_curve JSONB DEFAULT '{}',      -- 자산 곡선 데이터
    monthly_returns JSONB DEFAULT '{}',   -- 월별 수익률
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 전략 학습 세션 로그
CREATE TABLE IF NOT EXISTS strategy_learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    strategy_id UUID REFERENCES user_trading_strategies(id) ON DELETE SET NULL,
    
    -- 학습 세션 정보
    session_type TEXT DEFAULT 'create' CHECK (session_type IN ('create', 'modify', 'analyze', 'optimize')),
    conversation_id TEXT, -- ChatGPT 대화 세션 ID
    
    -- 사용자 입력
    user_input TEXT NOT NULL,             -- 사용자가 입력한 전략 설명
    parsed_strategy JSONB DEFAULT '{}',   -- 파싱된 전략 구조
    
    -- AI 분석 결과
    ai_interpretation TEXT,               -- AI의 전략 해석
    suggested_parameters JSONB DEFAULT '{}', -- 제안된 파라미터
    risk_warnings TEXT[],                 -- 리스크 경고사항
    optimization_suggestions TEXT[],      -- 최적화 제안
    
    -- 검증 결과
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'needs_clarification')),
    validation_errors TEXT[],
    
    -- 결과
    strategy_created BOOLEAN DEFAULT false,
    strategy_updated BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === 인덱스 생성 ===

-- 사용자 전략 인덱스
CREATE INDEX IF NOT EXISTS idx_user_strategies_user_id ON user_trading_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_strategies_active ON user_trading_strategies(is_active);
CREATE INDEX IF NOT EXISTS idx_user_strategies_running ON user_trading_strategies(is_running);

-- 실행 세션 인덱스
CREATE INDEX IF NOT EXISTS idx_execution_sessions_strategy_id ON strategy_execution_sessions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_execution_sessions_user_id ON strategy_execution_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_sessions_status ON strategy_execution_sessions(status);

-- 거래 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_strategy_trades_strategy_id ON strategy_trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_trades_session_id ON strategy_trades(session_id);
CREATE INDEX IF NOT EXISTS idx_strategy_trades_symbol ON strategy_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_strategy_trades_entry_time ON strategy_trades(entry_time);

-- 신호 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_signal_logs_strategy_id ON strategy_signal_logs(strategy_id);
CREATE INDEX IF NOT EXISTS idx_signal_logs_symbol ON strategy_signal_logs(symbol);
CREATE INDEX IF NOT EXISTS idx_signal_logs_created_at ON strategy_signal_logs(created_at);

-- === Row Level Security 활성화 ===
ALTER TABLE user_trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_execution_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_signal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_backtest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_learning_sessions ENABLE ROW LEVEL SECURITY;

-- === 트리거 생성 ===

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_strategies_updated_at 
    BEFORE UPDATE ON user_trading_strategies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_execution_sessions_updated_at 
    BEFORE UPDATE ON strategy_execution_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_trades_updated_at 
    BEFORE UPDATE ON strategy_trades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- === 초기 데이터 예시 ===

-- 전략 템플릿 예시 (시스템용)
INSERT INTO user_trading_strategies (
    user_id, strategy_name, strategy_number, description, 
    technical_indicators, entry_conditions, exit_conditions, risk_management
) VALUES (
    'system_template', 
    'RSI 과매도/과매수 전략', 
    1,
    'RSI 지표를 이용한 단순 반전 전략. RSI가 30 이하일 때 매수, 70 이상일 때 매도',
    '{"rsi": {"period": 14, "overbought": 70, "oversold": 30}}',
    '{"rsi_below": 30, "trend_confirmation": false}',
    '{"rsi_above": 70, "stop_loss_pct": 2, "take_profit_pct": 4}',
    '{"max_risk_per_trade": 2, "position_size_method": "kelly", "max_positions": 3}'
) ON CONFLICT DO NOTHING;

INSERT INTO user_trading_strategies (
    user_id, strategy_name, strategy_number, description,
    technical_indicators, entry_conditions, exit_conditions, risk_management
) VALUES (
    'system_template',
    'MACD 크로스오버 전략',
    2,
    'MACD 선이 시그널 선을 상향 돌파시 매수, 하향 돌파시 매도하는 전략',
    '{"macd": {"fast": 12, "slow": 26, "signal": 9}}',
    '{"macd_crossover": "bullish", "volume_confirmation": true}',
    '{"macd_crossover": "bearish", "stop_loss_pct": 1.5, "take_profit_pct": 3}',
    '{"max_risk_per_trade": 1.5, "position_size_method": "fixed", "max_positions": 5}'
) ON CONFLICT DO NOTHING;

-- 완료 메시지
SELECT '사용자 전략 학습 시스템 테이블 생성 완료! 📈' as result;