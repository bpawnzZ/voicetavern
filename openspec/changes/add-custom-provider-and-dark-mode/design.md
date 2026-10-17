# Design

## Context

The six existing providers are duplex websocket speech-to-speech clients: the model does
reasoning *and* audio in one socket, so there is no separate LLM layer to configure. The
only plain-HTTP LLM call in the app today is card cleanup in `src/api/qwen_text.ts`,
hardcoded to `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` with
`qwen3.8-max`.

An OpenAI-compatible stack is the opposite shape: HTTP turn-based. Chat
(`/chat/completions`), transcription (`/audio/transcriptions`) and speech
(`/audio/speech`) are three separate requests. To fit the existing
`RealtimeVoiceClient` interface (`connect()` / `disconnect()` + `onMessage` callbacks) the
client owns a local turn loop instead of a socket.

## Decisions

### One new provider id, `custom`, rather than a parallel pipeline mode

`RealtimeVoiceClient` only requires `connect`/`disconnect`, and `client_factory` already
dispatches on provider id. A seventh case keeps the UI, store and ChatLayout unchanged in
shape: same mic button, same message callbacks, same error path. A separate "pipeline mode"
flag would have doubled the UI surface for no user-visible gain.

### Turn detection in the browser, no extra service

Audio is captured with `createScriptProcessor` (the pattern the GLM/Qwen clients already
use, and the one that works in WKWebView) at 16 kHz mono. A frame is "speech" when its RMS
exceeds `VAD_THRESHOLD`; a turn ends after `SILENCE_MS` of quiet following speech, with
`MIN_TURN_MS` guarding against click-sized blips. WAV (16-bit PCM) is written by hand —
~25 lines, no dependency, accepted by every `/audio/transcriptions` implementation.

The three constants are the calibration knob: real rooms and real phone mics are louder or
quieter than a desk test, so they are named constants at the top of the file rather than
magic numbers inline.

### TTS gets its own base URL and key

Speech endpoints are frequently a different service from chat (a local Piper/Kokoro
gateway next to a remote LLM). `ttsBaseUrl`/`ttsApiKey`/`ttsModel` fall back to the chat
values when blank, so the common single-endpoint case needs three fields, not six.

STT reuses the chat base URL and key with its own `sttModel` (default `whisper-1`) —
a third URL field is not worth it, and a gateway without transcription fails loudly with
the stage named.

### Streaming is out of scope

Replies are fetched non-streaming and spoken as one MP3. Streaming tokens would require
chunked TTS plus a playback queue for maybe a second of perceived latency; the existing UI
already renders whole messages. `ponytail:` if latency matters, stream chat deltas into a
sentence-splitter feeding sequential `/audio/speech` calls.

### Dark mode is a class on `<html>`, not a CSS-variable rewrite

`darkMode: 'class'` plus `dark:` variants is the idiomatic Tailwind route and needs no new
classes of abstraction. The palette is applied by a scripted pass over the existing
`bg-*/text-*/border-*` utilities so the diff stays mechanical and reviewable, and
`index.css` carries the base `html/body/#root` colors.

Theme choice lives in the same zustand store as every other preference, defaulting to
`matchMedia('(prefers-color-scheme: dark)')`, and is applied in a `useEffect` on
`document.documentElement`.

### Prompt stacking is data, not string concatenation

`assemblePrompt` previously concatenated with `+=`, which made order unchangeable and made
`{{system_prompt}}` substitution depend on whether the card happened to ship the token. It
now builds a `sections[]` array in the documented order and substitutes every block through
one `substitute()` helper, so a prompt the user adds behaves exactly like the built-in ones.

`WorldbookEngine.query()` existed but had no caller: only `getConstantEntries()` was passed
to assembly, so keyword-triggered lore never fired. Assembly now scans the card fields plus
the last 12 messages and merges `query()` results with the constants, de-duplicated.

`ponytail:` triggered entries are matched at connect time. Mid-conversation activation
would need per-turn re-assembly, which only the HTTP client can do — worth adding when
someone actually notices a keyword that should fire mid-call.

Auxiliary prompts are stored as one JSON array in local storage rather than a table: they
are a short ordered list read once per connection, and a schema would buy nothing.

## Risks

- **Safari/WKWebView audio quirks.** `ScriptProcessorNode` is deprecated but present; MP3
  playback via a blob URL needs a user gesture first, which the mic button provides.
- **Endpoint variance.** "OpenAI-compatible" ranges from exact clones to LiteLLM proxies
  that 404 on `/audio/transcriptions`. Errors name the failing stage; no silent retry.
- **Untestable in CI:** actual speech end-to-end needs a mic and a live endpoint. CI proves
  it compiles and the UI renders; the human proves the loop.
