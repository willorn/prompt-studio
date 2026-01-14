import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppInitializer } from './components/AppInitializer';
import { OverlayHost } from '@/components/common/OverlayHost';

function App() {
  // AppInitializer（启动前准备）和 RouterProvider（路由渲染）。这相当于 Java Web 的启动器 + 前端路由器。
  return (
    <AppInitializer>
      <OverlayHost />
      <RouterProvider router={router} />
    </AppInitializer>
  );
}

// 常用原则：优先具名导出，默认导出只在“模块只有一个核心对象”时用（如页面级组件，顶层入口/页面/路由组件：App, HomePage 这类“一眼知道唯一主角”的模块）。
//  --> 也就是优先同名导出，组件要同名
export default App;
