import { WorldbookEngine } from '../utils/worldbook_engine';
import type { RealtimeVoiceClient } from './types';
import { getWebSocketUrl } from './utils';

export class VolcengineRealtimeClient implements RealtimeVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private nextAudioTime = 0;
  
  private onMessageCallback?: (role: string, text: string, isDelta: boolean, id?: string) => void;
  private onErrorCallback?: (err: string) => void;
  private apiKey: string;
  private appId: string;
  private systemPrompt: string;
  private voice: string;

  constructor(
    apiKey: string,
    appId: string = '',
    systemPrompt: string,
    _worldbookEngine?: WorldbookEngine,
    onMessage?: (role: string, text: string, isDelta: boolean, id?: string) => void,
    onError?: (err: string) => void,
    voice: string = 'cancan'
  ) {
    this.apiKey = apiKey;
    this.appId = appId;
    this.systemPrompt = systemPrompt;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.voice = voice;
  }

  async connect() {
    const wsUrl = getWebSocketUrl('volcengine', { apiKey: this.apiKey, appId: this.appId });
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WS OPEN] Volcengine Doubao Realtime Connected');
      this.initSession();
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleMessage(msg);
      } catch (e) {
        console.error('[WS RECV Volcengine Error]', e);
      }
    };

    this.ws.onerror = (e) => {
      console.error('[WS ERROR Volcengine]', e);
      if (this.onErrorCallback) this.onErrorCallback('Volcengine Doubao WebSocket Error');
    };

    this.ws.onclose = (event) => {
      console.warn(`[WS CLOSE Volcengine] Disconnected. Code: ${event.code}`);
      this.stopAudio();
    };

    await this.startAudioRecording();
  }

  private initSession() {
    if (!this.ws) return;
    
    const msg = {
      event: "session_config",
      config: {
        voice: this.voice,
        prompt: this.systemPrompt,
        audio_format: "pcm16",
        sample_rate: 16000
      }
    };
    
    console.log('[WS SEND Volcengine Config]', msg);
    this.ws.send(JSON.stringify(msg));
  }

  private async handleMessage(msg: any) {
    if (msg.event === "audio_delta" && msg.audio) {
      this.playAudioDelta(msg.audio);
    } else if (msg.event === "text_delta" && msg.text) {
      if (this.onMessageCallback) this.onMessageCallback('ai', msg.text, true);
    } else if (msg.event === "user_transcription" && msg.text) {
      if (this.onMessageCallback) this.onMessageCallback('user', msg.text, false);
    } else if (msg.event === "error") {
      if (this.onErrorCallback) this.onErrorCallback(msg.message || 'Volcengine Error');
    }
  }

  private async startAudioRecording() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    source.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    this.processorNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = this.floatTo16BitPCM(inputData);
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          event: "audio_append",
          data: this.arrayBufferToBase64(pcm16)
        }));
      }
    };
  }

  private stopAudio() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private playAudioDelta(base64: string) {
    if (!this.audioContext) return;
    
    const binary = atob(base64);
    const len = binary.length;
    const pcmData = new Int16Array(len / 2);
    
    for (let i = 0; i < len; i += 2) {
      pcmData[i/2] = binary.charCodeAt(i) | (binary.charCodeAt(i+1) << 8);
      if (pcmData[i/2] & 0x8000) {
        pcmData[i/2] |= 0xFFFF0000;
      }
    }

    const audioBuffer = this.audioContext.createBuffer(1, pcmData.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    const currentTime = this.audioContext.currentTime;
    if (this.nextAudioTime < currentTime) {
      this.nextAudioTime = currentTime + 0.05;
    }
    source.start(this.nextAudioTime);
    this.nextAudioTime += audioBuffer.duration;
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
