// API 서비스 - 실제 MetaAPI/Binance 데이터 연동
import axios from 'axios';
const API_BASE_URL = 'http://localhost:3007';
// 9개 고정 종목 (사용자 요구사항)
export const TRADING_SYMBOLS = [
    'EURUSD', // 1. 유로달러
    'XAUUSD', // 2. 금
    'USOUSD', // 3. 원유 (WTI)
    'NAS100', // 4. 나스닥 100
    'HKG33', // 5. 항셍 33
    'BTCUSD', // 6. 비트코인
    'ETHUSD', // 7. 이더리움
    'XRPUSD', // 8. 리플
    'SOLUSD' // 9. 솔라나
];
// 데이터 소스 결정 (사용자 요구사항: 1-5번은 MetaAPI, 6-9번은 Binance)
export const getDataSource = (symbol) => {
    if (['BTCUSD', 'ETHUSD', 'XRPUSD', 'SOLUSD'].includes(symbol)) {
        return 'binance';
    }
    return 'metaapi';
};
// API 클래스
class ApiService {
    constructor() {
        this.axios = axios.create({
            baseURL: API_BASE_URL,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    // 실제 차트 데이터 가져오기 (MetaAPI/Binance)
    async getChartData(symbol, timeframe = '1H', count = 100) {
        try {
            const dataSource = getDataSource(symbol);
            console.log(`📊 실제 데이터 요청: ${symbol} from ${dataSource}`);
            // 실제 데이터 소스에 따라 API 엔드포인트 결정
            const apiEndpoint = dataSource === 'binance' ? '/api/okx/chart-data' : '/api/metaapi/chart-data';
            const response = await this.axios.post(apiEndpoint, {
                symbol,
                timeframe,
                count
            });
            if (response.data.success) {
                console.log(`✅ ${symbol} 실제 데이터 로드 성공 (${dataSource})`);
                return response.data;
            }
            else {
                throw new Error(`차트 데이터 로드 실패: ${response.data.error}`);
            }
        }
        catch (error) {
            console.error(`❌ ${symbol} 차트 데이터 오류:`, error.message);
            throw error;
        }
    }
    // 실제 MetaAPI 계정 정보 조회
    async getAccountInfo() {
        try {
            console.log('📋 실제 MetaAPI 계정 정보 조회...');
            const response = await this.axios.get('/api/account/info');
            if (response.data.success) {
                console.log('✅ MetaAPI 계정 정보 로드 성공');
                return response.data;
            }
            else {
                throw new Error('계정 정보 조회 실패');
            }
        }
        catch (error) {
            console.error('❌ MetaAPI 계정 정보 오류:', error.message);
            throw error;
        }
    }
    // 현재 포지션 조회
    async getPositions(userId = 'user_001') {
        try {
            const response = await this.axios.get(`/api/positions/${userId}`);
            return response.data.positions || [];
        }
        catch (error) {
            console.error('❌ 포지션 조회 오류:', error.message);
            return [];
        }
    }
    // AI 채팅
    async sendAIMessage(message, context = {}) {
        try {
            console.log('🤖 AI 채팅 요청:', message.substring(0, 50) + '...');
            const response = await this.axios.post('/api/ai-chat/enhanced', {
                message,
                mode: 'trading',
                userId: 'user_001',
                context
            });
            if (response.data.success) {
                console.log('✅ AI 응답 수신');
                return response.data;
            }
            else {
                throw new Error('AI 응답 생성 실패');
            }
        }
        catch (error) {
            console.error('❌ AI 채팅 오류:', error.message);
            throw error;
        }
    }
    // 거래 실행
    async executeOrder(orderData) {
        try {
            console.log(`🎯 거래 실행: ${orderData.symbol} ${orderData.action} ${orderData.volume}`);
            const response = await this.axios.post('/api/trading/execute-order', {
                ...orderData,
                userId: orderData.userId || 'user_001',
                source: 'react_interface'
            });
            if (response.data.success) {
                console.log('✅ 거래 실행 성공');
                return response.data.result || response.data;
            }
            else {
                throw new Error(response.data.error);
            }
        }
        catch (error) {
            console.error('❌ 거래 실행 오류:', error.message);
            throw error;
        }
    }
    // 현재 시장 데이터 조회
    async getCurrentMarketData() {
        try {
            const response = await this.axios.get('/api/market/current-data');
            return response.data;
        }
        catch (error) {
            console.error('❌ 시장 데이터 오류:', error.message);
            throw error;
        }
    }
    // WebSocket 연결 생성
    createWebSocket(onMessage) {
        const ws = new WebSocket('ws://localhost:3007/ws/live-data');
        ws.onopen = () => {
            console.log('📡 WebSocket 연결 성공');
            // 9개 고정 종목 구독
            ws.send(JSON.stringify({
                type: 'subscribe',
                symbols: TRADING_SYMBOLS,
                dataTypes: ['price', 'signal', 'position']
            }));
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            }
            catch (error) {
                console.error('WebSocket 메시지 파싱 오류:', error);
            }
        };
        ws.onerror = (error) => {
            console.error('WebSocket 오류:', error);
        };
        ws.onclose = () => {
            console.log('📡 WebSocket 연결 종료');
        };
        return ws;
    }
}
export const apiService = new ApiService();
export default apiService;
