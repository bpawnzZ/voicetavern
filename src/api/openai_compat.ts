import type { RealtimeVoiceClient, ProviderConfig } from './types';

// Energy VAD calibration. Real rooms and phone mics are louder or quieter than a
// desk test, so these are the knobs to turn if turns cut off early or never end.
const VAD_THRESHOLD = 0.02; // RMS above this counts as speech
const SILENCE_MS = 700; // quiet this long after speech ends the turn
const MIN_TURN_MS = 250; // ignore blips shorter than this
const RATE = 16000; // what whisper-class endpoints expect

type MessageSink = (role: string, text: string, isDelta: boolean, id?: string) => void;

/** 16-bit PCM WAV. Every /audio/transcriptions implementation accepts this. */
function encodeWav(samples: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const tag = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  tag(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  tag(8, 'WAVE');
  tag(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  tag(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/** AudioContext sample rate is not always the rate we asked for (iOS likes 48k). */
function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

/**
 * OpenAI-compatible voice client: HTTP turns instead of a duplex socket.
 * mic -> (silence) -> /audio/transcriptions -> /chat/completions -> /audio/speech -> play
 */
export class OpenAICompatClient implements RealtimeVoiceClient {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: ScriptProcessorNode | null = null;
  private audio: HTMLAudioElement | null = null;

  private stopped = false;
  private busy = false; // transcribing/thinking/speaking — do not record
  private speaking = false;
  private turnStart = 0;
  private lastVoice = 0;
  private chunks: Float32Array[] = [];
  private history: Array<{ role: string; content: string }> = [];

  private config: ProviderConfig;
  private systemPrompt: string;
  private onMessage?: MessageSink;
  private onError?: (err: string) => void;

  constructor(
    config: ProviderConfig,
    systemPrompt: string,
    onMessage?: MessageSink,
    onError?: (err: string) => void
  ) {
    this.config = config;
    this.systemPrompt = systemPrompt;
    this.onMessage = onMessage;
    this.onError = onError;
  }

  private base(): string {
    return (this.config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  private ttsBase(): string {
    return (this.config.ttsBaseUrl || this.base()).replace(/\/+$/, '');
  }

  private ttsKey(): string {
    return this.config.ttsApiKey?.trim() || this.config.apiKey || '';
  }

  async connect(): Promise<void> {
    if (!this.config.apiKey?.trim()) {
      throw new Error('Set the custom provider API key in Settings first');
    }
    this.stopped = false;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext({ sampleRate: RATE });
    try {
      await this.ctx.resume();
    } catch {
      /* iOS resumes on the first gesture anyway */
    }
    this.startListening();
  }

  disconnect(): void {
    this.stopped = true;
    if (this.node) {
      this.node.onaudioprocess = null;
      this.node.disconnect();
      this.node = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.audio) {
      try {
        this.audio.pause();
      } catch {
        /* already gone */
      }
      this.audio = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.chunks = [];
    this.speaking = false;
    this.turnStart = 0;
  }

  private startListening(): void {
    if (!this.ctx || !this.stream) return;
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (e) => {
      if (this.stopped || this.busy) return;
      const frame = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
      const rms = Math.sqrt(sum / frame.length);
      const now = performance.now();

      this.chunks.push(new Float32Array(frame));
      if (rms > VAD_THRESHOLD) {
        this.speaking = true;
        this.lastVoice = now;
        if (!this.turnStart) this.turnStart = now;
        return;
      }
      if (this.speaking && now - this.lastVoice > SILENCE_MS) {
        const duration = now - this.turnStart;
        this.speaking = false;
        this.turnStart = 0;
        const pcm = this.concat();
        this.chunks = [];
        if (duration >= MIN_TURN_MS) {
          const rate = this.ctx ? this.ctx.sampleRate : RATE;
          this.busy = true;
          this.runTurn(downsample(pcm, rate, RATE))
            .catch((err: Error) => this.fail(err.message))
            .finally(() => {
              this.busy = false;
            });
        }
        return;
      }
      // Idle lead-in audio is useless and unbounded — drop it.
      if (!this.speaking && this.chunks.length > 40) this.chunks = [];
    };
    source.connect(this.node);
    this.node.connect(this.ctx.destination);
  }

  private concat(): Float32Array {
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const out = new Float32Array(total);
    let off = 0;
    for (const c of this.chunks) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  }

  private fail(message: string): void {
    this.onError?.(message);
    this.disconnect();
  }

  private async runTurn(pcm: Float32Array): Promise<void> {
    const form = new FormData();
    form.append('file', encodeWav(pcm, RATE), 'turn.wav');
    form.append('model', this.config.sttModel || 'whisper-1');
    const stt = await this.postForm('/audio/transcriptions', form);
    const text = String(stt?.text || '').trim();
    if (!text) return; // noise, not speech
    this.onMessage?.('user', text, false);

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.history,
      { role: 'user', content: text },
    ];
    const chat = await this.postJson('/chat/completions', {
      model: this.config.model || 'gpt-4o-mini',
      messages,
    });
    const reply = String(chat?.choices?.[0]?.message?.content || '').trim();
    if (!reply) return;

    this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
    if (this.history.length > 20) this.history = this.history.slice(-20);

    this.onMessage?.('assistant', reply, false);
    await this.speak(reply);
  }

  private async postJson(path: string, body: unknown): Promise<any> {
    const res = await fetch(this.base() + path, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    return res.json();
  }

  private async postForm(path: string, body: FormData): Promise<any> {
    const res = await fetch(this.base() + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
      body,
    });
    if (!res.ok) {
      throw new Error(`${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    return res.json();
  }

  private async speak(text: string): Promise<void> {
    const res = await fetch(this.ttsBase() + '/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.ttsKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.ttsModel || 'tts-1',
        voice: this.config.voice || 'alloy',
        input: text,
        response_format: 'mp3',
      }),
    });
    if (!res.ok) {
      throw new Error(`/audio/speech failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    const url = URL.createObjectURL(await res.blob());
    await new Promise<void>((resolve) => {
      const el = new Audio(url);
      this.audio = el;
      const done = () => {
        URL.revokeObjectURL(url);
        this.audio = null;
        resolve();
      };
      el.onended = done;
      el.onerror = done;
      el.play().catch(done);
      if (this.stopped) done();
    });
  }
}
