-- ChatGPT 거래 시스템 리스크 관리 Supabase 테이블 구조
-- 이 SQL을 Supabase Dashboard에서 실행하여 테이블을 생성하세요

-- 1. 거래 세션 테이블 (메인 거래 추적)
CREATE TABLE IF NOT EXISTS trading_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
    position_size DECIMAL(10,4) NOT NULL,
    entry_price DECIMAL(15,8),
    exit_price DECIMAL(15,8),
    stop_loss_price DECIMAL(15,8),
    take_profit_price DECIMAL(15,8),
    risk_amount DECIMAL(10,2),
    risk_percent DECIMAL(5,2),
    realized_pnl DECIMAL(10,2),
    unrealized_pnl DECIMAL(10,2),
    pattern_name TEXT,
    ai_confidence DECIMAL(3,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
    close_reason TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    risk_settings JSONB DEFAULT '{}',
    position_sizing_method TEXT DEFAULT 'kelly_criterion',
    max_risk_per_trade DECIMAL(5,2) DEFAULT 2.0,
    account_balance_at_entry DECIMAL(12,2),
    account_balance_at_exit DECIMAL(12,2),
    free_margin_at_entry DECIMAL(12,2),
    actual_risk_taken DECIMAL(10,2),
    
    -- 인덱스 최적화
    CONSTRAINT unique_session_per_user UNIQUE(user_id, session_id)
);

-- 2. 리스크 분석 로그 테이블
CREATE TABLE IF NOT EXISTS risk_analysis_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    analysis_type TEXT DEFAULT 'pre_trade' CHECK (analysis_type IN ('pre_trade', 'real_time', 'post_trade')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_factors TEXT[] DEFAULT '{}',
    analysis_result JSONB DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    market_conditions JSONB DEFAULT '{}',
    account_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 실시간 포지션 리스크 모니터링
CREATE TABLE IF NOT EXISTS position_risk_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES trading_sessions(session_id) ON DELETE CASCADE,
    current_price DECIMAL(15,8),
    unrealized_pnl DECIMAL(10,2),
    unrealized_pnl_percent DECIMAL(5,2),
    distance_to_stop_loss DECIMAL(5,2),
    distance_to_take_profit DECIMAL(5,2),
    current_risk_level TEXT CHECK (current_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    time_held_minutes INTEGER DEFAULT 0,
    market_volatility DECIMAL(5,4) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 세션당 하나의 모니터링 레코드
    CONSTRAINT unique_monitoring_per_session UNIQUE(session_id)
);

-- 4. 일일 리스크 요약
CREATE TABLE IF NOT EXISTS daily_risk_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    summary_date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    active_trades INTEGER DEFAULT 0,
    closed_trades INTEGER DEFAULT 0,
    total_realized_pnl DECIMAL(10,2) DEFAULT 0,
    total_unrealized_pnl DECIMAL(10,2) DEFAULT 0,
    daily_risk_taken DECIMAL(10,2) DEFAULT 0,
    max_single_risk DECIMAL(10,2) DEFAULT 0,
    average_position_size DECIMAL(10,4) DEFAULT 0,
    risk_violations INTEGER DEFAULT 0,
    daily_drawdown_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 사용자당 하루에 하나의 요약
    CONSTRAINT unique_daily_summary UNIQUE(user_id, summary_date)
);

-- 5. 리스크 경고 및 알림
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('DAILY_LOSS', 'DRAWDOWN', 'POSITION_SIZE', 'MARGIN', 'HIGH_RISK_POSITION')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    current_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    auto_action_taken BOOLEAN DEFAULT FALSE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 사용자 거래 패턴 분석
CREATE TABLE IF NOT EXISTS user_trading_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    pattern_name TEXT NOT NULL,
    pattern_logic JSONB DEFAULT '{}',
    success_rate DECIMAL(5,2) DEFAULT 0,
    average_profit DECIMAL(10,2) DEFAULT 0,
    average_loss DECIMAL(10,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 사용자별 패턴명 고유
    CONSTRAINT unique_pattern_per_user UNIQUE(user_id, pattern_name)
);

-- 7. MetaAPI 계정 연동 정보
CREATE TABLE IF NOT EXISTS metaapi_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_login TEXT NOT NULL,
    account_name TEXT,
    broker_name TEXT,
    server_name TEXT,
    account_currency TEXT DEFAULT 'USD',
    leverage INTEGER,
    account_type TEXT CHECK (account_type IN ('demo', 'live')),
    is_active BOOLEAN DEFAULT TRUE,
    last_balance DECIMAL(12,2),
    last_equity DECIMAL(12,2),
    last_free_margin DECIMAL(12,2),
    last_sync_at TIMESTAMPTZ,
    risk_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 사용자당 계정 로그인 고유
    CONSTRAINT unique_account_per_user UNIQUE(user_id, account_login)
);

-- 8. 뉴스 기반 리스크 분석 로그
CREATE TABLE IF NOT EXISTS news_analysis_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    analyzed_symbols TEXT[] NOT NULL,
    news_analysis JSONB DEFAULT '{}',
    position_alerts JSONB DEFAULT '{}',
    overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'neutral', 'negative')),
    impact_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === 인덱스 생성 (성능 최적화) ===

-- 거래 세션 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_status ON trading_sessions(status);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_symbol ON trading_sessions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_started_at ON trading_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_status ON trading_sessions(user_id, status);

-- 리스크 분석 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_risk_analysis_logs_user_id ON risk_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_analysis_logs_session_id ON risk_analysis_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_risk_analysis_logs_risk_level ON risk_analysis_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_analysis_logs_created_at ON risk_analysis_logs(created_at);

-- 포지션 리스크 모니터링 인덱스
CREATE INDEX IF NOT EXISTS idx_position_risk_monitoring_session_id ON position_risk_monitoring(session_id);
CREATE INDEX IF NOT EXISTS idx_position_risk_monitoring_risk_level ON position_risk_monitoring(current_risk_level);

-- 일일 리스크 요약 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_risk_summaries_user_id ON daily_risk_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_risk_summaries_date ON daily_risk_summaries(summary_date);

-- 리스크 경고 인덱스
CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON risk_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_acknowledged ON risk_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_severity ON risk_alerts(severity);

-- === 데이터 보존 정책 (선택사항) ===

-- 30일 이후 일일 요약은 월별로 집계 후 삭제
-- 90일 이후 리스크 분석 로그 압축
-- 1년 이후 종료된 거래 세션 아카이브

-- === Row Level Security (RLS) 활성화 ===

-- 사용자는 자신의 데이터만 접근 가능
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_risk_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_risk_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE metaapi_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_analysis_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 예시 (실제 사용시 auth.uid()로 수정 필요)
-- CREATE POLICY "Users can only see their own trading sessions" ON trading_sessions
--     FOR ALL USING (auth.uid()::text = user_id);

-- === 트리거 생성 (자동 업데이트) ===

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 거래 세션 updated_at 트리거
CREATE TRIGGER update_trading_sessions_updated_at 
    BEFORE UPDATE ON trading_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 사용자 거래 패턴 updated_at 트리거
CREATE TRIGGER update_user_trading_patterns_updated_at 
    BEFORE UPDATE ON user_trading_patterns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- MetaAPI 계정 updated_at 트리거
CREATE TRIGGER update_metaapi_accounts_updated_at 
    BEFORE UPDATE ON metaapi_accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- === 뷰 생성 (편의성) ===

-- 활성 거래 세션 with 리스크 모니터링
CREATE OR REPLACE VIEW active_trading_sessions_with_risk AS
SELECT 
    ts.*,
    prm.current_price,
    prm.unrealized_pnl,
    prm.unrealized_pnl_percent,
    prm.current_risk_level,
    prm.time_held_minutes
FROM trading_sessions ts
LEFT JOIN position_risk_monitoring prm ON ts.session_id = prm.session_id
WHERE ts.status = 'active';

-- 사용자별 리스크 요약 (최근 30일)
CREATE OR REPLACE VIEW user_risk_summary_30d AS
SELECT 
    user_id,
    COUNT(*) as total_trades,
    SUM(CASE WHEN realized_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
    SUM(CASE WHEN realized_pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
    ROUND(AVG(risk_percent), 2) as avg_risk_percent,
    ROUND(SUM(realized_pnl), 2) as total_pnl,
    ROUND(MIN(realized_pnl), 2) as worst_trade,
    ROUND(MAX(realized_pnl), 2) as best_trade
FROM trading_sessions 
WHERE started_at >= NOW() - INTERVAL '30 days'
    AND status = 'closed'
    AND realized_pnl IS NOT NULL
GROUP BY user_id;

-- === 초기 데이터 (선택사항) ===

-- 기본 거래 패턴
INSERT INTO user_trading_patterns (user_id, pattern_name, pattern_logic, success_rate) VALUES 
('system', 'scalping', '{"timeframe": "1m", "target_profit": 0.5, "stop_loss": 0.2}', 65.0),
('system', 'swing_trading', '{"timeframe": "4h", "target_profit": 2.0, "stop_loss": 1.0}', 55.0),
('system', 'day_trading', '{"timeframe": "15m", "target_profit": 1.0, "stop_loss": 0.5}', 60.0)
ON CONFLICT (user_id, pattern_name) DO NOTHING;

-- 완료 메시지
SELECT 'ChatGPT 거래 시스템 리스크 관리 테이블 생성 완료! 🛡️' as result;