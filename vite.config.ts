import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    // 开发时代理 API 请求到后端
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [react()],
  // 移除 define 块 - API Key 不再注入到前端
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
