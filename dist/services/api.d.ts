export declare const TRADING_SYMBOLS: string[];
export declare const getDataSource: (symbol: string) => "metaapi" | "binance";
export interface CandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface ChartDataResponse {
    success: boolean;
    symbol: string;
    timeframe: string;
    candles: CandleData[];
    marketInfo?: any;
    source: string;
}
export interface AccountInfo {
    success: boolean;
    account: {
        balance: number;
        equity: number;
        margin: number;
        freeMargin: number;
        marginLevel: number;
        currency: string;
        server: string;
    };
    source: string;
    account_number?: string;
    broker?: string;
}
export interface Position {
    id: string;
    symbol: string;
    type: string;
    lots: number;
    price: number;
    profit: number;
    profitPercent: number;
    status: string;
}
export interface AIResponse {
    success: boolean;
    response: string;
    tradeSuggestion?: any;
    analysis?: any;
    timestamp: string;
}
declare class ApiService {
    private axios;
    getChartData(symbol: string, timeframe?: string, count?: number): Promise<ChartDataResponse>;
    getAccountInfo(): Promise<AccountInfo>;
    getPositions(userId?: string): Promise<Position[]>;
    sendAIMessage(message: string, context?: any): Promise<AIResponse>;
    executeOrder(orderData: {
        symbol: string;
        action: 'BUY' | 'SELL';
        volume: number;
        type?: string;
        userId?: string;
    }): Promise<any>;
    getCurrentMarketData(): Promise<unknown>;
    createWebSocket(onMessage: (data: any) => void): WebSocket;
}
export declare const apiService: ApiService;
export default apiService;
