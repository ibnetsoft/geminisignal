# Signal Processor Deployment Guide

External Signal Processor 배포 가이드입니다.

## 🚀 배포 방법

### 1. GitHub Actions 자동 배포 (권장)

#### 필수 설정
1. **GitHub Secrets 설정**
   - `GCP_SA_KEY`: Firebase 서비스 계정 JSON 키
   - `GOOGLE_API_KEY`: Google Gemini API 키
   - `TELEGRAM_BOT_TOKEN`: 텔레그램 봇 토큰
   - `TELEGRAM_CHAT_ID`: 텔레그램 채팅 ID
   - `ALPHA_VANTAGE_API_KEY`: Alpha Vantage API 키
   - `NEWS_API_KEY`: News API 키

2. **배포 실행**
   ```bash
   git push origin main  # 자동 배포 트리거
   ```
   또는 GitHub Actions 탭에서 수동 실행

#### 배포 과정
1. 코드 체크아웃
2. Node.js 환경 설정
3. 의존성 설치 및 빌드
4. Google Cloud 인증
5. Docker 이미지 빌드 및 푸시
6. Cloud Run 서비스 배포
7. 헬스체크 실행

### 2. 로컬에서 수동 배포

#### 전제 조건
- Google Cloud SDK 설치
- Docker 설치
- gcloud 인증 완료

#### 배포 스크립트 실행
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Docker 컨테이너로 로컬 실행

```bash
# 이미지 빌드
docker build -t signal-processor .

# 컨테이너 실행
docker run -d \
  --name signal-processor \
  --env-file .env \
  -p 8080:8080 \
  signal-processor
```

## 🔧 환경 설정

### 필수 환경변수

```bash
# Firebase 설정
FIREBASE_PROJECT_ID=pipmaker-signals
GOOGLE_APPLICATION_CREDENTIALS=./config/firebase-service-account.json

# Google Gemini AI
GOOGLE_API_KEY=your_google_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# News API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
NEWS_API_KEY=your_news_api_key

# 환경 설정
NODE_ENV=production
LOG_LEVEL=info

# 처리 설정
MAX_CONCURRENT_SIGNALS=5
SIGNAL_PROCESSING_TIMEOUT=30000
NEWS_FETCH_TIMEOUT=5000
AI_ANALYSIS_TIMEOUT=20000
TELEGRAM_SEND_TIMEOUT=10000
```

## 📊 모니터링

### 서비스 상태 확인

```bash
# 헬스체크
curl https://your-service-url/health

# 상태 정보
curl https://your-service-url/status

# 로그 확인
gcloud logs tail /projects/pipmaker-signals/logs/cloudrun.googleapis.com%2Fstderr
```

### 주요 메트릭
- 신호 처리 지연시간
- AI 분석 성공률
- 텔레그램 전송 성공률
- 뉴스 API 응답시간
- 에러율 및 재시도 횟수

## 🔄 업데이트 및 롤백

### 업데이트
```bash
git push origin main  # 자동 배포
```

### 롤백
```bash
# 이전 리비전으로 롤백
gcloud run services update-traffic external-signal-processor \
  --to-revisions=REVISION_NAME=100 \
  --region asia-northeast3
```

## 🛠️ 트러블슈팅

### 일반적인 문제

1. **환경변수 누락**
   - GitHub Secrets 확인
   - .env 파일 검증

2. **Firebase 인증 실패**
   - 서비스 계정 키 확인
   - 프로젝트 ID 검증

3. **API 한도 초과**
   - Gemini API 할당량 확인
   - News API 요청 수 모니터링

4. **메모리 부족**
   - Cloud Run 메모리 할당 증가
   - 동시 처리 신호 수 조정

### 로그 분석

```bash
# 실시간 로그
gcloud logs tail /projects/pipmaker-signals/logs/cloudrun.googleapis.com%2Fstderr

# 에러 로그 필터링
gcloud logs read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 50 \
  --format json
```

## 📝 배포 체크리스트

- [ ] GitHub Secrets 설정 완료
- [ ] Firebase 서비스 계정 키 업로드
- [ ] 모든 API 키 유효성 확인
- [ ] 로컬 테스트 완료
- [ ] 배포 후 헬스체크 성공
- [ ] 텔레그램 알림 수신 확인
- [ ] 신호 처리 테스트 완료
- [ ] 모니터링 대시보드 설정

## 🔒 보안 고려사항

1. **API 키 보안**
   - GitHub Secrets 사용
   - 로그에 API 키 노출 방지

2. **네트워크 보안**
   - HTTPS 통신 강제
   - 인증된 요청만 허용

3. **컨테이너 보안**
   - 비루트 사용자 실행
   - 최소 권한 원칙

4. **Firebase 보안**
   - Firestore 규칙 검토
   - 서비스 계정 권한 최소화

## 📞 지원

문제 발생 시:
1. 로그 확인 및 분석
2. GitHub Issues 등록
3. 텔레그램을 통한 즉시 알림 확인