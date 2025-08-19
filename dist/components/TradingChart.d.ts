import React from 'react';
import 'chartjs-adapter-date-fns';
interface TradingChartProps {
    symbol: string;
    timeframe: string;
    onPriceUpdate?: (price: number) => void;
}
declare const TradingChart: React.FC<TradingChartProps>;
export default TradingChart;
