# PRD: ChatGPT 전략 실행 엔진 시스템

## 개요

사용자가 ChatGPT에게 자연어로 설명한 거래 전략을 자동으로 학습, 저장, 실행하는 종합적인 전략 실행 엔진입니다. 실시간 시장 데이터 모니터링, 기술적 지표 계산, 리스크 관리 통합을 통해 완전한 자동 거래 시스템을 제공합니다.

## 핵심 기능

### 1. 전략 학습 및 관리
- **자연어 전략 파싱**: 사용자가 일반 언어로 설명한 전략을 구조화된 데이터로 변환
- **최대 10개 전략 저장**: 사용자당 10개의 전략을 저장하고 관리
- **전략 검증 및 최적화**: 전략의 유효성 검사 및 개선 제안
- **버튼식 UI**: 쉬운 전략 선택 및 실행을 위한 직관적 인터페이스

### 2. 실시간 시장 데이터 모니터링
- **MetaAPI 연동**: 실시간 가격 데이터 수집
- **다중 심볼 지원**: 여러 통화쌍 동시 모니터링
- **기술적 지표 계산**: RSI, MACD, SMA, EMA, 볼린저밴드 등
- **신호 분석**: 종합적인 매매 신호 생성

### 3. 전략 실행 엔진
- **실시간 조건 체크**: 30초마다 전략 조건 평가
- **자동 거래 실행**: 조건 만족 시 자동 주문 생성
- **리스크 관리 통합**: 모든 거래에 리스크 관리 적용
- **이벤트 기반 아키텍처**: 효율적인 실시간 처리

### 4. 리스크 관리 시스템
- **포지션 크기 계산**: 계정 잔고 및 리스크 비율 기반
- **스톱로스/테이크프로핏**: 자동 손절 및 익절 설정
- **최대 동시 거래 제한**: 과도한 노출 방지
- **쿨다운 기간**: 연속 거래 방지 메커니즘

## 시스템 아키텍처

### 핵심 컴포넌트

1. **StrategyParser**: 자연어 → 구조화된 전략 데이터
2. **StrategyManager**: 전략 CRUD 및 생명주기 관리
3. **TechnicalIndicators**: 기술적 지표 계산 라이브러리
4. **MarketDataMonitor**: 실시간 시장 데이터 수집
5. **StrategyExecutionEngine**: 전략 실행 및 거래 오케스트레이션
6. **RiskManagementIntegrator**: 리스크 관리 통합

### 데이터베이스 스키마 (Supabase)

```sql
-- 사용자 전략 테이블
CREATE TABLE user_trading_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    strategy_number INTEGER NOT NULL,
    strategy_name TEXT NOT NULL,
    description TEXT,
    original_conversation TEXT,
    technical_indicators JSONB,
    entry_conditions JSONB,
    exit_conditions JSONB,
    risk_management JSONB,
    timeframes TEXT[],
    symbols TEXT[],
    is_active BOOLEAN DEFAULT false,
    is_running BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    UNIQUE(user_id, strategy_number)
);

-- 전략 실행 세션
CREATE TABLE strategy_execution_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES user_trading_strategies(id),
    user_id TEXT NOT NULL,
    session_name TEXT,
    execution_mode TEXT DEFAULT 'live',
    initial_balance DECIMAL(15,2),
    current_balance DECIMAL(15,2),
    symbols_traded TEXT[],
    timeframe TEXT,
    status TEXT DEFAULT 'active',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    stop_reason TEXT
);

-- 전략 거래 기록
CREATE TABLE strategy_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES user_trading_strategies(id),
    session_id UUID REFERENCES strategy_execution_sessions(id),
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL, -- 'buy' or 'sell'
    volume DECIMAL(10,4),
    entry_price DECIMAL(10,5),
    exit_price DECIMAL(10,5),
    stop_loss DECIMAL(10,5),
    take_profit DECIMAL(10,5),
    entry_time TIMESTAMPTZ DEFAULT NOW(),
    exit_time TIMESTAMPTZ,
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'cancelled'
    realized_pnl DECIMAL(10,2),
    signal_confidence DECIMAL(3,2),
    signal_details TEXT[],
    market_analysis JSONB,
    ticket_id TEXT
);

-- 전략 신호 로그
CREATE TABLE strategy_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES user_trading_strategies(id),
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL, -- 'buy', 'sell', 'hold'
    confidence_score DECIMAL(3,2),
    reasoning TEXT,
    market_data JSONB,
    technical_indicators JSONB,
    action_taken TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 전략 학습 세션
CREATE TABLE strategy_learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    strategy_id UUID REFERENCES user_trading_strategies(id),
    session_type TEXT NOT NULL, -- 'create', 'modify', 'question'
    user_input TEXT NOT NULL,
    parsed_strategy JSONB,
    ai_interpretation TEXT,
    suggested_parameters JSONB,
    validation_status TEXT,
    strategy_created BOOLEAN DEFAULT false,
    strategy_updated BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## API 엔드포인트

### 전략 관리 API

```javascript
// 전략 생성
POST /api/strategies/create
{
    "userId": "user123",
    "userInput": "RSI가 30 이하일 때 매수하고 70 이상일 때 매도하는 전략",
    "strategyName": "RSI 과매도/과매수 전략"
}

// 전략 목록 조회
GET /api/strategies/:userId

// 전략 상세 조회
GET /api/strategies/:userId/:strategyNumber

// 전략 실행 시작
POST /api/strategies/:userId/:strategyNumber/start
{
    "mode": "live",
    "initialBalance": 1000,
    "timeframe": "15m"
}

// 전략 실행 중지
POST /api/strategies/:userId/:strategyNumber/stop
{
    "reason": "user_request"
}

// 전략 성과 조회
GET /api/strategies/:userId/:strategyNumber/performance?days=30

// 전략 요약 정보
GET /api/strategies/:userId/summary
```

### 실행 엔진 API

```javascript
// 엔진 상태 조회
GET /api/execution-engine/status

// 실행 중인 전략 목록
GET /api/execution-engine/active-strategies

// 시장 데이터 상태
GET /api/execution-engine/market-status

// 엔진 설정 업데이트
PUT /api/execution-engine/config
{
    "checkInterval": 30000,
    "maxConcurrentTrades": 5,
    "cooldownPeriod": 300000
}
```

## 전략 파싱 예시

### 입력 (자연어)
```
"RSI가 30 이하일 때 매수하고 70 이상일 때 매도하는 전략을 만들어줘. 
손절은 2%, 익절은 4%로 설정하고 리스크는 거래당 1.5%로 제한해줘. 
EURUSD에서 15분봉으로 거래할거야."
```

### 출력 (구조화된 데이터)
```json
{
    "name": "RSI 과매도/과매수 전략",
    "description": "RSI 지표를 활용한 과매도/과매수 거래 전략",
    "technical_indicators": {
        "rsi": {
            "period": 14,
            "overbought": 70,
            "oversold": 30
        }
    },
    "entry_conditions": {
        "rsi": {
            "buy_below": 30,
            "sell_above": 70
        }
    },
    "exit_conditions": {
        "stop_loss": {
            "type": "percentage",
            "value": 0.02
        },
        "take_profit": {
            "type": "percentage", 
            "value": 0.04
        }
    },
    "risk_management": {
        "risk_per_trade": 0.015,
        "stop_loss_percentage": 0.02,
        "take_profit_percentage": 0.04
    },
    "symbols": ["EURUSD"],
    "timeframes": ["15m"],
    "confidence_score": 85
}
```

## 기술적 지표 지원

### 지원 지표
- **RSI (Relative Strength Index)**: 과매도/과매수 판단
- **MACD (Moving Average Convergence Divergence)**: 추세 전환 신호
- **SMA (Simple Moving Average)**: 단순 이동평균
- **EMA (Exponential Moving Average)**: 지수 이동평균
- **볼린저밴드**: 변동성 기반 매매 신호
- **Stochastic**: 모멘텀 오실레이터
- **ATR (Average True Range)**: 변동성 측정
- **Williams %R**: 과매도/과매수 오실레이터

### 신호 분석 알고리즘
```javascript
// 종합 신호 분석 예시
{
    "overall": "buy",           // 최종 신호: buy/sell/hold
    "confidence": 0.75,         // 신뢰도 (0-1)
    "details": [
        {
            "indicator": "RSI",
            "signal": "oversold",   // RSI 30 이하
            "value": 25.3
        },
        {
            "indicator": "MACD", 
            "signal": "bullish_crossover",  // 상승 크로스오버
            "value": 0.0012
        }
    ],
    "bullish_indicators": 2,    // 상승 신호 개수
    "bearish_indicators": 0     // 하락 신호 개수
}
```

## 리스크 관리 통합

### 포지션 크기 계산
```javascript
function calculatePositionSize(riskPercentage, accountBalance, stopLossDistance) {
    const riskAmount = accountBalance * riskPercentage;
    const positionSize = riskAmount / stopLossDistance;
    return Math.min(positionSize, MAX_POSITION_SIZE);
}
```

### 거래 실행 플로우
1. **전략 조건 체크**: 기술적 지표 기반 신호 분석
2. **리스크 검증**: 계정 상태 및 위험도 평가
3. **포지션 계산**: 적절한 거래 크기 산정
4. **주문 생성**: MetaAPI를 통한 실제 거래 실행
5. **모니터링**: 포지션 상태 실시간 추적

## 성능 최적화

### 실시간 처리
- **이벤트 기반 아키텍처**: 효율적인 비동기 처리
- **메모리 관리**: 과거 데이터 제한 (최대 200개 캔들)
- **배치 처리**: 여러 심볼 동시 업데이트
- **캐싱**: 계산 결과 임시 저장

### 확장성
- **마이크로서비스 구조**: 독립적인 컴포넌트 설계
- **수평 확장**: 다중 전략 동시 실행 지원
- **로드 밸런싱**: 시장 데이터 처리 분산

## 모니터링 및 로깅

### 실행 로그
- **전략 실행 기록**: 시작/중지 이벤트
- **거래 로그**: 모든 매매 기록 및 결과
- **신호 로그**: 매매 신호 생성 내역
- **오류 로그**: 시스템 오류 및 예외 상황

### 성과 추적
- **실시간 P&L**: 수익/손실 실시간 계산
- **승률 분석**: 전략별 승률 및 수익률
- **위험 지표**: 최대 손실, 드로우다운 등
- **벤치마크**: 시장 대비 성과 비교

## 보안 및 안정성

### 보안 조치
- **API 키 암호화**: 민감한 정보 보호
- **권한 관리**: 사용자별 접근 제어
- **감사 로그**: 모든 작업 기록
- **데이터 백업**: 정기적인 백업 및 복구

### 장애 대응
- **Circuit Breaker**: 연쇄 오류 방지
- **자동 복구**: 일시적 장애 자동 복구
- **Graceful Degradation**: 부분 서비스 중단 시 대응
- **모니터링 알림**: 실시간 장애 감지

## 향후 확장 계획

### 단기 (1-3개월)
- **백테스팅 기능**: 과거 데이터로 전략 검증
- **포트폴리오 관리**: 여러 전략 조합 최적화
- **알림 시스템**: 거래 결과 실시간 알림
- **모바일 앱**: 전략 관리 모바일 인터페이스

### 중기 (3-6개월)
- **머신러닝 통합**: AI 기반 전략 최적화
- **소셜 트레이딩**: 전략 공유 및 복사 거래
- **다중 브로커 지원**: 여러 거래소 연동
- **고급 차트**: 실시간 차트 및 분석 도구

### 장기 (6개월+)
- **암호화폐 지원**: 디지털 자산 거래 확장
- **뉴스 통합**: 시장 뉴스 기반 거래 신호
- **API 생태계**: 서드파티 개발자 지원
- **기관 투자자 기능**: 대규모 자금 관리 도구

## 결론

이 전략 실행 엔진 시스템은 일반 사용자도 쉽게 자신만의 거래 전략을 만들고 실행할 수 있는 완전한 솔루션을 제공합니다. 자연어 처리부터 실시간 거래 실행까지의 전 과정을 자동화하여, 전문적인 프로그래밍 지식 없이도 체계적인 자동 거래가 가능합니다.