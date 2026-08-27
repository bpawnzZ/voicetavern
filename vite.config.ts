import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
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
      },
      '/openai-ws': {
        target: 'wss://api.openai.com',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq, req) => {
            const url = new URL(req.url || '', 'http://localhost');
            const apiKey = url.searchParams.get('api_key');
            if (apiKey) {
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              proxyReq.setHeader('OpenAI-Beta', 'realtime=v1');
            }
          });
        }
      },
      '/gemini-ws': {
        target: 'wss://generativelanguage.googleapis.com',
        ws: true,
        changeOrigin: true
      },
      '/volc-ws': {
        target: 'wss://openspeech.bytedance.com',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq, req) => {
            const url = new URL(req.url || '', 'http://localhost');
            const apiKey = url.searchParams.get('api_key');
            if (apiKey) {
              proxyReq.setHeader('Authorization', `Bearer; ${apiKey}`);
            }
          });
        }
      },
      '/glm-ws': {
        target: 'wss://open.bigmodel.cn',
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
