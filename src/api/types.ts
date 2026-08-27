export type VoiceProvider = 'qwen' | 'xai' | 'openai' | 'gemini' | 'volcengine' | 'glm';

export interface RealtimeVoiceClient {
  connect(): Promise<void>;
  disconnect(): void;
}

export interface ProviderConfig {
  apiKey: string;
  appId?: string; // For Volcengine / Doubao
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
  { id: 'qwen', name: '通义千问', subName: 'Qwen Realtime' },
  { id: 'xai', name: 'xAI Grok Voice', subName: 'Speech-to-Speech' },
  { id: 'openai', name: 'OpenAI Realtime', subName: 'gpt-4o-realtime' },
  { id: 'gemini', name: 'Google Gemini', subName: 'Multimodal Live' },
  { id: 'volcengine', name: '火山引擎豆包', subName: 'Doubao Realtime', hasAppId: true },
  { id: 'glm', name: '智谱清言', subName: 'GLM-Realtime' },
];

export const QWEN_VOICES = [
  { id: 'longanqian', name: '龙安浅 (标准女声)' },
  { id: 'longanlingxin', name: '龙安灵心 (灵动女声)' },
  { id: 'longanlufeng', name: '龙安鲁风 (沉稳男声)' },
  { id: 'longanlingxi', name: '龙安灵犀 (温柔女声)' },
  { id: 'longanxiaoxin', name: '龙安小欣 (活泼女声)' },
  { id: 'longanfengyue', name: '龙安风悦 (御姐女声)' },
  { id: 'longanyuanfei', name: '龙安远飞 (阳光男声)' },
  { id: 'longanhuan_v3.6', name: '龙安欢 (欢快女声)' },
  { id: 'longjielidou_v3.6', name: '龙果粒豆 (萌系童声)' },
  { id: 'longpaopao_v3.6', name: '龙泡泡 (可爱童声)' },
  { id: 'longhuohuo_v3.6', name: '龙火火 (热情男声)' },
  { id: 'longchuanshu_v3.6', name: '龙川书 (沉稳大叔)' },
  { id: 'loongmary', name: 'Mary (英文女声)' },
  { id: 'loongeva_v3.6', name: 'Eva (英文女声)' },
  { id: 'loongjohn', name: 'John (英文男声)' },
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
  { id: 'cancan', name: '灿灿 (通用女声)' },
  { id: 'zizi', name: '梓梓 (通用女声)' },
  { id: 'qingcang', name: '擎苍 (通用男声)' },
];

export const GLM_VOICES = [
  { id: 'cogvoice-female', name: 'CogVoice (标准女声)' },
  { id: 'cogvoice-male', name: 'CogVoice (标准男声)' },
];
