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
  private isClosedManually: boolean = false;

  constructor(
    url: string,
    options?: UniversalWebSocketOptions
  ) {
    this.url = url;
    this.options = options;
    this.isApp = isTauri();
  }

  public async connect(): Promise<void> {
    this.isClosedManually = false;
    if (this.isApp) {
      console.log('[UniversalWebSocket] Connecting via Tauri Native Plugin to:', this.url);
      try {
        this.tauriWs = await TauriWebSocket.connect(this.url, {
          headers: this.options?.headers
        });

        this.readyState = 1;

        this.tauriWs.addListener((msg) => {
          if (this.isClosedManually) return;
          if (msg.type === 'Text' && typeof msg.data === 'string') {
            if (this.onmessage) this.onmessage({ data: msg.data });
          } else if (msg.type === 'Close') {
            this.readyState = 3;
            if (this.onclose) {
              this.onclose({
                code: msg.data?.code ?? 1000,
                reason: msg.data?.reason ?? 'Closed by server'
              });
            }
          }
        });

        if (this.onopen) this.onopen();
      } catch (err: any) {
        console.error('[UniversalWebSocket] Tauri connect failed:', err);
        this.readyState = 3;
        const errMsg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
        if (this.onerror) this.onerror(errMsg);
        if (this.onclose) this.onclose({ code: 1006, reason: errMsg });
        throw new Error(errMsg || 'WebSocket connection failed');
      }
    } else {
      console.log('[UniversalWebSocket] Connecting via Browser WebSocket to:', this.url);
      return new Promise<void>((resolve, reject) => {
        try {
          this.browserWs = new WebSocket(this.url);
          this.browserWs.onopen = () => {
            this.readyState = 1;
            if (this.onopen) this.onopen();
            resolve();
          };
          this.browserWs.onmessage = (event) => {
            if (this.onmessage && !this.isClosedManually) this.onmessage(event);
          };
          this.browserWs.onerror = (err) => {
            console.error('[UniversalWebSocket] Browser WS error:', err);
            if (this.onerror && !this.isClosedManually) this.onerror('WebSocket Error');
            if (this.readyState === 0) {
              reject(new Error('WebSocket connection error'));
            }
          };
          this.browserWs.onclose = (event) => {
            this.readyState = 3;
            if (this.onclose && !this.isClosedManually) this.onclose(event);
          };
        } catch (err) {
          console.error('[UniversalWebSocket] Browser connect failed:', err);
          this.readyState = 3;
          if (this.onerror) this.onerror(err);
          reject(err);
        }
      });
    }
  }

  public send(data: string) {
    if (this.isClosedManually || this.readyState !== 1) return;
    if (this.isApp && this.tauriWs) {
      this.tauriWs.send(data).catch((e) => {
        console.error('[UniversalWebSocket] Tauri send error:', e);
      });
    } else if (this.browserWs && this.browserWs.readyState === WebSocket.OPEN) {
      this.browserWs.send(data);
    }
  }

  public close() {
    this.isClosedManually = true;
    this.readyState = 2;
    if (this.isApp && this.tauriWs) {
      this.tauriWs.disconnect().catch(() => {});
      this.tauriWs = undefined;
    } else if (this.browserWs) {
      this.browserWs.close();
      this.browserWs = undefined;
    }
    this.readyState = 3;
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Client Disconnected' });
    }
  }
}
