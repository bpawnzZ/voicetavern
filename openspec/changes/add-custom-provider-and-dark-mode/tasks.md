# Tasks

## 1. Types and config surface

- [x] 1.1 Add `custom` to the `VoiceProvider` union and `PROVIDERS` (name "Custom (OpenAI-compatible)")
- [x] 1.2 Extend `ProviderConfig` with `baseUrl`, `sttModel`, `ttsBaseUrl`, `ttsApiKey`, `ttsModel`
- [x] 1.3 Give `custom` sensible defaults in the store (empty base URL, gpt-4o-mini, whisper-1, tts-1, alloy)

## 2. Custom client

- [x] 2.1 `src/api/openai_compat.ts`: mic capture at 16 kHz mono via ScriptProcessor
- [x] 2.2 Energy VAD with named `VAD_THRESHOLD` / `SILENCE_MS` / `MIN_TURN_MS` constants
- [x] 2.3 Hand-rolled 16-bit PCM WAV encoder (+ downsample when the device ignores 16 kHz)
- [x] 2.4 `POST {baseUrl}/audio/transcriptions` → user message
- [x] 2.5 `POST {baseUrl}/chat/completions` with system prompt + rolling history → assistant message
- [x] 2.6 `POST {ttsBaseUrl||baseUrl}/audio/speech` with its own key/model → MP3 playback
- [x] 2.7 Stage-named errors via `onError`; the loop stops on failure
- [x] 2.8 Clean `disconnect()`: tracks stopped, context closed, audio paused

## 3. Wire it up

- [x] 3.1 `client_factory`: one `case 'custom'`
- [x] 3.2 Settings panel: base URL, chat model, STT model, TTS base URL/key/model, free-text voice
- [x] 3.3 Provider grid label counts itself instead of hardcoding "6"
- [x] 3.4 Card cleanup (`qwen_text.ts`) takes base URL + model from the configured endpoint instead of hardcoded DashScope

## 4. Dark mode

- [x] 4.1 `darkMode: 'class'` in tailwind config; base dark colors in `index.css`
- [x] 4.2 `darkMode` state in the store, persisted, defaulting to the OS preference
- [x] 4.3 Header toggle (sun/moon) applying the class to `<html>`
- [x] 4.4 Mechanical `dark:` variant pass over App, ChatLayout, LibrarySidebar (207 variants)

## 5. Prompt stack

- [x] 5.1 `AuxPrompt` model + `parseAuxPromptImport` accepting ST presets, arrays and single objects
- [x] 5.2 Store: `mainPrompt` + `auxPrompts`, persisted
- [x] 5.3 `PromptManager` UI: main prompt with reset, per-prompt enable/name/position/order/delete, add, import
- [x] 5.4 `assemblePrompt` rewritten to the documented section order, with substitution in every block
- [x] 5.5 Lang like `{}` placeholders substituted in aux prompts and lore too
- [x] 5.6 Call `WorldbookEngine.query()` so keyword-triggered entries fire (previously dead code)
- [x] 5.7 Node self-check: import shapes + section ordering + dedupe + disabled exclusion

## 6. Verify

- [x] 6.1 `npm run build` passes (tsc + vite)
- [x] 6.2 Render both themes in a real browser; dark body `rgb(2,6,23)`, modal `rgb(15,23,42)`, inputs dark with light text
- [x] 6.3 Custom provider fields and the prompt manager both render in the modal
- [ ] 6.4 Build the IPA in CI and verify the bundle as in the previous change
