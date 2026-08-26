import { WorldbookEngine } from '../utils/worldbook_engine';
import type { RealtimeVoiceClient } from './types';

export class GLMRealtimeClient implements RealtimeVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private nextAudioTime = 0;
  
  private onMessageCallback?: (role: string, text: string, isDelta: boolean, id?: string) => void;
  private onErrorCallback?: (err: string) => void;
  private worldbookEngine?: WorldbookEngine;
  private apiKey: string;
  private systemPrompt: string;
  private voice: string;

  constructor(
    apiKey: string,
    systemPrompt: string,
    worldbookEngine?: WorldbookEngine,
    onMessage?: (role: string, text: string, isDelta: boolean, id?: string) => void,
    onError?: (err: string) => void,
    voice: string = 'cogvoice-female'
  ) {
    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt;
    this.worldbookEngine = worldbookEngine;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.voice = voice;
  }

  async connect() {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/glm-ws/api/paas/v4/realtime?model=glm-realtime&api_key=${this.apiKey}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WS OPEN] Zhipu GLM-Realtime Connected');
      this.initSession();
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleMessage(msg);
      } catch (e) {
        console.error('[WS RECV GLM Error]', e);
      }
    };

    this.ws.onerror = (e) => {
      console.error('[WS ERROR GLM]', e);
      if (this.onErrorCallback) this.onErrorCallback('Zhipu GLM WebSocket Error');
    };

    this.ws.onclose = (event) => {
      console.warn(`[WS CLOSE GLM] Disconnected. Code: ${event.code}`);
      this.stopAudio();
    };

    await this.startAudioRecording();
  }

  private initSession() {
    if (!this.ws) return;

    const tools = this.worldbookEngine ? [
      {
        type: "function",
        name: "query_worldbook",
        description: "Query local Worldbook for lore information.",
        parameters: {
          type: "object",
          properties: {
            keyword: { type: "string" }
          },
          required: ["keyword"]
        }
      }
    ] : [];

    const msg = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        voice: this.voice,
        instructions: this.systemPrompt,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5
        },
        tools: tools
      }
    };
    
    console.log('[WS SEND GLM Init]', msg);
    this.ws.send(JSON.stringify(msg));
  }

  private async handleMessage(msg: any) {
    const t = msg.type;
    if (t === "response.audio.delta") {
      this.playAudioDelta(msg.delta);
    } else if (t === "response.audio_transcript.delta") {
      if (this.onMessageCallback) this.onMessageCallback('ai', msg.delta, true, msg.item_id);
    } else if (t === "conversation.item.input_audio_transcription.completed") {
      if (this.onMessageCallback) this.onMessageCallback('user', msg.transcript, false, msg.item_id);
    } else if (t === "error") {
      if (this.onErrorCallback) this.onErrorCallback(msg.error?.message || 'GLM API Error');
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
          type: "input_audio_buffer.append",
          audio: this.arrayBufferToBase64(pcm16)
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
