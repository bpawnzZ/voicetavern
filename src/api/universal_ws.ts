import { isTauri } from './utils';
import TauriWebSocket from '@tauri-apps/plugin-websocket';

export interface UniversalWebSocketOptions {
  headers?: Record<string, string>;
}

export class UniversalWebSocket {
  public onopen?: () => void;
  public onmessage?: (event: { data: string }) => void;
  public onerror?: (err: any) => void;
  public onclose?: (event: { code: number; reason: string }) => void;
  
  public readyState: number = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED

  private url: string;
  private options?: UniversalWebSocketOptions;
  private browserWs?: WebSocket;
  private tauriWs?: TauriWebSocket;
  private isApp: boolean;

  constructor(
    url: string,
    options?: UniversalWebSocketOptions
  ) {
    this.url = url;
    this.options = options;
    this.isApp = isTauri();
  }

  public async connect(): Promise<void> {
    if (this.isApp) {
      try {
        console.log('[UniversalWebSocket] Connecting via Tauri Native Plugin to:', this.url, 'with headers:', this.options?.headers);
        this.tauriWs = await TauriWebSocket.connect(this.url, {
          headers: this.options?.headers
        });

        this.readyState = 1;
        if (this.onopen) this.onopen();

        this.tauriWs.addListener((msg) => {
          if (msg.type === 'Text' && typeof msg.data === 'string') {
            if (this.onmessage) this.onmessage({ data: msg.data });
          } else if (msg.type === 'Close') {
            this.readyState = 3;
            if (this.onclose) {
              this.onclose({
                code: msg.data?.code ?? 1000,
                reason: msg.data?.reason ?? 'Closed'
              });
            }
          }
        });
      } catch (err) {
        console.error('[UniversalWebSocket] Tauri connect failed:', err);
        this.readyState = 3;
        if (this.onerror) this.onerror(err);
        if (this.onclose) this.onclose({ code: 1006, reason: String(err) });
      }
    } else {
      console.log('[UniversalWebSocket] Connecting via Browser WebSocket to:', this.url);
      try {
        this.browserWs = new WebSocket(this.url);
        this.browserWs.onopen = () => {
          this.readyState = 1;
          if (this.onopen) this.onopen();
        };
        this.browserWs.onmessage = (event) => {
          if (this.onmessage) this.onmessage(event);
        };
        this.browserWs.onerror = (err) => {
          if (this.onerror) this.onerror(err);
        };
        this.browserWs.onclose = (event) => {
          this.readyState = 3;
          if (this.onclose) this.onclose(event);
        };
      } catch (err) {
        console.error('[UniversalWebSocket] Browser connect failed:', err);
        this.readyState = 3;
        if (this.onerror) this.onerror(err);
      }
    }
  }

  public send(data: string) {
    if (this.isApp && this.tauriWs) {
      this.tauriWs.send(data).catch((e) => {
        console.error('[UniversalWebSocket] Tauri send error:', e);
      });
    } else if (this.browserWs && this.browserWs.readyState === WebSocket.OPEN) {
      this.browserWs.send(data);
    }
  }

  public close() {
    this.readyState = 2;
    if (this.isApp && this.tauriWs) {
      this.tauriWs.disconnect().catch(() => {});
      this.readyState = 3;
    } else if (this.browserWs) {
      this.browserWs.close();
      this.readyState = 3;
    }
  }
}
