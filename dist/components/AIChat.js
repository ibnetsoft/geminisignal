import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// AI 채팅 컴포넌트 (실제 OpenAI API 연동)
import { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
const AIChat = ({ currentSymbol, currentPrice, onTradeAction }) => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            type: 'ai',
            content: '안녕하세요! NP Signal AI 트레이딩 어시스턴트입니다. 실시간 MetaAPI와 Binance 데이터를 분석하여 거래 조언을 드릴 수 있습니다.',
            timestamp: new Date(),
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    // 메시지 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // AI 메시지 전송
    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading)
            return;
        const userMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        try {
            console.log('🤖 AI에게 메시지 전송:', inputMessage);
            // 실제 AI API 호출
            const response = await apiService.sendAIMessage(inputMessage, {
                currentSymbol,
                currentPrice,
                timestamp: new Date().toISOString(),
                interface: 'react_frontend'
            });
            if (response.success) {
                const aiMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'ai',
                    content: response.response,
                    timestamp: new Date(),
                    tradeSuggestion: response.tradeSuggestion,
                    analysis: response.analysis,
                };
                setMessages(prev => [...prev, aiMessage]);
                console.log('✅ AI 응답 수신 완료');
            }
            else {
                throw new Error('AI 응답 생성 실패');
            }
        }
        catch (error) {
            console.error('❌ AI 채팅 오류:', error.message);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: '죄송합니다. 현재 AI 서비스에 문제가 있습니다. 잠시 후 다시 시도해 주세요.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    };
    // 거래 제안 실행
    const executeTradeSuggestion = (suggestion) => {
        if (onTradeAction && suggestion) {
            onTradeAction(suggestion.action, suggestion.symbol);
        }
    };
    // Enter 키 처리
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    // 스타일
    const containerStyle = {
        height: '500px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
    };
    const headerStyle = {
        padding: '15px',
        borderBottom: '1px solid #333',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px 8px 0 0',
    };
    const messagesStyle = {
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
    };
    const inputContainerStyle = {
        padding: '15px',
        borderTop: '1px solid #333',
        backgroundColor: '#2a2a2a',
        borderRadius: '0 0 8px 8px',
    };
    const messageStyle = (type) => ({
        marginBottom: '15px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: type === 'user' ? '#007acc' : '#333',
        color: '#ffffff',
        alignSelf: type === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginLeft: type === 'user' ? 'auto' : '0',
        marginRight: type === 'user' ? '0' : 'auto',
    });
    const inputStyle = {
        width: '100%',
        padding: '10px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #555',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '14px',
        resize: 'none',
    };
    const buttonStyle = {
        marginTop: '10px',
        padding: '8px 16px',
        backgroundColor: isLoading ? '#555' : '#007acc',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
    };
    const tradeSuggestionStyle = {
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#2a4a2a',
        borderRadius: '6px',
        border: '1px solid #4a8a4a',
    };
    return (_jsxs("div", { style: containerStyle, children: [_jsxs("div", { style: headerStyle, children: [_jsx("h3", { style: { margin: 0, color: '#ffffff', fontSize: '16px' }, children: "\uD83E\uDD16 AI \uD2B8\uB808\uC774\uB529 \uC5B4\uC2DC\uC2A4\uD134\uD2B8" }), _jsxs("div", { style: { fontSize: '12px', color: '#888', marginTop: '5px' }, children: ["\uD604\uC7AC \uC885\uBAA9: ", currentSymbol, " ", currentPrice && `(${currentPrice.toFixed(5)})`] })] }), _jsxs("div", { style: messagesStyle, children: [messages.map((message) => (_jsx("div", { style: { display: 'flex', flexDirection: 'column' }, children: _jsxs("div", { style: messageStyle(message.type), children: [_jsxs("div", { style: { fontSize: '12px', opacity: 0.7, marginBottom: '5px' }, children: [message.type === 'user' ? '👤 나' : '🤖 AI', " - ", message.timestamp.toLocaleTimeString('ko-KR')] }), _jsx("div", { style: { whiteSpace: 'pre-wrap' }, children: message.content }), message.tradeSuggestion && (_jsxs("div", { style: tradeSuggestionStyle, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '5px' }, children: "\uD83D\uDCC8 \uAC70\uB798 \uC81C\uC548" }), _jsxs("div", { children: ["\uC885\uBAA9: ", message.tradeSuggestion.symbol, _jsx("br", {}), "\uBC29\uD5A5: ", message.tradeSuggestion.action, _jsx("br", {}), "\uC218\uB7C9: ", message.tradeSuggestion.lots, " Lot", _jsx("br", {}), "\uC2E0\uB8B0\uB3C4: ", message.tradeSuggestion.confidence, "%", _jsx("br", {}), "\uC774\uC720: ", message.tradeSuggestion.reason] }), _jsx("button", { onClick: () => executeTradeSuggestion(message.tradeSuggestion), style: {
                                                marginTop: '8px',
                                                padding: '5px 10px',
                                                backgroundColor: '#4a8a4a',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }, children: "\uAC70\uB798 \uC2E4\uD589" })] })), message.analysis && (_jsxs("div", { style: {
                                        marginTop: '10px',
                                        padding: '10px',
                                        backgroundColor: '#2a2a4a',
                                        borderRadius: '6px',
                                        border: '1px solid #4a4a8a',
                                    }, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '5px' }, children: "\uD83D\uDCCA \uC2DC\uC7A5 \uBD84\uC11D" }), _jsxs("div", { style: { fontSize: '12px' }, children: ["\uCD94\uC138: ", message.analysis.trend, _jsx("br", {}), "RSI: ", message.analysis.rsi, " (", message.analysis.rsiSignal, ")", _jsx("br", {}), "MACD: ", message.analysis.macdSignal, _jsx("br", {}), "\uC885\uD569\uC810\uC218: ", message.analysis.overallScore, "/100"] })] }))] }) }, message.id))), isLoading && (_jsxs("div", { style: { ...messageStyle('ai'), opacity: 0.7 }, children: [_jsx("div", { style: { fontSize: '12px', opacity: 0.7, marginBottom: '5px' }, children: "\uD83E\uDD16 AI - \uC0DD\uAC01\uC911..." }), "AI\uAC00 \uC2E4\uC2DC\uAC04 \uB370\uC774\uD130\uB97C \uBD84\uC11D\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4..."] })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { style: inputContainerStyle, children: [_jsx("textarea", { value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "AI\uC5D0\uAC8C \uC9C8\uBB38\uD558\uC138\uC694... (\uC608: EURUSD \uBD84\uC11D\uD574\uC918, \uC9C0\uAE08 \uAC70\uB798\uD558\uAE30 \uC88B\uC740 \uC885\uBAA9 \uCD94\uCC9C\uD574\uC918)", style: inputStyle, rows: 2, disabled: isLoading }), _jsx("button", { onClick: sendMessage, style: buttonStyle, disabled: isLoading || !inputMessage.trim(), children: isLoading ? '전송 중...' : '전송 (Enter)' })] })] }));
};
export default AIChat;
