import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-ws': {
        target: 'wss://dashscope.aliyuncs.com',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq, req) => {
            const url = new URL(req.url || '', 'http://localhost');
            const apiKey = url.searchParams.get('api_key');
            if (apiKey) {
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            }
          });
        }
      },
      '/xai-ws': {
        target: 'wss://api.x.ai',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq, req) => {
            const url = new URL(req.url || '', 'http://localhost');
            const apiKey = url.searchParams.get('api_key');
            if (apiKey) {
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            }
          });
        }
      }
    }
  }
})
