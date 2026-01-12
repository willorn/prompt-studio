import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { runMigrations } from './db/migrations';
import { I18nProvider } from './i18n/I18nContext';
import './styles/globals.css';

// 先确保图标字体加载，再渲染，避免初始化时出现文字或空白
const startApp = async () => {
  if ('fonts' in document) {
    try {
      await (document as any).fonts.load('20px "Material Symbols Outlined"');
    } catch {
      // 忽略字体加载失败，继续渲染
    }
  }

  // 初始化数据库迁移（异步，不阻塞渲染）
  runMigrations().catch(console.error);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>
  );
};

startApp();
