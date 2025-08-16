# 🚨 SECURITY ALERT - 즉시 조치 필요

## ⚠️ 중요한 보안 문제가 해결되었습니다

이 프로젝트에서 **민감한 API 키와 토큰이 노출**되었던 문제를 해결했습니다.

### 🔒 완료된 보안 조치

1. ✅ **민감한 정보 제거**: `env.txt` 파일 삭제 완료
2. ✅ **`.gitignore` 강화**: 포괄적인 보안 규칙 추가
3. ✅ **환경변수 템플릿**: `.env.example` 파일 생성
4. ✅ **보안 가이드**: 상세한 설정 문서 제공

### 🚨 즉시 해야 할 일

**모든 노출된 API 키를 재발급하세요:**

- 🔑 Google/Gemini API 키
- 🔑 Alpha Vantage API 키  
- 🔑 Finnhub API 키
- 🔑 MarketAux API 키
- 🔑 Telegram Bot Token
- 🔑 MetaAPI Trading Token (매우 중요!)
- 🔑 Firebase Service Account 키

### 📖 설정 가이드

자세한 보안 설정 방법은 [`SECURITY_GUIDE.md`](./SECURITY_GUIDE.md) 문서를 참조하세요.

### 🚀 빠른 시작

1. **환경변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 열고 실제 API 키로 대체
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 시작**
   ```bash
   npm run dev
   ```

### 📁 프로젝트 구조

```
NP_signal/
├── 🔐 .env.example          # 환경변수 템플릿
├── 📋 .gitignore            # 보안 규칙 포함
├── 🛡️ SECURITY_GUIDE.md    # 보안 설정 가이드
├── 📦 package.json          # 프로젝트 설정
├── 🎯 index.ts              # 메인 서버 파일
├── 🛠️ services/            # 서비스 계층
├── 🎛️ controllers/         # API 컨트롤러
├── 🔧 middleware/          # 미들웨어
├── 📊 utils/               # 유틸리티 함수
└── 🐍 nautilus_trader_service/ # Python 트레이딩 서비스
```

### 🏗️ 아키텍처

- **Node.js/TypeScript** 기반 메인 서버
- **Python/FastAPI** 트레이딩 서비스
- **Firebase** 데이터베이스
- **Telegram Bot** 알림 시스템
- **Multiple API** 통합 (Google AI, 금융 데이터)

### 🛡️ 보안 기능

- 환경변수 기반 API 키 관리
- 포괄적인 `.gitignore` 보안 규칙
- Firebase Service Account 키 보호
- 거래 시스템 안전 장치

### ⚙️ 환경별 설정

#### 개발 환경
```env
LOCAL_DEVELOPMENT=true
ENABLE_TRADING_SYSTEM=false
```

#### 프로덕션 환경  
```env
LOCAL_DEVELOPMENT=false
ENABLE_TRADING_SYSTEM=true  # 충분한 테스트 후에만
MIN_CONFIDENCE=0.85
MAX_RISK_LEVEL=low
```

### 📜 스크립트 명령어

```bash
npm run dev          # 개발 서버 (감시 모드)
npm run build        # TypeScript 컴파일
npm run start        # 프로덕션 서버
npm run start:prod   # 빌드된 파일 실행
```

### 🔧 개발 도구

- **TypeScript** - 타입 안전성
- **Express** - 웹 프레임워크  
- **Firebase Admin** - 데이터베이스
- **Telegraf** - 텔레그램 봇
- **Genkit** - AI 통합

### 📊 지원하는 기능

- 🤖 AI 기반 시장 분석 (Gemini)
- 📈 실시간 금융 데이터 처리
- 💬 텔레그램 알림 시스템
- 📊 다중 뉴스 소스 분석
- 💼 자동 거래 시스템 (선택적)

### ⚠️ 주의사항

1. **거래 시스템**은 충분한 테스트 없이 활성화하지 마세요
2. **API 키**는 절대 코드에 직접 작성하지 마세요
3. **프로덕션 환경**에서는 더 엄격한 보안 설정을 사용하세요
4. **정기적으로** API 키를 교체하세요

### 🆘 문제 해결

보안 관련 문제나 의문사항이 있으면:

1. [`SECURITY_GUIDE.md`](./SECURITY_GUIDE.md) 문서 참조
2. 시스템 즉시 중지
3. 관련 API 키 비활성화
4. 로그 확인 및 분석

---

**🔒 보안은 선택이 아닌 필수입니다. 모든 보안 조치를 완료한 후에 시스템을 운영하세요.**