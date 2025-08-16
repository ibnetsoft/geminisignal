# 🎯 NP Signal ChatGPT 이중 시스템 설정 가이드

어드민이 ChatGPT 유저 응대를 학습시킬 수 있는 완전한 시스템이 구축되었습니다.

## 🚀 시스템 구조

### 1. **거래용 ChatGPT** (포트 3001)
- **용도**: MetaAPI를 통한 실제 거래 실행
- **서버**: `chatgpt-trader.js`
- **주소**: http://localhost:3001

### 2. **고객 응대용 ChatGPT** (포트 3002)
- **용도**: 유저 상담, 경고, 고객 서비스
- **서버**: `admin-api-server.js`
- **어드민 대시보드**: http://localhost:3002/admin

## 📋 설정 단계

### Step 1: 서버 시작
```bash
# 터미널 1: 거래용 ChatGPT 서버
node chatgpt-trader.js

# 터미널 2: 어드민 & 고객 응대 서버  
node admin-api-server.js
```

### Step 2: 어드민 대시보드 접속
브라우저에서 http://localhost:3002/admin 접속

### Step 3: API 키 설정
1. **거래용 API 키**: MetaAPI 거래 전용 ChatGPT API 키 입력
2. **고객 응대용 API 키**: 유저 상담 전용 ChatGPT API 키 입력
3. **저장 및 연결 테스트** 클릭

### Step 4: 응대 스타일 학습
1. **응대 톤 선택**: 친근한/전문적인/공식적인/캐주얼
2. **기본 인사말** 설정
3. **기본 마무리 멘트** 설정

### Step 5: 경고 메시지 템플릿 설정
- 리스크 경고 메시지
- 거래 한도 초과 알림
- 시장 변동성 경고
- FAQ 응답 가이드

### Step 6: 실시간 테스트
어드민 대시보드에서 다양한 시나리오로 ChatGPT 응답 테스트

## 🔧 사용법

### 어드민 (당신)이 할 일:
1. **API 키 관리**: 별도의 ChatGPT API 키 2개 발급
2. **응대 학습**: 고객 서비스 스타일, 경고 메시지 템플릿 작성
3. **실시간 모니터링**: 응답 품질 확인 및 개선

### 유저들이 사용할 API:
```javascript
// 고객 응대 ChatGPT 호출
POST http://localhost:3002/api/customer/chat
{
  "message": "계정 인증은 어떻게 하나요?",
  "userId": "user123",
  "context": "account_verification"
}
```

### 거래용 ChatGPT 호출:
```javascript
// 거래 실행
POST http://localhost:3001/api/buy
{
  "symbol": "BTCUSD",
  "volume": 0.1,
  "comment": "ChatGPT 거래"
}
```

## 🎯 주요 기능

### ✅ 완료된 기능:
1. **이중 API 키 시스템** - 거래용/고객응대용 분리
2. **암호화 저장** - API 키 안전한 저장
3. **어드민 학습 인터페이스** - 응대 스타일 및 템플릿 관리
4. **실시간 테스트** - ChatGPT 응답 즉석 확인
5. **자동 설정 적용** - 학습 내용이 실제 응답에 즉시 반영

### 🔐 보안 기능:
- API 키 AES-256 암호화
- 설정 파일 별도 디렉토리 저장
- 역할 기반 접근 제어 준비

### 📊 모니터링:
- 고객 응대 로그
- API 호출 추적
- 응답 품질 분석

## 🎉 테스트 시나리오

어드민 대시보드에서 다음을 테스트해보세요:

1. **신규 유저 인사**: "안녕하세요, 처음 가입했는데 어떻게 시작하나요?"
2. **거래 리스크 경고**: "비트코인 100만원어치 사고 싶어요"
3. **계정 문제**: "로그인이 안 되는데 도와주세요"
4. **출금 문의**: "출금이 언제 처리되나요?"
5. **기술적 문제**: "차트가 안 보여요"

각 시나리오에 맞는 응답이 학습된 스타일로 제공됩니다!

## 📁 파일 구조
```
NP_signal/
├── chatgpt-trader.js          # 거래용 ChatGPT 서버
├── admin-api-server.js        # 어드민 & 고객응대 서버
├── admin-dashboard.html       # 어드민 대시보드 UI
├── .admin-settings/           # 암호화된 설정 저장소
│   ├── api-keys.json         # API 키 (암호화)
│   ├── response-style.json   # 응대 스타일
│   └── templates.json        # 메시지 템플릿
└── setup-guide.md            # 이 가이드
```

이제 **어드민이 ChatGPT 고객 응대를 완전히 학습시킬 수 있는 시스템**이 완성되었습니다! 🎉