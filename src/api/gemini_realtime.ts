import { WorldbookEngine } from '../utils/worldbook_engine';
import type { RealtimeVoiceClient } from './types';
import { getWebSocketConfig } from './utils';
import { UniversalWebSocket } from './universal_ws';

export class GeminiRealtimeClient implements RealtimeVoiceClient {
  private ws: UniversalWebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private nextAudioTime = 0;
  
  private onMessageCallback?: (role: string, text: string, isDelta: boolean, id?: string) => void;
  private onErrorCallback?: (err: string) => void;
  private apiKey: string;
  private systemPrompt: string;
  private voice: string;
  private model: string;

  constructor(
    apiKey: string,
    systemPrompt: string,
    _worldbookEngine?: WorldbookEngine,
    onMessage?: (role: string, text: string, isDelta: boolean, id?: string) => void,
    onError?: (err: string) => void,
    voice: string = 'Puck',
    model: string = 'gemini-2.0-flash-exp'
  ) {
    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.voice = voice;
    this.model = model.startsWith('models/') ? model : `models/${model}`;
  }

  async connect() {
    const config = getWebSocketConfig('gemini', { apiKey: this.apiKey, model: this.model });
    
    this.ws = new UniversalWebSocket(config.url, { headers: config.headers });

    this.ws.onopen = () => {
      console.log('[WS OPEN] Gemini Live Connected');
      this.initSession();
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleMessage(msg);
      } catch (e) {
        console.error('[WS RECV Gemini Error]', e);
      }
    };

    this.ws.onerror = (e) => {
      console.error('[WS ERROR Gemini]', e);
      if (this.onErrorCallback) this.onErrorCallback('Gemini Live WebSocket Error');
    };

    this.ws.onclose = (event) => {
      console.warn(`[WS CLOSE Gemini] Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
      this.stopAudio();
    };

    await this.ws.connect();
    await this.startAudioRecording();
  }

  private initSession() {
    if (!this.ws) return;

    const setupMsg = {
      setup: {
        model: this.model,
        generationConfig: {
          responseModalities: ["AUDIO", "TEXT"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.voice
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: this.systemPrompt }]
        }
      }
    };

    console.log('[WS SEND Gemini Setup]', setupMsg);
    this.ws.send(JSON.stringify(setupMsg));
  }

  private async handleMessage(msg: any) {
    if (msg.serverContent) {
      const modelTurn = msg.serverContent.modelTurn;
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          if (part.text) {
            if (this.onMessageCallback) this.onMessageCallback('ai', part.text, true);
          }
          if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
            this.playAudioDelta(part.inlineData.data);
          }
        }
      }
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
      
      if (this.ws && this.ws.readyState === 1) {
        this.ws.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: this.arrayBufferToBase64(pcm16)
              }
            ]
          }
        }));
      }
    };
  }

  private stopAudio() {
    if (this.processorNode) {
      try { this.processorNode.disconnect(); } catch (e) {}
      this.processorNode = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      } catch (e) {}
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    this.nextAudioTime = 0;
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
    this.stopAudio();
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      ws.close();
    }
  }
}
