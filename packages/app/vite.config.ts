import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import svgr from 'vite-plugin-svgr';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import imagemin from 'unplugin-imagemin/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({
      loose: true,
    }),
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    UnoCSS(),
    svgr(),
    codeInspectorPlugin({
      bundler: 'vite',
    }),

    imagemin({
      compress: {
        jpg: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        png: {
          quality: 80,
        },
        webp: {
          quality: 80,
        },
      },
      conversion: [
        { from: 'jpeg', to: 'webp' },
        { from: 'png', to: 'webp' },
        { from: 'JPG', to: 'jpeg' },
      ],
    } as never),
  ],
  build: {
    target: 'es2018',
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心 (~140KB)
          'react-vendor': ['react', 'react-dom'],

          // Ant Design 生态 (~300KB) - 项目最大的依赖
          'antd-vendor': [
            'antd',
            '@ant-design/icons',
            '@ant-design/v5-patch-for-react-19',
          ],

          // TanStack 路由 (~80KB)
          'router-vendor': [
            '@tanstack/react-router',
            '@tanstack/react-router-devtools',
          ],

          // 工具库 (~60KB)
          'utils-vendor': ['lodash-es', 'dayjs', 'clsx', 'uuid'],

          // 网络和状态 (~40KB)
          'network-vendor': ['axios', 'socket.io-client', 'zustand', 'ahooks'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
