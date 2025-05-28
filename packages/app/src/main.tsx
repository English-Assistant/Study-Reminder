import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'virtual:uno.css';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN'; // for date-picker i18n
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import '@unocss/reset/tailwind-compat.css';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

dayjs.locale('zh-cn'); // If not already global, might be needed

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
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
          cssVar: true, // Retaining based on previous diff, assess if needed
          hashed: false, // Retaining based on previous diff, assess if needed
        }}
        locale={zhCN} // Removed as zhCN is unused and not requested
      >
        <AntApp>
          <RouterProvider router={router} />
        </AntApp>
      </ConfigProvider>
    </React.StrictMode>,
  );
}
