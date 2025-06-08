import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'virtual:uno.css';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN'; // 用于日期选择器的国际化
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import '@unocss/reset/tailwind-compat.css';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// 导入生成的路由树
import { routeTree } from './routeTree.gen';

dayjs.locale('zh-cn'); // 如果尚未全局设置，可能需要

// 创建新的路由实例
const router = createRouter({ routeTree });

// 注册路由实例以确保类型安全
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// 渲染应用
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#7D6CE2',
          },
          cssVar: true,
          hashed: false,
        }}
        locale={zhCN}
      >
        <AntApp>
          <RouterProvider router={router} />
        </AntApp>
      </ConfigProvider>
    </React.StrictMode>,
  );
}
