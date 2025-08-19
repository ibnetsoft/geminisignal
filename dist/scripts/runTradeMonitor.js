"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/runTradeMonitor.ts
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseService_1 = require("../services/services/firebaseService");
const geminiService_1 = __importDefault(require("../services/services/external/geminiService"));
// MetaAPI SDK 임포트
const MetaApi = require('metaapi.cloud-sdk').default;
dotenv_1.default.config({ path: '.env' });
let geminiService;
let metaApi;
async function initializeServices() {
    try {
        console.log('🔧 거래 모니터링 서비스 초기화 시작...');
        await firebaseService_1.firebaseService.initialize();
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey)
            throw new Error('GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.');
        geminiService = new geminiService_1.default(geminiApiKey);
        const metaApiToken = process.env.METAAPI_TOKEN;
        if (!metaApiToken)
            throw new Error('METAAPI_TOKEN이 환경변수에 설정되지 않았습니다.');
        metaApi = new MetaApi(metaApiToken);
        console.log('✅ 모든 서비스 초기화 완료');
    }
    catch (error) {
        console.error('❌ 서비스 초기화 실패:', error);
        process.exit(1);
    }
}
async function monitorAndManageTrades() {
    await initializeServices();
    console.log('🚀 거래 모니터링 및 관리 시작...');
    try {
        // 1. 활성화된 거래 계정 조회
        const accountsSnapshot = await firebaseService_1.firebaseService.getFirestore().collection('trading_accounts')
            .where('active', '==', true)
            .where('ai_trading_enabled', '==', true)
            .get();
        if (accountsSnapshot.empty) {
            console.log('⚠️ 모니터링할 활성 거래 계정이 없습니다.');
            return;
        }
        // 2. 각 계정의 열린 포지션 확인
        for (const accountDoc of accountsSnapshot.docs) {
            const accountId = accountDoc.id;
            const account = await metaApi.metatraderAccountApi.getAccount(accountId);
            const connection = account.getRPCConnection();
            await connection.connect();
            await connection.waitSynchronized();
            const openPositions = await connection.getPositions();
            console.log(`🔍 계정 [${accountId}]에서 ${openPositions.length}개의 열린 포지션 확인.`);
            if (openPositions.length === 0) {
                continue;
            }
            // 3. 각 포지션에 대해 AI 청산 분석 요청
            for (const position of openPositions) {
                console.log(`
--- 포지션 분석 시작: ${position.symbol} ${position.type} ---
        
        // AI 분석을 위한 컨텍스트 준비 (여기서는 간단한 예시)
        const marketContext = {
          newsSummary: "시장 데이터 요약 로직 필요",
          taSummary: "기술적 분석 요약 로직 필요"
        };

        const analysis = await geminiService.analyzeOpenPosition(position, marketContext);
        console.log(`, AI, 판단, [$, { analysis, : .decision }] - 이유, $, { analysis, : .reasoning } `);
        
        if (analysis.decision.startsWith('CLOSE')) {
          console.log(`, 포지션[$], { position, : .id }, 청산을, 시도합니다. `);
          
          // 청산을 위한 역방향 거래 신호 생성
          const closeSignal = {
            original_signal_id: `, close - $, { position, : .id } `,
            symbol: position.symbol,
            action: position.type === 'POSITION_TYPE_BUY' ? 'sell' : 'buy',
            volume: position.volume,
            // 청산은 시장가로 즉시 실행
            confidence: 1.0, 
            reasoning: `, AI, decision, to, $, { analysis, : .decision }, $, { analysis, : .reasoning } `,
            risk_level: 'low',
            from_ai: true,
          };

          // trading.ts의 거래 실행 함수를 재사용하여 포지션 청산
          // 실제 환경에서는 아래 주석을 해제해야 합니다.
          // await processAITradingSignal(closeSignal);

          // --- Firestore 거래 결과 업데이트 로직 ---
          console.log(`, Firestore에서[positionId], $, { position, : .id }, 에, 해당하는, 거래, 기록을, 찾아, 업데이트합니다. `);
          const tradeQuery = await firebaseService.getFirestore().collection('trade_executions')
            .where('positionIds', 'array-contains', position.id)
            .limit(1)
            .get();

          if (!tradeQuery.empty) {
            const tradeDocRef = tradeQuery.docs[0].ref;
            await tradeDocRef.update({
              'outcome.status': 'CLOSED',
              'outcome.pnl': position.unrealizedProfit, // 청산 시점의 미실현 손익을 최종 P/L로 기록
              'outcome.closedBy': 'AI_DECISION',
              'outcome.closeReasoning': analysis.reasoning,
              'outcome.closedAt': new Date(),
            });
            console.log(`, Firestore, 문서[$], { tradeDocRef, : .id }, 의, 거래, 결과를, 성공적으로, 업데이트했습니다. `);
          } else {
            console.warn(`, Firestore에서, positionId[$], { position, : .id }, 에, 해당하는, 거래를, 찾지, 못했습니다. `);
          }
          // --- 로직 끝 ---

        } else if (analysis.decision === 'ADJUST_SL') {
            console.log(`, 손절, 라인, 조정을, 시도합니다.New, SL, $, { analysis, : .newStopLoss } `);
            // TODO: MetaAPI를 통해 실제 주문의 SL을 수정하는 로직 구현 필요
            // await connection.modifyPosition(position.id, { stopLoss: analysis.newStopLoss });
            console.log(`, 손절, 라인, 조정, 완료(시뮬레이션). `);
        } else {
          console.log(`, 포지션을, 계속, 유지합니다. `);
        }
      }
      await connection.close();
    }

  } catch (error) {
    console.error('❌ 거래 모니터링 중 오류 발생:', error);
  } finally {
    console.log('
🏁 거래 모니터링 사이클 종료.
');
  }
}

// 스크립트 실행
monitorAndManageTrades();
`);
                // TODO: GeminiService에 analyzeOpenPosition 메소드 구현 필요
                // const analysisResult = await geminiService.analyzeOpenPosition(position);
                // 임시 로직: AI가 'CLOSE'를 결정했다고 가정
                const decision = 'CLOSE_PROFIT'; // 또는 'HOLD_POSITION' 등
                if (decision.startsWith('CLOSE')) {
                    console.log(`🤖 AI 판단: [${decision}]. 포지션 청산을 시도합니다.`);
                    // 청산을 위한 역방향 거래 신호 생성
                    const closeSignal = {
                        original_signal_id: `close-${position.id}`,
                        symbol: position.symbol,
                        action: position.type === 'POSITION_TYPE_BUY' ? 'sell' : 'buy',
                        volume: position.volume,
                        price: position.currentPrice,
                        confidence: 1.0, // 청산 결정은 신뢰도 100%
                        reasoning: `AI decision to ${decision}`,
                        risk_level: 'low', // 청산이므로 리스크는 낮음
                        from_ai: true,
                    };
                    // trading.ts의 거래 실행 함수를 재사용하여 포지션 청산
                    // await processAITradingSignal(closeSignal);
                    // TODO: 청산 후 Firestore의 trade_executions 문서 업데이트 로직 필요
                    console.log(`✅ 포지션 [${position.id}] 청산 완료 (시뮬레이션).`);
                }
                else {
                    console.log(`🤖 AI 판단: [${decision}]. 포지션을 계속 유지합니다.`);
                }
            }
            await connection.close();
        }
    }
    catch (error) {
        console.error('❌ 거래 모니터링 중 오류 발생:', error);
    }
    finally {
        console.log('\n🏁 거래 모니터링 사이클 종료.\n');
    }
}
// 스크립트 실행
monitorAndManageTrades();
