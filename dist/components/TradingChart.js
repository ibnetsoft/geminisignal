import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// 실제 MetaAPI/Binance 데이터를 사용하는 트레이딩 차트 컴포넌트
import { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';
import { apiService, getDataSource } from '../services/api';
// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, CandlestickController, CandlestickElement, OhlcController, OhlcElement);
const TradingChart = ({ symbol, timeframe, onPriceUpdate }) => {
    const chartRef = useRef(null);
    const [chartState, setChartState] = useState({
        loading: true,
        error: null,
        data: [],
        lastUpdate: null,
        dataSource: getDataSource(symbol)
    });
    // 실제 차트 데이터 로드
    const loadChartData = async () => {
        try {
            setChartState(prev => ({ ...prev, loading: true, error: null }));
            console.log(`📊 ${symbol} 실제 데이터 로드 시작 (${chartState.dataSource})`);
            const response = await apiService.getChartData(symbol, timeframe, 100);
            if (response.success && response.candles) {
                setChartState(prev => ({
                    ...prev,
                    loading: false,
                    data: response.candles,
                    lastUpdate: new Date(),
                    error: null
                }));
                // 현재 가격 업데이트
                const latestCandle = response.candles[response.candles.length - 1];
                if (latestCandle && onPriceUpdate) {
                    onPriceUpdate(latestCandle.close);
                }
                console.log(`✅ ${symbol} 차트 데이터 로드 완료 (${response.candles.length}개 캔들)`);
            }
            else {
                throw new Error('차트 데이터가 없습니다');
            }
        }
        catch (error) {
            console.error(`❌ ${symbol} 차트 로드 실패:`, error.message);
            setChartState(prev => ({
                ...prev,
                loading: false,
                error: error.message || '차트 데이터 로드 실패'
            }));
        }
    };
    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadChartData();
    }, [symbol, timeframe]);
    // 데이터 새로고침 (30초마다)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!chartState.loading) {
                loadChartData();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [symbol, timeframe, chartState.loading]);
    // Chart.js 데이터 변환
    const chartData = {
        datasets: [
            {
                label: `${symbol} (${chartState.dataSource.toUpperCase()})`,
                data: chartState.data.map(candle => ({
                    x: new Date(candle.time).getTime(),
                    o: candle.open,
                    h: candle.high,
                    l: candle.low,
                    c: candle.close,
                })),
                borderColor: {
                    up: '#00ff88',
                    down: '#ff4757',
                    unchanged: '#ffa726',
                },
                backgroundColor: {
                    up: 'rgba(0, 255, 136, 0.1)',
                    down: 'rgba(255, 71, 87, 0.1)',
                    unchanged: 'rgba(255, 167, 38, 0.1)',
                },
                borderWidth: 1,
            },
        ],
    };
    // Chart.js 옵션
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: `${symbol} - ${timeframe} (${chartState.dataSource === 'metaapi' ? 'MetaAPI' : 'Binance'})`,
                color: '#ffffff',
                font: {
                    size: 16,
                    weight: 'bold',
                },
            },
            legend: {
                display: true,
                labels: {
                    color: '#ffffff',
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#333',
                borderWidth: 1,
                callbacks: {
                    title: (context) => {
                        if (context[0]) {
                            return new Date(context[0].parsed.x).toLocaleString('ko-KR');
                        }
                        return '';
                    },
                    label: (context) => {
                        const data = context.parsed;
                        return [
                            `시가: ${data.o?.toFixed(5)}`,
                            `고가: ${data.h?.toFixed(5)}`,
                            `저가: ${data.l?.toFixed(5)}`,
                            `종가: ${data.c?.toFixed(5)}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: timeframe === '1H' ? 'hour' : 'day',
                    displayFormats: {
                        hour: 'MM/dd HH:mm',
                        day: 'MM/dd',
                    },
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#ffffff',
                },
            },
            y: {
                position: 'right',
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#ffffff',
                    callback: function (value) {
                        return typeof value === 'number' ? value.toFixed(5) : value;
                    },
                },
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };
    // 차트 컨테이너 스타일
    const containerStyle = {
        width: '100%',
        height: '400px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '10px',
        border: '1px solid #333',
        position: 'relative',
    };
    // 상태 표시 스타일
    const statusStyle = {
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
    };
    if (chartState.loading) {
        return (_jsxs("div", { style: containerStyle, children: [_jsx("div", { style: {
                        ...statusStyle,
                        backgroundColor: '#ffa726',
                        color: '#000',
                    }, children: "\uD83D\uDCCA \uC2E4\uC81C \uB370\uC774\uD130 \uB85C\uB529 \uC911..." }), _jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#ffffff',
                        fontSize: '16px',
                    }, children: [symbol, " \uC2E4\uC81C ", chartState.dataSource === 'metaapi' ? 'MetaAPI' : 'Binance', " \uB370\uC774\uD130 \uB85C\uB529 \uC911..."] })] }));
    }
    if (chartState.error) {
        return (_jsxs("div", { style: containerStyle, children: [_jsx("div", { style: {
                        ...statusStyle,
                        backgroundColor: '#ff4757',
                        color: '#fff',
                    }, children: "\u274C \uC624\uB958" }), _jsxs("div", { style: {
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#ff4757',
                        textAlign: 'center',
                    }, children: [_jsxs("div", { style: { fontSize: '16px', marginBottom: '10px' }, children: [symbol, " \uB370\uC774\uD130 \uB85C\uB4DC \uC2E4\uD328"] }), _jsx("div", { style: { fontSize: '14px', opacity: 0.7 }, children: chartState.error }), _jsx("button", { onClick: loadChartData, style: {
                                marginTop: '15px',
                                padding: '8px 16px',
                                backgroundColor: '#007acc',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }, children: "\uB2E4\uC2DC \uC2DC\uB3C4" })] })] }));
    }
    return (_jsxs("div", { style: containerStyle, children: [_jsxs("div", { style: {
                    ...statusStyle,
                    backgroundColor: '#00ff88',
                    color: '#000',
                }, children: ["\u2705 \uC2E4\uC2DC\uAC04 (", chartState.dataSource.toUpperCase(), ")"] }), chartState.lastUpdate && (_jsxs("div", { style: {
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    fontSize: '11px',
                    color: '#888',
                }, children: ["\uB9C8\uC9C0\uB9C9 \uC5C5\uB370\uC774\uD2B8: ", chartState.lastUpdate.toLocaleTimeString('ko-KR')] })), _jsx(Chart, { ref: chartRef, type: "candlestick", data: chartData, options: chartOptions, style: { height: '100%' } })] }));
};
export default TradingChart;
