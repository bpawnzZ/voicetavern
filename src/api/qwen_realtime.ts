import { WorldbookEngine } from '../utils/worldbook_engine';
import type { RealtimeVoiceClient } from './types';

export class QwenRealtimeClient implements RealtimeVoiceClient {
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
    voice: string = 'longanqian'
  ) {
    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt;
    this.worldbookEngine = worldbookEngine;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.voice = voice;
  }

  async connect() {
    // In dev, use the vite proxy. In prod, this would point to a real proxy server.
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api-ws/v1/realtime?model=qwen-audio-3.0-realtime-plus&api_key=${this.apiKey}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WS OPEN] Qwen Realtime Connected');
      this.initSession();
    };

    this.ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type !== 'response.audio.delta') { // Don't spam audio chunks
        console.log('[WS RECV]', msg.type, msg);
      }
      await this.handleMessage(msg);
    };

    this.ws.onerror = (e) => {
      console.error('[WS ERROR]', e);
      if (this.onErrorCallback) this.onErrorCallback('WebSocket Error');
    };

    this.ws.onclose = (event) => {
      console.warn(`[WS CLOSE] Qwen Realtime Disconnected. Code: ${event.code}, Reason: ${event.reason}, WasClean: ${event.wasClean}`);
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
        description: "Query the local Worldbook for information about characters, locations, or lore you don't know.",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "The keyword to search for in the Worldbook."
            }
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
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          silence_duration_ms: 500
        },
        tools: tools
      }
    };
    
    console.log('[WS SEND]', msg.type, msg);
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
    } else if (t === "response.audio_transcript.done") {
      // Delta streaming already built the text, but we can emit a done event just in case
      // Or we just rely on deltas.
    } else if (t === "response.function_call_arguments.done") {
      if (msg.name === "query_worldbook") {
        await this.handleFunctionCall(msg.call_id, msg.arguments);
      }
    } else if (t === "error") {
      if (this.onErrorCallback) this.onErrorCallback(msg.error.message);
    }
  }

  private async handleFunctionCall(callId: string, argsStr: string) {
    if (!this.worldbookEngine || !this.ws) return;
    try {
      const args = JSON.parse(argsStr);
      const results = this.worldbookEngine.query(args.keyword);
      const content = results.length > 0 ? results.join('\n') : "No relevant lore found.";
      
      const outputMsg = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: content
        }
      };
      console.log('[WS SEND]', outputMsg.type, outputMsg);
      this.ws.send(JSON.stringify(outputMsg));
      
      // Trigger a new response creation after sending tool output
      const createMsg = {
        type: "response.create"
      };
      console.log('[WS SEND]', createMsg.type, createMsg);
      this.ws.send(JSON.stringify(createMsg));
    } catch(e) {
      console.error(e);
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
    
    // Qwen outputs 24kHz PCM16 by default. But AudioContext might be 16kHz.
    // The browser will resample if we create an AudioBuffer with 24000 sample rate.
    const binary = atob(base64);
    const len = binary.length;
    const pcmData = new Int16Array(len / 2);
    
    for (let i = 0; i < len; i += 2) {
      pcmData[i/2] = binary.charCodeAt(i) | (binary.charCodeAt(i+1) << 8);
      // Handle signed
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
    
    // Schedule continuous playback
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
