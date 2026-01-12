import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { runMigrations } from './db/migrations';
import { I18nProvider } from './i18n/I18nContext';
import './styles/globals.css';


// 初始化数据库迁移
runMigrations().catch(console.error);

//   - React 挂载：
//       - ReactDOM.createRoot(document.getElementById('root')!) 找到 index.html 里的 <div id="root">。
//       - .render(...) 渲染组件树，类似 new SpringApplication(App.class).run() 把控制权交给框架。
//   - 组件树：
//       - <React.StrictMode> 仅开发时启用，帮助发现潜在副作用（生产环境自动移除），类似启用额外校验的 dev profile。
//       - <I18nProvider> 提供全局多语言上下文（React Context，类似全局单例/拦截器，可在子组件用 hook 读取当前语言）。
//       - <App /> 根组件，类似 App.vue 或 Java Web 的前端主控制器。

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
