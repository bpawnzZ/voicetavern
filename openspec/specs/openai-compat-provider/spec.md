# openai-compat-provider Specification

## Purpose
Lets the app talk to any OpenAI-compatible chat, speech-to-text and text-to-speech
endpoint the operator configures, instead of only the six built-in vendor protocols.

## Requirements

### Requirement: Custom provider is selectable alongside the built-in ones

The settings panel SHALL offer a `custom` provider named "Custom (OpenAI-compatible)" in
the provider grid, and selecting it SHALL reveal its endpoint fields.

#### Scenario: Selecting the custom provider shows its fields

- **WHEN** the user selects "Custom (OpenAI-compatible)" in Settings
- **THEN** base URL, API key, chat model, STT model, TTS base URL, TTS key, TTS model and TTS voice inputs are shown

#### Scenario: Settings persist across launches

- **WHEN** the user saves custom endpoint values and reopens the app
- **THEN** every field is restored from local storage

### Requirement: An OpenAI-compatible request uses the configured base URL

The custom provider SHALL send requests to `{baseUrl}/chat/completions` and
`{baseUrl}/audio/transcriptions`, and to `{ttsBaseUrl}/audio/speech` when a TTS base URL is
set, otherwise `{baseUrl}/audio/speech`.

#### Scenario: LLM call hits the configured host

- **WHEN** the user finishes a speaking turn
- **THEN** the chat completion request is sent to the configured base URL, not to a hardcoded vendor host

#### Scenario: TTS endpoint can differ from the chat endpoint

- **WHEN** a TTS base URL is configured
- **THEN** audio synthesis is requested from that URL and its own key/model are used

### Requirement: A speaking turn produces a spoken reply

Recorded microphone audio SHALL be transcribed, sent to the chat model with the assembled
system prompt, and the reply SHALL be synthesized and played back.

#### Scenario: Speak and hear a reply

- **WHEN** the user connects the custom provider and speaks a sentence
- **THEN** the transcript appears as a user message, the model reply appears as an assistant message, and its audio plays

#### Scenario: Turn ends on silence

- **WHEN** speech stops for the configured silence window
- **THEN** the recorded turn is finalized without requiring another button press

### Requirement: Endpoint failures are surfaced, not swallowed

A failed HTTP call SHALL surface an error message in the UI and stop the voice loop instead
of leaving the UI in a connected-but-dead state.

#### Scenario: Wrong base URL reports an error

- **WHEN** the configured endpoint returns a non-2xx response
- **THEN** an error banner names the failing stage and the connection is torn down

#### Scenario: Missing key blocks connecting

- **WHEN** the API key field is empty
- **THEN** connecting is refused with an instruction to set the key
