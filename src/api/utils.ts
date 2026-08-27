import type { VoiceProvider } from './types';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

export interface WebSocketConfig {
  url: string;
  headers?: Record<string, string>;
}

export function getWebSocketConfig(provider: VoiceProvider, params: {
  apiKey?: string;
  appId?: string;
  model?: string;
}): WebSocketConfig {
  const isApp = isTauri();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  switch (provider) {
    case 'qwen': {
      const model = params.model || 'qwen-audio-3.0-realtime-plus';
      if (isApp) {
        return {
          url: `wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=${model}`,
          headers: {
            'Authorization': `Bearer ${params.apiKey || ''}`
          }
        };
      }
      return {
        url: `${protocol}//${host}/api-ws/v1/realtime?model=${model}&api_key=${params.apiKey || ''}`
      };
    }
    case 'xai': {
      const model = params.model || 'grok-voice-latest';
      if (isApp) {
        return {
          url: `wss://api.x.ai/v1/realtime?model=${model}`,
          headers: {
            'Authorization': `Bearer ${params.apiKey || ''}`
          }
        };
      }
      return {
        url: `${protocol}//${host}/xai-ws/v1/realtime?model=${model}&api_key=${params.apiKey || ''}`
      };
    }
    case 'openai': {
      const model = params.model || 'gpt-4o-realtime-preview';
      if (isApp) {
        return {
          url: `wss://api.openai.com/v1/realtime?model=${model}`,
          headers: {
            'Authorization': `Bearer ${params.apiKey || ''}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        };
      }
      return {
        url: `${protocol}//${host}/openai-ws/v1/realtime?model=${model}&api_key=${params.apiKey || ''}`
      };
    }
    case 'gemini': {
      const key = params.apiKey || '';
      if (isApp) {
        return {
          url: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`
        };
      }
      return {
        url: `${protocol}//${host}/gemini-ws/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`
      };
    }
    case 'volcengine': {
      const appId = params.appId || '';
      const key = params.apiKey || '';
      if (isApp) {
        return {
          url: `wss://openspeech.bytedance.com/api/v1/realtime_dialogue?app_id=${appId}`,
          headers: {
            'Authorization': `Bearer; ${key}`
          }
        };
      }
      return {
        url: `${protocol}//${host}/volc-ws/api/v1/realtime_dialogue?app_id=${appId}&api_key=${key}`
      };
    }
    case 'glm': {
      const model = params.model || 'glm-realtime';
      if (isApp) {
        return {
          url: `wss://open.bigmodel.cn/api/paas/v4/realtime?model=${model}`,
          headers: {
            'Authorization': `Bearer ${params.apiKey || ''}`
          }
        };
      }
      return {
        url: `${protocol}//${host}/glm-ws/api/paas/v4/realtime?model=${model}&api_key=${params.apiKey || ''}`
      };
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
