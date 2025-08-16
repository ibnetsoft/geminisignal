# PRD: 통합 리스크 관리 시스템
## Product Requirements Document

### 📋 개요
- **프로젝트명**: ChatGPT Trading Risk Management System
- **버전**: 1.0.0
- **작성일**: 2024-01-16
- **작성자**: ChatGPT Code Assistant

### 🎯 목적
ChatGPT 기반 자동 거래 시스템에 종합적인 리스크 관리 기능을 제공하여 사용자의 자산을 보호하고 안전한 거래를 보장

### 🔑 핵심 기능

#### 1. 이중 인터페이스 시스템
- **ChatGPT 대화형 인터페이스**: 자연어 기반 리스크 설명 및 경고
- **비주얼 대시보드**: 실시간 차트와 그래프로 리스크 시각화

#### 2. 5계층 리스크 보호
1. **증거금 검사**: 여유증거금 부족 시 거래 차단
2. **일일 손실 한도**: 5% 초과 시 자동 거래 중단
3. **최대 드로우다운**: 10% 도달 시 긴급 조치
4. **포지션 사이징**: Kelly Criterion 기반 최적 크기 계산
5. **강제 손절/익절**: 모든 거래에 자동 적용

#### 3. 실시간 모니터링
- 30초 주기 자동 리스크 체크
- MetaAPI 네이티브 리스크 API 연동
- 위험 상황 즉시 알림

### 💻 기술 스택
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Trading API**: MetaAPI
- **Frontend**: HTML5, Chart.js
- **Messaging**: ChatGPT Risk Messaging System

### 📊 데이터베이스 구조

#### Supabase 테이블 (8개)
1. `trading_sessions` - 모든 거래 세션 추적
2. `risk_analysis_logs` - 리스크 분석 기록
3. `position_risk_monitoring` - 실시간 포지션 모니터링
4. `daily_risk_summaries` - 일일 요약 보고서
5. `risk_alerts` - 리스크 경고 및 알림
6. `user_trading_patterns` - 사용자 거래 패턴
7. `metaapi_accounts` - MetaAPI 계정 연동
8. `news_analysis_logs` - 뉴스 기반 리스크 분석

### 📱 사용자 인터페이스

#### ChatGPT 메시지 유형
1. **거래 실행 메시지**
   - 거래 정보 (종목, 수량, 가격)
   - 리스크 관리 (손절/익절, 최대 리스크)
   - 계정 상태 (잔고, 여유증거금)
   - 권장사항

2. **리스크 경고 메시지**
   - 일일 손실 경고
   - 드로우다운 경고
   - 포지션 크기 경고
   - 증거금 경고

3. **일일 요약 메시지**
   - 거래 통계
   - 손익 현황
   - 리스크 분석
   - 성과 지표

4. **리스크 프로필 메시지**
   - 거래 스타일 분석 (보수적/균형/공격적)
   - 30일 성과 지표
   - 맞춤형 권장사항

#### 비주얼 대시보드 구성
1. **리스크 상태 카드** (6개)
   - 계정 잔고
   - 일일 손익
   - 최대 드로우다운
   - 활성 포지션
   - 승률 (30일)
   - 리스크 점수

2. **차트 영역**
   - 일일 손익 추이 (Chart.js)
   - 7일간 데이터 표시

3. **포지션 모니터링**
   - 실시간 포지션 목록
   - 손익 상태별 색상 구분

4. **경고 패널**
   - 실시간 리스크 알림
   - 심각도별 아이콘 표시

### 🔧 API 엔드포인트

#### 계정 관리
- `GET /api/account` - 계정 정보 조회
- `GET /api/risk-status` - 종합 리스크 상태

#### 리스크 분석
- `GET /api/risk-profile/:userId` - 사용자 프로필
- `GET /api/risk-alerts/:userId` - 리스크 경고
- `GET /api/daily-risk-summary/:userId` - 일일 요약

#### 거래 관리
- `POST /api/validate-trade` - 거래 검증
- `POST /api/initialize-risk` - 시스템 초기화

#### 모니터링
- `GET /api/monitoring-status` - 모니터링 상태
- `POST /api/start-monitoring` - 모니터링 시작
- `POST /api/stop-monitoring` - 모니터링 중지

### 🚀 구현 완료 사항

#### 서비스 레이어
- ✅ `RiskManagementIntegrator.js` - 통합 조정 서비스
- ✅ `ChatGPTRiskMessaging.js` - 메시징 시스템
- ✅ `MetaAPIRiskManagement.js` - MetaAPI 연동
- ✅ `RiskManagementSupabase.js` - DB 서비스

#### 프론트엔드
- ✅ `risk-dashboard.html` - 대시보드 UI
- ✅ 실시간 업데이트 (30초 주기)
- ✅ Chart.js 통합

#### API 라우트
- ✅ `risk-api.js` - REST API 구현
- ✅ Express 서버 통합

### 📈 성과 지표
- **리스크 감소**: 자동 손절로 최대 손실 2% 제한
- **수익 개선**: 손익비 1:2 자동 설정
- **안전성 향상**: 5계층 보호 시스템
- **투명성 증대**: 실시간 리스크 가시화

### 🔮 향후 계획
1. AI 기반 리스크 예측 모델
2. 다중 계정 동시 관리
3. 모바일 앱 개발
4. 백테스팅 시스템 통합

### 📝 사용 방법

#### 1. Supabase 테이블 생성
```bash
# Supabase Dashboard에서 supabase_risk_tables.sql 실행
```

#### 2. 환경 변수 설정
```env
METAAPI_TOKEN=your_token
METAAPI_ACCOUNT_ID=your_account_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

#### 3. 서버 시작
```bash
node chatgpt-trader.js  # ChatGPT 거래 서버
node index.js          # 메인 서버 (대시보드 포함)
```

#### 4. 대시보드 접속
```
http://localhost:3001/risk-dashboard.html
```

### ✅ 테스트 완료
- 통합 시스템 테스트 (`test-integrated-risk.js`)
- ChatGPT 메시징 생성 확인
- 대시보드 렌더링 검증
- API 엔드포인트 응답 테스트

---
*이 시스템은 사용자의 자산을 보호하고 안전한 거래를 보장하기 위해 설계되었습니다.*