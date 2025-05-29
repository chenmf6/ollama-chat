import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // 引入全局样式（包含 TailwindCSS）
import App from './App';

// 创建 React 应用的根节点
const root = ReactDOM.createRoot(document.getElementById('root'));

// 渲染应用
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);