import React from 'react';
interface AIChatProps {
    currentSymbol: string;
    currentPrice?: number;
    onTradeAction?: (action: 'BUY' | 'SELL', symbol: string) => void;
}
declare const AIChat: React.FC<AIChatProps>;
export default AIChat;
