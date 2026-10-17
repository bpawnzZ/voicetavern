# Proposal

## Why

VoiceTavern only speaks the six vendors' own realtime speech-to-speech protocols, each
hardcoded to a fixed host and to that vendor's model names. There is no way to point it
at a self-hosted or gateway endpoint: no LLM base URL, no separate TTS endpoint, no model
field the user controls. Anyone running an OpenAI-compatible stack (LiteLLM, vLLM, LocalAI,
OpenAI itself) cannot use the app at all. Separately the UI is light-only.

## What Changes

- Add a seventh provider, **`custom` — "Custom (OpenAI-compatible)"**: the user supplies a
  base URL, API key, chat model, STT model, and an optional **separate TTS endpoint**
  (base URL, key, model, voice). Everything speaks the OpenAI HTTP API:
  `POST {baseUrl}/audio/transcriptions`, `POST {baseUrl}/chat/completions`,
  `POST {ttsBaseUrl}/audio/speech`.
- Because the protocol is turn-based HTTP rather than a duplex websocket, the custom
  provider runs a local voice loop: mic → energy-based end-of-turn detection → STT → chat →
  TTS → playback, repeating until disconnected.
- Add a **dark theme** with a header toggle, persisted, defaulting to the OS preference.
- Extend `ProviderConfig` with the optional endpoint fields; existing providers ignore them.

Not in scope: streaming token-by-token rendering, barge-in during playback, per-provider
proxy settings, redesigning the other six clients.

## Capabilities

### New Capabilities
- `openai-compat-provider`: a configurable OpenAI-compatible chat + STT + TTS voice
  provider, usable without any vendor-specific protocol.
- `app-theme`: light/dark appearance selection that persists across launches.
- `prompt-stack`: editable main prompt, importable auxiliary prompt blocks with explicit
  position and order, and a defined stacking order against the character card and
  world book — including keyword-triggered lore entries, which never fired before.

### Modified Capabilities
<!-- none: the existing realtime providers keep their behavior -->

## Impact

- `src/api/types.ts` — `VoiceProvider` union, `ProviderConfig` fields, `PROVIDERS` entry.
- `src/api/openai_compat.ts` — **new** client implementing `RealtimeVoiceClient`.
- `src/api/client_factory.ts` — one new case.
- `src/store/index.ts` — custom defaults + theme state.
- `src/App.tsx`, `src/components/*` — settings fields, theme toggle, dark variants.
- `tailwind.config.js`, `src/index.css` — class-based dark mode.
- No new npm dependencies; mic capture, WAV encoding and playback use platform APIs
  (`getUserMedia`, `AudioContext`, `Audio`), matching what the existing clients already do.
