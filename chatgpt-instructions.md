# ChatGPT Trading Instructions

ChatGPT가 MetaAPI를 통해 실제 거래를 할 수 있는 완전한 시스템입니다.

## 🚀 서버 시작

```bash
cd C:\Users\kimse\Downloads\NP_signal
node chatgpt-trader.js
```

서버 주소: `http://localhost:3001`

## 🤖 ChatGPT에게 제공할 정보

ChatGPT에게 다음과 같이 설명해주세요:

```
당신은 실제 거래가 가능한 MetaAPI 시스템에 연결되었습니다.
서버 주소: http://localhost:3001

계정 정보:
- 브로커: XM Global
- 계정: 308592422
- 통화: USD
- 현재 잔고: 약 $50,000

사용 가능한 API:
1. GET /api/account - 계정 상태 및 포지션 조회
2. GET /api/price/{symbol} - 심볼 가격 조회 (예: /api/price/BTCUSD)
3. GET /api/symbols - 거래 가능한 심볼 목록
4. POST /api/buy - 매수 주문
5. POST /api/sell - 매도 주문  
6. POST /api/close - 포지션 청산

거래 예시:
매수: POST /api/buy {"symbol": "BTCUSD", "volume": 0.1, "comment": "ChatGPT trade"}
매도: POST /api/sell {"symbol": "EURUSD", "volume": 0.01, "comment": "ChatGPT trade"}
청산: POST /api/close {"symbol": "BTCUSD"}

주의사항:
- 실제 돈이 투자되는 라이브 계정입니다
- 거래 전 반드시 가격을 확인하세요
- 적당한 사이즈로 거래하세요 (0.01-0.1 lot 권장)
- 주말에는 BTCUSD만 거래 가능합니다
```

## 📋 주요 거래 심볼

**암호화폐 (24/7)**:
- BTCUSD: 비트코인/달러

**외환 (평일만)**:
- EURUSD: 유로/달러
- GBPUSD: 파운드/달러
- USDJPY: 달러/엔
- AUDUSD: 호주달러/달러

**원자재 (평일만)**:
- XAUUSD: 금/달러
- USOUSD: 원유/달러

**지수 (평일만)**:
- NAS100: 나스닥 100

## 🔧 API 사용법

### 1. 계정 상태 확인
```
GET http://localhost:3001/api/account
```

### 2. 가격 조회
```
GET http://localhost:3001/api/price/BTCUSD
```

### 3. 매수 주문
```
POST http://localhost:3001/api/buy
Content-Type: application/json

{
  "symbol": "BTCUSD",
  "volume": 0.1,
  "comment": "ChatGPT 매수"
}
```

### 4. 매도 주문
```
POST http://localhost:3001/api/sell
Content-Type: application/json

{
  "symbol": "BTCUSD", 
  "volume": 0.1,
  "comment": "ChatGPT 매도"
}
```

### 5. 포지션 청산
```
POST http://localhost:3001/api/close
Content-Type: application/json

{
  "symbol": "BTCUSD"
}
```

## ⚠️ 주의사항

1. **실제 거래**: 라이브 계정이므로 실제 돈이 움직입니다
2. **적정 사이즈**: 0.01-0.1 lot으로 거래하세요
3. **시장 시간**: 주말에는 BTCUSD만 가능
4. **리스크 관리**: 큰 손실 방지를 위해 작은 사이즈로 시작

## 🎯 ChatGPT 테스트 예시

ChatGPT에게 다음과 같이 요청해보세요:

1. "현재 계정 상태를 확인해줘"
2. "BTCUSD 현재 가격을 알려줘"  
3. "BTCUSD 0.01 lot 매수해줘"
4. "현재 포지션을 확인해줘"
5. "모든 BTCUSD 포지션을 청산해줘"

이제 ChatGPT가 실제로 거래를 실행할 수 있습니다!