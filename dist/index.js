import { jsx as _jsx } from "react/jsx-runtime";
// React 어플리케이션 엔트리 포인트
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// 글로벌 스타일
const globalStyle = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #0f1419;
    color: #ffffff;
    overflow-x: hidden;
  }
  
  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
  }
  
  button {
    font-family: inherit;
  }
  
  input, textarea {
    font-family: inherit;
  }
  
  /* 스크롤바 스타일 */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
`;
// 글로벌 스타일 적용
const styleSheet = document.createElement('style');
styleSheet.innerText = globalStyle;
document.head.appendChild(styleSheet);
// React 앱 렌더링
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
// 개발 환경에서 성능 측정
if (process.env.NODE_ENV === 'development') {
    console.log('🚀 NP Signal React App 시작');
    console.log('📊 실제 MetaAPI & Binance 데이터 연동');
    console.log('🤖 OpenAI GPT-4 AI 채팅 활성화');
    console.log('⚡ WebSocket 실시간 데이터 스트리밍');
}
// Hot Module Replacement (개발 환경)
if (module.hot) {
    module.hot.accept('./App', () => {
        console.log('🔄 Hot reload: App 컴포넌트 업데이트');
    });
}
