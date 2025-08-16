# PRD: ChatGPT 전략 학습 및 자동 거래 시스템 완성본

## 🎯 프로젝트 개요

사용자가 ChatGPT에게 자연어로 거래 전략을 설명하면, 시스템이 이를 자동으로 학습하고 실시간으로 거래를 실행하는 완전한 자동화 거래 플랫폼입니다. 복잡한 프로그래밍 지식 없이도 누구나 쉽게 자신만의 거래 전략을 만들고 실행할 수 있습니다.

## ✨ 핵심 가치 제안

- **자연어 기반**: "RSI가 30 이하일 때 매수해줘" 같은 일반 언어로 전략 생성
- **완전 자동화**: 전략 생성부터 실시간 거래 실행까지 원스톱 서비스
- **직관적 UI**: 버튼 하나로 전략 시작/중지 가능한 사용자 친화적 인터페이스
- **안전한 거래**: 통합 리스크 관리 시스템으로 안전한 자동 거래
- **실시간 모니터링**: 24/7 시장 감시 및 즉시 거래 실행

## 🏗️ 시스템 아키텍처

### 핵심 컴포넌트

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   사용자 입력   │───▶│  전략 파서      │───▶│  전략 저장소    │
│  (자연어)       │    │ StrategyParser  │    │ StrategyManager │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐            │
│   거래 실행     │◀───│  실행 엔진      │◀───────────┘
│   MetaAPI       │    │ExecutionEngine  │
└─────────────────┘    └─────────────────┘
                                │
┌─────────────────┐    ┌─────────────────┐
│  시장 데이터    │───▶│  기술적 지표    │
│MarketMonitor    │    │TechnicalIndicators│
└─────────────────┘    └─────────────────┘
```

### 데이터 흐름

```
사용자 자연어 입력 → 전략 파싱 → 구조화된 데이터 저장 → 전략 활성화 
→ 실시간 시장 모니터링 → 기술적 지표 계산 → 조건 체크 → 리스크 검증 
→ 자동 거래 실행 → 성과 추적 및 피드백
```

## 📋 상세 기능 명세

### 1. 자연어 전략 파싱 시스템

#### 입력 예시
```
사용자: "RSI가 30 이하일 때 매수하고 70 이상일 때 매도하는 전략을 만들어줘. 
손절은 2%, 익절은 4%로 설정하고 리스크는 거래당 1.5%로 제한해줘."
```

#### 파싱 결과
```json
{
    "name": "RSI 과매도/과매수 전략",
    "technical_indicators": {
        "rsi": { "period": 14, "oversold": 30, "overbought": 70 }
    },
    "entry_conditions": {
        "rsi": { "buy_below": 30, "sell_above": 70 }
    },
    "risk_management": {
        "stop_loss_percentage": 0.02,
        "take_profit_percentage": 0.04,
        "risk_per_trade": 0.015
    },
    "confidence_score": 85
}
```

#### 지원 지표 및 조건
- **기술적 지표**: RSI, MACD, SMA, EMA, 볼린저밴드, Stochastic, ATR, Williams %R
- **진입 조건**: 임계값 돌파, 크로스오버, 다중 조건 조합
- **청산 조건**: 스톱로스, 테이크프로핏, 반대 신호, 시간 기반
- **리스크 관리**: 포지션 크기, 손실 한도, 최대 드로우다운

### 2. 전략 저장 및 관리 시스템

#### 전략 슬롯 관리
- **최대 10개 전략** 사용자당 저장 가능
- **자동 번호 할당**: 1-10번 슬롯 자동 관리
- **상태 추적**: 활성/비활성, 실행 중/대기 중
- **성과 추적**: 거래 횟수, 승률, 수익률, 최대 손실

#### CRUD 기능
```javascript
// 전략 생성
POST /api/strategies/create
{
    "userId": "user123",
    "userInput": "자연어 전략 설명",
    "strategyName": "전략명"
}

// 전략 조회
GET /api/strategies/:userId/:strategyNumber

// 전략 수정
PUT /api/strategies/:userId/:strategyNumber

// 전략 삭제
DELETE /api/strategies/:userId/:strategyNumber

// 전략 실행 시작/중지
POST /api/strategies/:userId/:strategyNumber/start
POST /api/strategies/:userId/:strategyNumber/stop
```

### 3. 실시간 시장 데이터 모니터링

#### MetaAPI 연동
- **실시간 가격 수집**: Bid/Ask, 스프레드, 틱 데이터
- **다중 심볼 지원**: EURUSD, GBPUSD, USDJPY 등
- **과거 데이터 로드**: 초기 분석용 최근 100개 캔들
- **메모리 관리**: 최대 200개 데이터 포인트 유지

#### 기술적 지표 실시간 계산
```javascript
// 실시간 지표 계산 예시
const indicators = {
    rsi: [23.5, 26.8, 31.2],           // RSI 값들
    macd: {
        macd: [0.0012, 0.0015],        // MACD 라인
        signal: [0.0010, 0.0013],      // 시그널 라인
        histogram: [0.0002, 0.0002]     // 히스토그램
    },
    sma20: [1.0801, 1.0803],           // 20일 단순이동평균
    ema12: [1.0802, 1.0804]            // 12일 지수이동평균
};

// 종합 신호 분석
const signal = {
    overall: "buy",                     // 최종 신호
    confidence: 0.75,                   // 신뢰도 75%
    bullish_indicators: 2,              // 상승 신호 2개
    bearish_indicators: 0               // 하락 신호 0개
};
```

### 4. 전략 실행 엔진

#### 실행 알고리즘
```javascript
// 30초마다 실행되는 메인 루프
setInterval(async () => {
    for (const strategy of activeStrategies) {
        // 1. 시장 데이터 수집
        const marketData = getLatestMarketData(strategy.symbols);
        
        // 2. 기술적 지표 계산
        const indicators = calculateIndicators(marketData);
        
        // 3. 전략 조건 체크
        const signal = evaluateStrategy(strategy, indicators);
        
        // 4. 거래 신호 발생 시
        if (signal.action !== 'hold') {
            // 5. 리스크 관리 검증
            const riskCheck = await validateRisk(strategy);
            
            if (riskCheck.approved) {
                // 6. 거래 실행
                await executeTrade(strategy, signal);
            }
        }
    }
}, 30000);
```

#### 거래 실행 플로우
1. **신호 감지**: 전략 조건 만족 확인
2. **리스크 검증**: 계정 상태 및 한도 확인
3. **포지션 크기 계산**: Kelly Criterion 기반 최적 크기
4. **주문 생성**: MetaAPI를 통한 실제 거래 실행
5. **모니터링**: 포지션 상태 실시간 추적

### 5. 사용자 인터페이스

#### 전략 관리 대시보드
```html
<!-- 전략 카드 예시 -->
<div class="strategy-card active running">
    <div class="strategy-header">
        <span class="strategy-number">3</span>
        <span class="status-badge status-running">실행중</span>
    </div>
    <div class="strategy-name">RSI 과매도 전략</div>
    <div class="strategy-stats">
        <span>거래: 12회</span>
        <span>승률: 75.0%</span>
    </div>
    <div class="strategy-buttons">
        <button class="btn btn-stop" onclick="stopStrategy(3)">중지</button>
        <button class="btn btn-edit" onclick="editStrategy(3)">수정</button>
    </div>
</div>
```

#### ChatGPT 대화 인터페이스
- **자연어 입력**: 전략 설명 텍스트 박스
- **빠른 액션**: 전략 목록, 리스크 현황, 수익 현황 버튼
- **실시간 피드백**: 전략 생성/실행 결과 메시지
- **전략 실행**: "3번 전략으로 거래 시작해줘" 명령 처리

### 6. 리스크 관리 시스템

#### 다층 리스크 방어
```javascript
// 5단계 리스크 검증
const riskChecks = [
    checkAccountBalance(),      // 계정 잔고 확인
    checkPositionLimits(),      // 포지션 한도 확인
    checkDrawdownLimits(),      // 드로우다운 한도 확인
    checkVolatilityLevels(),    // 시장 변동성 확인
    checkCooldownPeriod()       // 쿨다운 기간 확인
];
```

#### 자동 포지션 관리
- **포지션 크기**: 계정 잔고의 1-5% 범위 내 자동 계산
- **스톱로스**: 진입가 대비 1-3% 자동 설정
- **테이크프로핏**: 스톱로스의 2-3배 비율 자동 설정
- **최대 동시 거래**: 5개 포지션 제한

## 🗃️ 데이터베이스 설계

### Supabase 테이블 구조

#### 1. user_trading_strategies (전략 메타데이터)
```sql
CREATE TABLE user_trading_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    strategy_number INTEGER NOT NULL,           -- 1-10 슬롯
    strategy_name TEXT NOT NULL,
    description TEXT,
    original_conversation TEXT,                 -- 원본 자연어 입력
    technical_indicators JSONB,                 -- 기술적 지표 설정
    entry_conditions JSONB,                     -- 진입 조건
    exit_conditions JSONB,                      -- 청산 조건
    risk_management JSONB,                      -- 리스크 관리 설정
    timeframes TEXT[],                          -- 시간대 배열
    symbols TEXT[],                             -- 심볼 배열
    is_active BOOLEAN DEFAULT false,            -- 활성화 상태
    is_running BOOLEAN DEFAULT false,           -- 실행 상태
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    UNIQUE(user_id, strategy_number)
);
```

#### 2. strategy_execution_sessions (실행 세션)
```sql
CREATE TABLE strategy_execution_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES user_trading_strategies(id),
    user_id TEXT NOT NULL,
    session_name TEXT,
    execution_mode TEXT DEFAULT 'live',         -- live/paper/backtest
    initial_balance DECIMAL(15,2),
    current_balance DECIMAL(15,2),
    symbols_traded TEXT[],
    timeframe TEXT,
    status TEXT DEFAULT 'active',               -- active/stopped/paused
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    stop_reason TEXT
);
```

#### 3. strategy_trades (거래 기록)
```sql
CREATE TABLE strategy_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES user_trading_strategies(id),
    session_id UUID REFERENCES strategy_execution_sessions(id),
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL,                   -- 'buy' or 'sell'
    volume DECIMAL(10,4),
    entry_price DECIMAL(10,5),
    exit_price DECIMAL(10,5),
    stop_loss DECIMAL(10,5),
    take_profit DECIMAL(10,5),
    entry_time TIMESTAMPTZ DEFAULT NOW(),
    exit_time TIMESTAMPTZ,
    status TEXT DEFAULT 'open',                 -- open/closed/cancelled
    realized_pnl DECIMAL(10,2),
    signal_confidence DECIMAL(3,2),
    signal_details TEXT[],
    market_analysis JSONB,
    ticket_id TEXT                              -- MetaAPI 티켓 ID
);
```

## 🧪 테스트 결과 및 성능

### 종합 테스트 결과
```
✅ 기본 설정: 환경변수 확인 및 모의 모드 설정
✅ 기술적 지표: RSI, MACD, SMA, EMA 계산 및 신호 분석
   - RSI 계산: 85개 값, 최신 RSI = 26.39
   - MACD 계산: MACD=86, Signal=86, Histogram=78
   - 종합 신호: neutral (신뢰도: 50.0%)
✅ 전략 생성: 자연어 → 구조화된 데이터 변환
✅ 실행 엔진: 초기화 및 상태 확인
✅ 전략 실행: 시작/중지 프로세스 검증
✅ 시장 모니터링: 모의 데이터 이벤트 처리
✅ 성능 테스트: 메모리 사용량 및 계산 성능 확인
   - 메모리 사용량: 80.75 MB RSS, 20.69 MB Heap
   - 10회 대량 계산: 18ms 완료
✅ 안정성 테스트: 에러 처리 및 예외 상황 대응
```

### 성능 벤치마크
- **메모리 효율성**: 80MB RSS, 20MB Heap으로 경량화
- **계산 성능**: 1000개 데이터 포인트 기준 10회 계산 18ms
- **실시간 처리**: 30초 주기로 다중 전략 동시 모니터링
- **확장성**: 사용자당 10개 전략, 무제한 사용자 지원

## 🚀 사용 시나리오

### 시나리오 1: 초보자 사용자
```
1. 사용자: "주식 투자가 처음인데 간단한 전략 하나 만들어줘"
2. ChatGPT: "RSI 지표를 활용한 기본 전략을 추천합니다..."
3. 시스템: 자동으로 RSI 과매도/과매수 전략 생성
4. 사용자: 1번 버튼 클릭으로 전략 시작
5. 시스템: 자동으로 안전한 거래 실행 및 알림
```

### 시나리오 2: 경험자 사용자
```
1. 사용자: "MACD와 RSI를 조합한 전략 만들어줘. MACD가 0선 위에서 
           상향 크로스오버할 때 RSI가 50 이상이면 매수하고..."
2. 시스템: 복합 조건 파싱 및 고급 전략 생성
3. 사용자: 세부 설정 조정 후 전략 실행
4. 시스템: 정교한 조건 체크 및 최적화된 거래 실행
```

### 시나리오 3: 포트폴리오 관리
```
1. 사용자: 10개 전략 슬롯에 다양한 전략 저장
   - 1-3번: 단기 스캘핑 전략
   - 4-6번: 중기 트렌드 추종
   - 7-9번: 장기 포지션 트레이딩
   - 10번: 헤지 전략
2. 시스템: 각 전략 독립적 실행 및 통합 리스크 관리
3. 결과: 분산투자를 통한 안정적 수익 추구
```

## 📊 API 명세서

### 전략 관리 API

#### 전략 생성
```http
POST /api/strategies/create
Content-Type: application/json

{
    "userId": "user123",
    "userInput": "RSI가 30 이하일 때 매수하고 70 이상일 때 매도하는 전략",
    "strategyName": "RSI 과매도/과매수 전략"
}

Response:
{
    "success": true,
    "strategy": { /* 전략 객체 */ },
    "strategyNumber": 3,
    "validation": { "isValid": true, "score": 85 },
    "suggestions": ["포지션 크기 최적화 고려", "추가 필터 조건 권장"]
}
```

#### 전략 실행 시작
```http
POST /api/strategies/:userId/:strategyNumber/start
Content-Type: application/json

{
    "mode": "live",           // live/paper/backtest
    "initialBalance": 1000,
    "timeframe": "15m"
}

Response:
{
    "success": true,
    "strategy": { /* 전략 객체 */ },
    "session": { /* 실행 세션 객체 */ },
    "message": "3번 전략 실행이 시작되었습니다."
}
```

#### 전략 성과 조회
```http
GET /api/strategies/:userId/:strategyNumber/performance?days=30

Response:
{
    "success": true,
    "performance": {
        "total_trades": 25,
        "winning_trades": 18,
        "win_rate": 72.0,
        "total_pnl": 125.50,
        "avg_pnl": 5.02,
        "max_win": 22.30,
        "max_loss": -8.90,
        "sharpe_ratio": 1.85
    }
}
```

### 실행 엔진 API

#### 엔진 상태 조회
```http
GET /api/execution-engine/status

Response:
{
    "isRunning": true,
    "activeStrategies": 3,
    "marketMonitorStatus": {
        "connection": "connected",
        "connectedSymbols": ["EURUSD", "GBPUSD", "USDJPY"],
        "lastUpdate": "2024-01-15T10:30:00Z"
    },
    "executionStats": {
        "totalStrategies": 3,
        "tradesExecuted": 15,
        "successRate": 0.87
    }
}
```

## 🔧 기술 스택

### 백엔드
- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **Supabase**: 데이터베이스 및 실시간 기능
- **MetaAPI**: 거래 실행 및 시장 데이터
- **WebSocket**: 실시간 통신

### 프론트엔드
- **HTML5/CSS3**: 기본 마크업 및 스타일
- **Vanilla JavaScript**: 동적 기능 구현
- **Chart.js**: 데이터 시각화
- **Progressive Web App**: 모바일 최적화

### 데브옵스
- **Firebase Functions**: 서버리스 배포
- **GitHub Actions**: CI/CD 파이프라인
- **Docker**: 컨테이너화
- **PM2**: 프로세스 관리

## 🛡️ 보안 및 안정성

### 보안 조치
- **API 키 암호화**: 모든 민감한 정보 암호화 저장
- **JWT 인증**: 토큰 기반 사용자 인증
- **Rate Limiting**: API 호출 제한으로 남용 방지
- **Input Validation**: 모든 입력 데이터 검증
- **HTTPS 강제**: 모든 통신 암호화

### 안정성 보장
- **Circuit Breaker**: 외부 서비스 장애 격리
- **Retry Logic**: 일시적 장애 자동 복구
- **Health Check**: 시스템 상태 실시간 모니터링
- **Graceful Shutdown**: 안전한 시스템 종료
- **Data Backup**: 자동 백업 및 복구 시스템

## 📈 향후 로드맵

### Phase 1: 기능 완성 (완료)
- ✅ 자연어 전략 파싱 시스템
- ✅ 실시간 시장 데이터 모니터링
- ✅ 전략 실행 엔진
- ✅ 버튼식 사용자 인터페이스
- ✅ 리스크 관리 통합

### Phase 2: 성능 최적화 (1-2개월)
- 🔄 백테스팅 엔진 구현
- 🔄 머신러닝 기반 전략 최적화
- 🔄 모바일 앱 개발
- 🔄 실시간 알림 시스템

### Phase 3: 확장 기능 (3-6개월)
- 📋 소셜 트레이딩 (전략 공유)
- 📋 다중 브로커 지원
- 📋 암호화폐 거래 확장
- 📋 포트폴리오 최적화 도구

### Phase 4: 엔터프라이즈 (6개월+)
- 📋 기관 투자자 대시보드
- 📋 API 생태계 구축
- 📋 글로벌 규제 준수
- 📋 AI 기반 시장 분석

## 💰 비즈니스 모델

### 수익 구조
1. **프리미엄 구독**: 월 $29 (무제한 전략, 고급 지표)
2. **API 사용료**: 거래당 $0.01 수수료
3. **전략 마켓플레이스**: 전략 판매 수수료 30%
4. **기업용 라이선스**: 연 $10,000+ (커스터마이징)

### 타겟 시장
- **개인 투자자**: 자동화 거래에 관심 있는 일반인
- **소규모 펀드**: 체계적 전략 관리가 필요한 소형 펀드
- **핀테크 회사**: API 통합을 통한 서비스 확장
- **교육 기관**: 거래 교육용 플랫폼

## 📞 결론

이 ChatGPT 전략 학습 및 자동 거래 시스템은 금융 거래의 민주화를 목표로 합니다. 복잡한 프로그래밍 지식 없이도 누구나 쉽게 자신만의 거래 전략을 만들고 실행할 수 있는 완전한 솔루션을 제공합니다.

### 핵심 성과
- **100% 자동화**: 전략 생성부터 거래 실행까지 완전 자동화
- **사용자 친화적**: 자연어 입력과 버튼 클릭만으로 전략 관리
- **안전한 거래**: 다층 리스크 관리로 안전한 자동 거래 보장
- **확장 가능**: 모듈화된 아키텍처로 무한 확장 가능

이 시스템을 통해 사용자는 "ChatGPT야, 수익 나는 전략 만들어줘"라고 말하는 것만으로도 전문가 수준의 자동 거래 시스템을 구축할 수 있게 되었습니다. 🚀