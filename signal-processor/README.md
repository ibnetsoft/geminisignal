# External Signal Processor

🤖 **독립형 외부 신호 처리 마이크로서비스**

Firebase Firestore를 모니터링하여 외부 거래 신호를 실시간으로 분석하고 텔레그램으로 알림을 전송하는 AI 기반 서비스입니다.

## 🏗️ 아키텍처

```
External Signal → Firestore → SignalWatcher → NewsService → GeminiAnalyzer → TelegramService
```

### 핵심 컴포넌트

1. **SignalWatcher**: Firestore 실시간 모니터링
2. **NewsService**: 뉴스 API 통합 (Alpha Vantage, NewsAPI)
3. **GeminiAnalyzer**: Google Gemini AI 분석 엔진
4. **TelegramService**: 텔레그램 알림 전송

## 🚀 빠른 시작

### 1. 설치

```bash
cd signal-processor
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 API 키들을 설정
```

필수 환경 변수:
- `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `GOOGLE_API_KEY`: Gemini AI API 키
- `TELEGRAM_BOT_TOKEN`: 텔레그램 봇 토큰
- `TELEGRAM_CHAT_ID`: 텔레그램 채팅 ID
- `ALPHA_VANTAGE_API_KEY`: Alpha Vantage API 키
- `NEWS_API_KEY`: NewsAPI 키

### 3. Firebase 서비스 계정 설정

```bash
# Firebase 서비스 계정 키 파일을 config/ 디렉토리에 복사
cp /path/to/firebase-service-account.json config/
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 프로덕션 빌드 및 실행

```bash
npm run build
npm start
```

## 📁 프로젝트 구조

```
signal-processor/
├── src/
│   ├── services/           # 핵심 서비스들
│   │   ├── signalWatcher.ts
│   │   ├── newsService.ts
│   │   ├── geminiAnalyzer.ts
│   │   └── telegramService.ts
│   ├── models/            # 데이터 모델들
│   │   ├── Signal.ts
│   │   ├── NewsItem.ts
│   │   └── AnalysisResult.ts
│   ├── config/            # 설정 관리
│   │   ├── environment.ts
│   │   └── firebase.ts
│   ├── utils/             # 유틸리티
│   │   └── logger.ts
│   └── index.ts           # 메인 엔트리 포인트
├── tests/                 # 테스트 파일들
├── docs/                  # 문서
├── config/                # 설정 파일들
├── Dockerfile             # Docker 설정
├── package.json
└── tsconfig.json
```

## 🔄 처리 플로우

1. **신호 감지**: Firestore `signals` 컬렉션에 새 문서 감지
2. **신호 검증**: 신호 데이터 유효성 검증 및 정규화
3. **뉴스 수집**: 관련 심볼의 최신 뉴스 수집
4. **AI 분석**: Gemini AI로 신호+뉴스 종합 분석
5. **결과 전송**: 분석 결과를 텔레그램으로 전송
6. **결과 저장**: 분석 결과를 Firestore에 저장

## 🛠️ 개발

### 사용 가능한 스크립트

```bash
npm run dev          # 개발 서버 (nodemon + ts-node)
npm run build        # TypeScript 컴파일
npm start            # 프로덕션 실행
npm test             # 테스트 실행
npm run test:watch   # 테스트 감시 모드
npm run lint         # ESLint 실행
npm run format       # Prettier 포맷팅
```

### 개발 가이드라인

1. **타입 안전성**: 모든 함수와 변수에 타입 정의
2. **에러 처리**: 포괄적인 try-catch와 로깅
3. **검증**: 모든 입력 데이터 검증
4. **모니터링**: 구조화된 로깅과 메트릭 수집
5. **테스트**: 단위 테스트와 통합 테스트 작성

## 🐳 Docker 배포

```bash
# Docker 이미지 빌드
docker build -t signal-processor .

# Docker 컨테이너 실행
docker run -d --name signal-processor \
  --env-file .env \
  -v $(pwd)/config:/app/config \
  signal-processor
```

## 📊 모니터링

### 헬스체크

시스템 상태 확인:
```typescript
processor.getHealthStatus()
```

### 로깅

구조화된 JSON 로깅:
- 개발: 콘솔 출력
- 프로덕션: 파일 + 콘솔 출력
- 에러 추적: 별도 에러 로그 파일

### 메트릭

수집되는 주요 메트릭:
- 신호 처리 시간
- API 응답 시간
- 성공/실패율
- 동시 처리 신호 수

## 🔧 환경 설정

### 개발 환경

```bash
NODE_ENV=development
LOG_LEVEL=debug
MAX_CONCURRENT_SIGNALS=3
```

### 프로덕션 환경

```bash
NODE_ENV=production
LOG_LEVEL=info
MAX_CONCURRENT_SIGNALS=10
```

## 🚨 에러 처리

### 재시도 로직

- Firestore 연결 실패: 지수 백오프로 재연결
- API 호출 실패: 3회 재시도
- 텔레그램 전송 실패: 2회 재시도

### 데드 레터 큐

처리 실패한 신호들은 별도 컬렉션에 저장되어 수동 처리 가능

## 📈 성능 목표

- 신호 처리 지연시간: < 30초
- 일일 신호 처리량: 100+ 신호
- 시스템 가동률: 99%+
- API 응답 시간: < 5초
- 텔레그램 전송: < 10초

## 🔐 보안

- 환경 변수로 민감 정보 관리
- Firebase Admin SDK 서비스 계정 사용
- API 키 순환 정책
- 입력 데이터 검증 및 새니타이징

## 📚 API 문서

자세한 API 문서는 `docs/` 디렉토리를 참조하세요.

## 🤝 기여

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 라이센스

MIT License - 자세한 내용은 LICENSE 파일을 참조하세요.