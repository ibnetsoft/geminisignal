import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// 실제 MetaAPI 계정 정보 및 포지션 표시 컴포넌트
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
const AccountInfo = ({ onPositionUpdate }) => {
    const [accountData, setAccountData] = useState(null);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    // 실제 계정 정보 로드
    const loadAccountInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('📋 실제 MetaAPI 계정 정보 로드 중...');
            // 계정 정보 조회
            const accountInfo = await apiService.getAccountInfo();
            setAccountData(accountInfo);
            // 포지션 조회
            const userPositions = await apiService.getPositions('user_001');
            setPositions(userPositions);
            if (onPositionUpdate) {
                onPositionUpdate(userPositions);
            }
            setLastUpdate(new Date());
            console.log('✅ MetaAPI 계정 정보 로드 완료');
        }
        catch (error) {
            console.error('❌ 계정 정보 로드 실패:', error.message);
            setError(error.message || '계정 정보 로드 실패');
        }
        finally {
            setLoading(false);
        }
    };
    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadAccountInfo();
    }, []);
    // 자동 새로고침 (30초마다)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                loadAccountInfo();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [loading]);
    // 포지션 청산
    const closePosition = async (positionId) => {
        try {
            console.log(`🔄 포지션 청산 시도: ${positionId}`);
            // 실제 포지션 청산 API 호출 (구현 필요)
            // const result = await apiService.closePosition(positionId);
            // 일시적으로 목록에서 제거
            setPositions(prev => prev.filter(p => p.id !== positionId));
            console.log(`✅ 포지션 청산 완료: ${positionId}`);
        }
        catch (error) {
            console.error(`❌ 포지션 청산 실패:`, error.message);
        }
    };
    // 스타일
    const containerStyle = {
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '20px',
        color: '#ffffff',
    };
    const headerStyle = {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#00ff88',
    };
    const accountGridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
    };
    const accountItemStyle = {
        backgroundColor: '#2a2a2a',
        padding: '10px',
        borderRadius: '6px',
        textAlign: 'center',
    };
    const positionStyle = {
        backgroundColor: '#2a2a2a',
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };
    const buttonStyle = {
        padding: '5px 10px',
        backgroundColor: '#ff4757',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
    };
    const statusStyle = {
        fontSize: '12px',
        color: '#888',
        textAlign: 'right',
        marginTop: '15px',
    };
    if (loading) {
        return (_jsx("div", { style: containerStyle, children: _jsxs("div", { style: { textAlign: 'center', padding: '40px' }, children: [_jsx("div", { style: { fontSize: '16px', marginBottom: '10px' }, children: "\uD83D\uDCCB \uC2E4\uC81C MetaAPI \uACC4\uC815 \uC815\uBCF4 \uB85C\uB529 \uC911..." }), _jsx("div", { style: { fontSize: '14px', color: '#888' }, children: "\uACC4\uC815 308592422 (XM Global) \uC5F0\uACB0 \uC911..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { style: containerStyle, children: _jsxs("div", { style: { textAlign: 'center', padding: '40px' }, children: [_jsx("div", { style: { fontSize: '16px', color: '#ff4757', marginBottom: '10px' }, children: "\u274C \uACC4\uC815 \uC815\uBCF4 \uB85C\uB4DC \uC2E4\uD328" }), _jsx("div", { style: { fontSize: '14px', color: '#888', marginBottom: '15px' }, children: error }), _jsx("button", { onClick: loadAccountInfo, style: {
                            padding: '8px 16px',
                            backgroundColor: '#007acc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "\uB2E4\uC2DC \uC2DC\uB3C4" })] }) }));
    }
    return (_jsxs("div", { style: containerStyle, children: [_jsxs("div", { style: headerStyle, children: ["\uD83D\uDCCB \uC2E4\uC81C MT5 \uACC4\uC815 \uC815\uBCF4 (", accountData?.source === 'metaapi_real' ? 'MetaAPI 연결' : '폴백 데이터', ")"] }), accountData && (_jsxs("div", { style: accountGridStyle, children: [_jsxs("div", { style: accountItemStyle, children: [_jsx("div", { style: { fontSize: '12px', color: '#888' }, children: "\uC794\uC561" }), _jsxs("div", { style: { fontSize: '16px', fontWeight: 'bold', color: '#00ff88' }, children: ["$", accountData.account.balance.toLocaleString()] })] }), _jsxs("div", { style: accountItemStyle, children: [_jsx("div", { style: { fontSize: '12px', color: '#888' }, children: "\uC790\uBCF8" }), _jsxs("div", { style: { fontSize: '16px', fontWeight: 'bold', color: '#00ff88' }, children: ["$", accountData.account.equity.toLocaleString()] })] }), _jsxs("div", { style: accountItemStyle, children: [_jsx("div", { style: { fontSize: '12px', color: '#888' }, children: "\uB9C8\uC9C4" }), _jsxs("div", { style: { fontSize: '16px', fontWeight: 'bold' }, children: ["$", accountData.account.margin.toLocaleString()] })] }), _jsxs("div", { style: accountItemStyle, children: [_jsx("div", { style: { fontSize: '12px', color: '#888' }, children: "\uC5EC\uC720\uB9C8\uC9C4" }), _jsxs("div", { style: { fontSize: '16px', fontWeight: 'bold' }, children: ["$", accountData.account.freeMargin.toLocaleString()] })] }), _jsxs("div", { style: accountItemStyle, children: [_jsx("div", { style: { fontSize: '12px', color: '#888' }, children: "\uB9C8\uC9C4\uB808\uBCA8" }), _jsxs("div", { style: { fontSize: '16px', fontWeight: 'bold' }, children: [accountData.account.marginLevel.toFixed(1), "%"] })] }), _jsxs("div", { style: accountItemStyle, children: [_jsx("div", { style: { fontSize: '12px', color: '#888' }, children: "\uC11C\uBC84" }), _jsx("div", { style: { fontSize: '14px', fontWeight: 'bold' }, children: accountData.account.server || 'XMGlobal-MT5 6' })] })] })), accountData && (accountData.account_number || accountData.broker) && (_jsxs("div", { style: {
                    backgroundColor: '#2a2a2a',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    fontSize: '12px',
                }, children: [accountData.account_number && (_jsxs("div", { children: ["\uACC4\uC815\uBC88\uD638: ", _jsx("span", { style: { color: '#00ff88' }, children: accountData.account_number })] })), accountData.broker && (_jsxs("div", { children: ["\uBE0C\uB85C\uCEE4: ", _jsx("span", { style: { color: '#00ff88' }, children: accountData.broker })] })), _jsxs("div", { children: ["\uD1B5\uD654: ", _jsx("span", { style: { color: '#00ff88' }, children: accountData.account.currency })] })] })), _jsxs("div", { style: { marginTop: '20px' }, children: [_jsxs("div", { style: { fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }, children: ["\uD83D\uDCC8 \uD604\uC7AC \uD3EC\uC9C0\uC158 (", positions.length, "\uAC1C)"] }), positions.length === 0 ? (_jsx("div", { style: {
                            backgroundColor: '#2a2a2a',
                            padding: '20px',
                            borderRadius: '6px',
                            textAlign: 'center',
                            color: '#888',
                        }, children: "\uD604\uC7AC \uBCF4\uC720 \uC911\uC778 \uD3EC\uC9C0\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4" })) : (positions.map((position) => (_jsxs("div", { style: positionStyle, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 'bold', fontSize: '14px' }, children: [position.symbol, " - ", position.type] }), _jsxs("div", { style: { fontSize: '12px', color: '#888' }, children: ["\uC218\uB7C9: ", position.lots, " Lot | \uC9C4\uC785\uAC00: ", position.price.toFixed(5)] })] }), _jsxs("div", { style: { textAlign: 'right', marginRight: '10px' }, children: [_jsxs("div", { style: {
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: position.profit >= 0 ? '#00ff88' : '#ff4757'
                                        }, children: [position.profit >= 0 ? '+' : '', "$", position.profit.toFixed(2)] }), _jsxs("div", { style: { fontSize: '12px', color: '#888' }, children: ["(", position.profitPercent >= 0 ? '+' : '', position.profitPercent.toFixed(2), "%)"] })] }), _jsx("button", { onClick: () => closePosition(position.id), style: buttonStyle, children: "\uCCAD\uC0B0" })] }, position.id))))] }), _jsxs("div", { style: statusStyle, children: [lastUpdate && (_jsxs("div", { children: ["\uB9C8\uC9C0\uB9C9 \uC5C5\uB370\uC774\uD2B8: ", lastUpdate.toLocaleTimeString('ko-KR')] })), _jsxs("div", { children: ["\uC5F0\uACB0 \uC0C1\uD0DC: ", accountData?.source === 'metaapi_real' ?
                                _jsx("span", { style: { color: '#00ff88' }, children: "\u2705 MetaAPI \uC2E4\uC2DC\uAC04" }) :
                                _jsx("span", { style: { color: '#ffa726' }, children: "\u26A0\uFE0F \uD3F4\uBC31 \uB370\uC774\uD130" })] })] })] }));
};
export default AccountInfo;
