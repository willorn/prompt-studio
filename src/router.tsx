import React, { Suspense } from 'react';
import { createHashRouter } from 'react-router-dom';
import MainView from './pages/MainView';

const Settings = React.lazy(() => import('./pages/Settings'));

const routeFallback = (
  <div className="h-dynamic-screen flex items-center justify-center bg-background dark:bg-background-dark text-surface-onVariant">
    加载中...
  </div>
);

export const router = createHashRouter([
  {
    path: '/',
    element: <MainView />,
  },
  {
    path: '/project/:projectId',
    element: <MainView />,
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={routeFallback}>
        <Settings />
      </Suspense>
    ),
  },
]);
