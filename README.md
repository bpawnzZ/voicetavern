# VoiceTavern 🎙️

<p align="center">
  <b>A modern, ultra-low latency real-time voice chat frontend for SillyTavern character cards.</b>
</p>

<p align="center">
  <a href="README_CN.md">🇨🇳 简体中文</a> | <a href="README.md">🇺🇸 English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-purple?logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/DashScope-Realtime_Audio-teal?logo=alibabacloud" alt="DashScope Realtime" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT" />
</p>

---

## 🌟 Key Features

- 🎙️ **Full-Duplex Real-Time Voice Chat**: Built on Alibaba DashScope Realtime Audio WebSocket API (`qwen-audio-3.0-realtime-plus` / `qwen-omni-turbo`) for ultra-low latency, natural voice-to-voice conversation.
- 🎴 **Native SillyTavern Card Support**: Seamlessly import V1/V2 PNG/JSON character cards. Automatically extracts embedded lorebooks (`character_book`), descriptions, scenarios, personalities, and custom system prompts.
- 🤖 **Lossless AI Card Purification (Qwen3.8-Max)**: Specially engineered for complex text-RPG cards. Automatically cleanses voice-breaking XML tags (`<UpdateVariable>`, `<Analysis>`, `<summary>`), JSON wrappers, and stat-tracking mechanics while preserving 100% of personality, backstory, and dialogue styles.
- 📝 **Dual-Pane Side-by-Side Comparison Editor**: Compare raw extracted card data with the purified system prompt, with full in-place manual editing capabilities.
- 🗣️ **Voice-First Conversational Directives**: Built-in prompts tailored for verbal dialogue—enforcing concise responses (1-2 sentences per turn), natural speech fillers (e.g., *uh, um, well*), and suppressing non-verbal asterisk actions (`*smiles*`).
- 🏷️ **Dynamic Placeholder Replacement**: Configure your custom user name in settings with automatic mapping for `{{user}}`, `<user>`, and `{{char}}`.
- 🔒 **Local-First & Privacy Guaranteed**: API keys, cards, worldbooks, and session records are stored strictly on your device via IndexedDB (`localforage`). No intermediate servers.
- 📦 **Library & Session Management**: Reorder cards via drag-and-drop (`@dnd-kit`), batch management, and persistent multi-session chat history.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite 8
- **Styling**: TailwindCSS, Lucide Icons
- **State Management & Storage**: Zustand, localforage (IndexedDB)
- **Drag and Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Realtime Audio & AI**: Alibaba DashScope WebSocket Realtime Audio API, Qwen Max Completion API

---

## 🚀 Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (>= 18.0.0)
- DashScope API Key with access to Qwen Realtime Audio models (Get one from [Alibaba Cloud DashScope Console](https://bailian.console.aliyun.com/)).

### 2. Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/lukelzlz/voicetavern.git
cd voicetavern

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### 3. Production Build

```bash
npm run build
npm run preview
```

---

## 📖 Usage Guide

1. **Setup Key & User Profile**:
   - Click the **⚙️ Settings** icon in the top-right corner.
   - Enter your `DashScope API Key` and specify your **User Name** (for placeholder substitution).
2. **Import Character Cards**:
   - In the left sidebar, click **"Import Resource"** or drag-and-drop PNG / JSON character cards into the window.
3. **AI One-Click Card Purification (Optional)**:
   - Right-click on a character card and select **"Edit"**.
   - Click **"🤖 AI One-Click Cleanse & Rewrite"**. Qwen-Max will strip complex XML formats into clean, voice-ready system prompts.
   - Review or tweak the prompt in the right-hand panel, then click **"Save Changes"**.
4. **Start Voice Call**:
   - Select the character, click the **Microphone** button at the bottom to establish the WebSocket connection, and start speaking!

---

## 📂 Project Structure

```text
voicetavern/
├── src/
│   ├── api/                 # DashScope API integration
│   │   ├── qwen_realtime.ts # Realtime Audio WebSocket client
│   │   └── qwen_text.ts     # Qwen-Max card cleansing & lossless purification
│   ├── components/          # UI Components
│   │   ├── ChatLayout.tsx   # Main voice chat & layout
│   │   └── LibrarySidebar.tsx # Card library, worldbook & session sidebar
│   ├── store/               # Zustand state & persistence
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── audio_recorder.ts# Audio stream recording & resampling
│   │   ├── preset_engine.ts # Prompt assembly & voice prompt injection
│   │   ├── storage.ts       # localforage storage wrapper
│   │   ├── tavern_parser.ts # PNG tEXt Chunk parser & card decoder
│   │   └── worldbook_engine.ts # Worldbook parser
│   ├── App.tsx              # Application entry & modals
│   ├── index.css            # Tailwind stylesheet
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
