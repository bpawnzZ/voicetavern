export type VoiceProvider = 'qwen' | 'xai' | 'openai' | 'gemini' | 'volcengine' | 'glm' | 'custom';

export interface RealtimeVoiceClient {
  connect(): Promise<void>;
  disconnect(): void;
}

export interface ProviderConfig {
  apiKey: string;
  appId?: string; // For Volcengine / Doubao
  // OpenAI-compatible endpoints ('custom' provider):
  baseUrl?: string;      // chat + STT root, e.g. https://api.openai.com/v1
  sttModel?: string;     // /audio/transcriptions model
  ttsBaseUrl?: string;   // optional, falls back to baseUrl
  ttsApiKey?: string;    // optional, falls back to apiKey
  ttsModel?: string;     // /audio/speech model
  voice: string;
  model?: string;
}

export interface ProviderInfo {
  id: VoiceProvider;
  name: string;
  subName: string;
  hasAppId?: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  { id: 'qwen', name: 'Qwen', subName: 'Qwen Realtime' },
  { id: 'xai', name: 'xAI Grok Voice', subName: 'Speech-to-Speech' },
  { id: 'openai', name: 'OpenAI Realtime', subName: 'gpt-4o-realtime' },
  { id: 'gemini', name: 'Google Gemini', subName: 'Multimodal Live' },
  { id: 'volcengine', name: 'Doubao (Volcengine)', subName: 'Doubao Realtime', hasAppId: true },
  { id: 'glm', name: 'Zhipu GLM', subName: 'GLM-Realtime' },
  { id: 'custom', name: 'Custom', subName: 'OpenAI-compatible' },
];

export const QWEN_VOICES = [
  { id: 'longanqian', name: 'Longan Qian (standard female)' },
  { id: 'longanlingxin', name: 'Longan Lingxin (lively female)' },
  { id: 'longanlufeng', name: 'Longan Lufeng (steady male)' },
  { id: 'longanlingxi', name: 'Longan Lingxi (gentle female)' },
  { id: 'longanxiaoxin', name: 'Longan Xiaoxin (cheerful female)' },
  { id: 'longanfengyue', name: 'Longan Fengyue (mature female)' },
  { id: 'longanyuanfei', name: 'Longan Yuanfei (bright male)' },
  { id: 'longanhuan_v3.6', name: 'Longan Huan (joyful female)' },
  { id: 'longjielidou_v3.6', name: 'Long Guolidou (cute child)' },
  { id: 'longpaopao_v3.6', name: 'Long Paopao (cute child)' },
  { id: 'longhuohuo_v3.6', name: 'Long Huohuo (passionate male)' },
  { id: 'longchuanshu_v3.6', name: 'Long Chuanshu (steady older male)' },
  { id: 'loongmary', name: 'Mary (English female)' },
  { id: 'loongeva_v3.6', name: 'Eva (English female)' },
  { id: 'loongjohn', name: 'John (English male)' },
];

export const XAI_VOICES = [
  { id: 'eve', name: 'Eve (Female)' },
  { id: 'ara', name: 'Ara (Female)' },
  { id: 'rex', name: 'Rex (Male)' },
  { id: 'sal', name: 'Sal (Male)' },
  { id: 'leo', name: 'Leo (Male)' },
  { id: 'mia', name: 'Mia (Female)' },
];

export const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy (Neutral)' },
  { id: 'ash', name: 'Ash (Expressive Male)' },
  { id: 'ballad', name: 'Ballad (Warm Male)' },
  { id: 'coral', name: 'Coral (Warm Female)' },
  { id: 'echo', name: 'Echo (Male)' },
  { id: 'sage', name: 'Sage (Calm Female)' },
  { id: 'shimmer', name: 'Shimmer (Clear Female)' },
  { id: 'verse', name: 'Verse (Dynamic)' },
];

export const GEMINI_VOICES = [
  { id: 'Puck', name: 'Puck (Playful)' },
  { id: 'Charon', name: 'Charon (Deep Male)' },
  { id: 'Kore', name: 'Kore (Calm Female)' },
  { id: 'Fenrir', name: 'Fenrir (Intense Male)' },
  { id: 'Aoede', name: 'Aoede (Melodic Female)' },
];

export const VOLCENGINE_VOICES = [
  { id: 'cancan', name: 'Cancan (general female)' },
  { id: 'zizi', name: 'Zizi (general female)' },
  { id: 'qingcang', name: 'Qingcang (general male)' },
];

export const GLM_VOICES = [
  { id: 'cogvoice-female', name: 'CogVoice (standard female)' },
  { id: 'cogvoice-male', name: 'CogVoice (standard male)' },
];
