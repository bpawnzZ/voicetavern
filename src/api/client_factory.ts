import { QwenRealtimeClient } from './qwen_realtime';
import { XAIRealtimeClient } from './xai_realtime';
import { OpenAIRealtimeClient } from './openai_realtime';
import { GeminiRealtimeClient } from './gemini_realtime';
import { VolcengineRealtimeClient } from './volcengine_realtime';
import { GLMRealtimeClient } from './glm_realtime';
import { OpenAICompatClient } from './openai_compat';
import type { RealtimeVoiceClient, VoiceProvider, ProviderConfig } from './types';
import type { WorldbookEngine } from '../utils/worldbook_engine';

export interface CreateClientParams {
  provider: VoiceProvider;
  config: ProviderConfig;
  systemPrompt: string;
  worldbookEngine?: WorldbookEngine;
  onMessage?: (role: string, text: string, isDelta: boolean, id?: string) => void;
  onError?: (err: string) => void;
}

export function createRealtimeClient(params: CreateClientParams): RealtimeVoiceClient {
  const { provider, config, systemPrompt, worldbookEngine, onMessage, onError } = params;

  switch (provider) {
    case 'qwen':
      return new QwenRealtimeClient(config.apiKey, systemPrompt, worldbookEngine, onMessage, onError, config.voice);
    case 'xai':
      return new XAIRealtimeClient(config.apiKey, systemPrompt, worldbookEngine, onMessage, onError, config.voice);
    case 'openai':
      return new OpenAIRealtimeClient(config.apiKey, systemPrompt, worldbookEngine, onMessage, onError, config.voice, config.model);
    case 'gemini':
      return new GeminiRealtimeClient(config.apiKey, systemPrompt, worldbookEngine, onMessage, onError, config.voice, config.model);
    case 'volcengine':
      return new VolcengineRealtimeClient(config.apiKey, config.appId || '', systemPrompt, worldbookEngine, onMessage, onError, config.voice);
    case 'glm':
      return new GLMRealtimeClient(config.apiKey, systemPrompt, worldbookEngine, onMessage, onError, config.voice);
    case 'custom':
      return new OpenAICompatClient(config, systemPrompt, onMessage, onError);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
