import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// 메인 React 어플리케이션 - 실제 MetaAPI/Binance 데이터 사용
import { useState, useEffect } from 'react';
import TradingChart from './components/TradingChart';
import AIChat from './components/AIChat';
import AccountInfo from './components/AccountInfo';
import { apiService, TRADING_SYMBOLS } from './services/api';
const App = () => {
    // 상태 관리
    const [selectedSymbol, setSelectedSymbol] = useState(TRADING_SYMBOLS[0]); // EURUSD
    const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
    const [marketData, setMarketData] = useState({});
    const [positions, setPositions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    // WebSocket 연결
    useEffect(() => {
        console.log('🚀 React 어플리케이션 시작 - 실제 데이터 연동');
        const ws = apiService.createWebSocket((data) => {
            handleWebSocketMessage(data);
        });
        return () => {
            ws.close();
        };
    }, []);
    // WebSocket 메시지 처리
    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'price_tick':
                setMarketData(prev => ({
                    ...prev,
                    [data.symbol]: {
                        price: data.price,
                        change: prev[data.symbol]?.change || 0,
                        changePercent: prev[data.symbol]?.changePercent || 0,
                    }
                }));
                break;
            case 'signal_alert':
                addNotification(`🚨 신호 알림: ${data.signal.symbol} ${data.signal.type} (신뢰도: ${data.signal.confidence}%)`);
                break;
            case 'position_update':
                if (data.action === 'new_position') {
                    setPositions(prev => [...prev, data.position]);
                    addNotification(`✅ 새 포지션: ${data.position.symbol} ${data.position.type}`);
                }
                break;
            default:
                console.log('📡 WebSocket 메시지:', data);
        }
    };
    // 알림 추가
    const addNotification = (message) => {
        setNotifications(prev => [message, ...prev.slice(0, 4)]); // 최대 5개
        // 5초 후 자동 제거
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n !== message));
        }, 5000);
    };
    // 거래 실행
    const handleTradeAction = async (action, symbol) => {
        try {
            console.log(`🎯 거래 실행 요청: ${symbol} ${action}`);
            await apiService.executeOrder({
                symbol,
                action,
                volume: 0.1, // 기본 0.1 Lot
                userId: 'user_001'
            });
            addNotification(`✅ 거래 실행: ${symbol} ${action} 0.1 Lot`);
        }
        catch (error) {
            console.error('❌ 거래 실행 실패:', error.message);
            addNotification(`❌ 거래 실패: ${error.message}`);
        }
    };
    // 포지션 업데이트
    const handlePositionUpdate = (newPositions) => {
        setPositions(newPositions);
    };
    // 현재 가격 업데이트
    const handlePriceUpdate = (price) => {
        setMarketData(prev => ({
            ...prev,
            [selectedSymbol]: {
                ...prev[selectedSymbol],
                price
            }
        }));
    };
    // 스타일
    const appStyle = {
        minHeight: '100vh',
        backgroundColor: '#0f1419',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };
    const headerStyle = {
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderBottom: '2px solid #333',
    };
    const mainContentStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '20px',
        padding: '20px',
        minHeight: 'calc(100vh - 120px)',
    };
    const leftPanelStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    };
    const rightPanelStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    };
    const symbolTabsStyle = {
        display: 'flex',
        gap: '5px',
        marginBottom: '15px',
        flexWrap: 'wrap',
    };
    const tabStyle = (isActive) => ({
        padding: '8px 12px',
        backgroundColor: isActive ? '#007acc' : '#2a2a2a',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: isActive ? 'bold' : 'normal',
    });
    const timeframeStyle = {
        display: 'flex',
        gap: '5px',
        marginBottom: '10px',
    };
    const notificationStyle = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        maxWidth: '400px',
    };
    const notificationItemStyle = {
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '5px',
        fontSize: '14px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    };
    const priceDisplayStyle = {
        fontSize: '14px',
        color: '#00ff88',
        fontWeight: 'bold',
    };
    return (_jsxs("div", { style: appStyle, children: [_jsxs("header", { style: headerStyle, children: [_jsx("h1", { style: { margin: 0, fontSize: '24px', color: '#00ff88' }, children: "\uD83E\uDD16 NP Signal AI Trading Platform (React)" }), _jsx("div", { style: { fontSize: '14px', color: '#888', marginTop: '5px' }, children: "\uC2E4\uC2DC\uAC04 MetaAPI & Binance \uB370\uC774\uD130 \uC5F0\uB3D9 | Nautilus Trader \uBD84\uC11D | OpenAI GPT-4" })] }), _jsxs("main", { style: mainContentStyle, children: [_jsxs("div", { style: leftPanelStyle, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: '0 0 10px 0', fontSize: '16px' }, children: "\uD83D\uDCCA \uAC70\uB798 \uC885\uBAA9 (9\uAC1C \uACE0\uC815)" }), _jsx("div", { style: symbolTabsStyle, children: TRADING_SYMBOLS.map((symbol, index) => (_jsxs("button", { onClick: () => setSelectedSymbol(symbol), style: tabStyle(selectedSymbol === symbol), children: [index + 1, ". ", symbol, marketData[symbol] && (_jsx("div", { style: priceDisplayStyle, children: marketData[symbol].price.toFixed(5) }))] }, symbol))) }), _jsx("div", { style: timeframeStyle, children: ['1H', '4H', '1D'].map(tf => (_jsx("button", { onClick: () => setSelectedTimeframe(tf), style: tabStyle(selectedTimeframe === tf), children: tf }, tf))) }), _jsxs("div", { style: {
                                            backgroundColor: '#2a2a2a',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            marginBottom: '10px',
                                            fontSize: '14px',
                                        }, children: [_jsx("strong", { children: selectedSymbol }), " - ", selectedTimeframe, marketData[selectedSymbol] && (_jsxs("span", { style: { marginLeft: '10px', color: '#00ff88' }, children: ["\uD604\uC7AC\uAC00: ", marketData[selectedSymbol].price.toFixed(5)] })), _jsxs("div", { style: { fontSize: '12px', color: '#888', marginTop: '5px' }, children: ["\uB370\uC774\uD130 \uC18C\uC2A4: ", ['BTCUSD', 'ETHUSD', 'XRPUSD', 'SOLUSD'].includes(selectedSymbol) ? 'Binance API' : 'MetaAPI'] })] })] }), _jsx(TradingChart, { symbol: selectedSymbol, timeframe: selectedTimeframe, onPriceUpdate: handlePriceUpdate }), _jsxs("div", { style: {
                                    display: 'flex',
                                    gap: '10px',
                                    justifyContent: 'center',
                                    marginTop: '10px',
                                }, children: [_jsx("button", { onClick: () => handleTradeAction('BUY', selectedSymbol), style: {
                                            padding: '10px 20px',
                                            backgroundColor: '#00ff88',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                        }, children: "\uD83D\uDFE2 \uB9E4\uC218 (0.1 Lot)" }), _jsx("button", { onClick: () => handleTradeAction('SELL', selectedSymbol), style: {
                                            padding: '10px 20px',
                                            backgroundColor: '#ff4757',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                        }, children: "\uD83D\uDD34 \uB9E4\uB3C4 (0.1 Lot)" })] })] }), _jsxs("div", { style: rightPanelStyle, children: [_jsx(AIChat, { currentSymbol: selectedSymbol, currentPrice: marketData[selectedSymbol]?.price, onTradeAction: handleTradeAction }), _jsx(AccountInfo, { onPositionUpdate: handlePositionUpdate })] })] }), notifications.length > 0 && (_jsx("div", { style: notificationStyle, children: notifications.map((notification, index) => (_jsx("div", { style: notificationItemStyle, children: notification }, index))) }))] }));
};
export default App;
