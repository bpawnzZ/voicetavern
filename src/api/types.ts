export type VoiceProvider = 'qwen' | 'xai';

export interface RealtimeVoiceClient {
  connect(): Promise<void>;
  disconnect(): void;
}

export const QWEN_VOICES = [
  { id: 'longanqian', name: '龙安浅 (标准女声)' },
  { id: 'longxiaochun', name: '龙小春 (甜美女声)' },
  { id: 'longyue', name: '龙悦 (御姐女声)' },
  { id: 'longba', name: '龙霸 (沉稳男声)' },
];

export const XAI_VOICES = [
  { id: 'eve', name: 'Eve (Female)' },
  { id: 'ara', name: 'Ara (Female)' },
  { id: 'rex', name: 'Rex (Male)' },
  { id: 'sal', name: 'Sal (Male)' },
  { id: 'leo', name: 'Leo (Male)' },
  { id: 'mia', name: 'Mia (Female)' },
];
