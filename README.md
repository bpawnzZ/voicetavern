# VoiceTavern 🎙️

<p align="center">
  <b>A modern, ultra-low latency real-time voice chat app for SillyTavern character cards.</b><br>
  <b>全平台酒馆角色卡实时语音对话客户端 (macOS / Windows / Linux / Android / iOS)</b>
</p>

<p align="center">
  <a href="README_CN.md">🇨🇳 简体中文</a> | <a href="README.md">🇺🇸 English</a> | <a href="https://github.com/lukelzlz/voicetavern/releases">📦 Download Releases</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-blue?logo=tauri" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-purple?logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Platform-Desktop_%7C_Android_%7C_iOS-emerald" alt="Cross-Platform" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT" />
</p>

---

## 🌟 Key Features

- 📱 **Cross-Platform Native Apps**: Powered by **Tauri v2**. Available as standalone native binaries on **macOS** (`.dmg` / `.app`), **Windows** (`.exe` / `.msi`), **Linux** (`.AppImage` / `.deb`), **Android** (`.apk`), and **iOS** (unsigned `.ipa`).
- 🎙️ **6 Major Real-Time Audio Providers**: Seamlessly switch between cutting-edge full-duplex Speech-to-Speech models:
  - **OpenAI Realtime** (`gpt-4o-realtime-preview`)
  - **xAI Grok Voice** (`grok-voice-latest`)
  - **Google Gemini Multimodal Live** (`gemini-2.0-flash-exp`)
  - **Alibaba DashScope Qwen Realtime** (`qwen-audio-3.0-realtime-plus`)
  - **Volcengine Doubao (火山豆包)** (`doubao-realtime`)
  - **Zhipu GLM-Realtime (智谱清言)** (`glm-realtime`)
- 🎴 **Native SillyTavern Compatibility**: Seamlessly import V1/V2 PNG/JSON character cards. Automatically extracts embedded lorebooks (`character_book`), descriptions, scenarios, personalities, and custom system prompts.
- 🤖 **Lossless AI Card Purification (Qwen3.8-Max)**: Specially engineered for complex text-RPG cards. Cleanses voice-breaking XML tags (`<UpdateVariable>`, `<Analysis>`, `<summary>`), JSON wrappers, and stat-tracking mechanics while preserving 100% of personality, backstory, and dialogue styles.
- 📝 **Dual-Pane Side-by-Side Editor**: Compare raw extracted card data with the purified system prompt, with in-place manual editing support.
- 🗣️ **Voice-First Conversational Directives**: Built-in prompts tailored for verbal dialogue—enforcing concise responses, natural speech fillers, and suppressing non-verbal asterisk actions (`*smiles*`).
- 💾 **Local-First & Cross-Device Backup (`.vtbackup`)**: Native file persistence on your device. Export and restore full database backups to sync all character cards, worldbooks, and chat sessions across PC, Android, and iPhone in one click.

---

## 📥 Downloads & Installation

Pre-built binaries for all platforms are available on the [**GitHub Releases**](https://github.com/lukelzlz/voicetavern/releases) page:

| Platform | Download Format | Note |
|---|---|---|
| **macOS** | `.dmg` / `.app` | Apple Silicon (M-series) & Intel |
| **Windows** | `.exe` / `.msi` | 64-bit Windows Installer |
| **Linux** | `.AppImage` / `.deb` | Universal Linux AppImage |
| **Android** | `.apk` | Universal Android Package |
| **iOS** | `.ipa` (unsigned) | Sideload via AltStore / TrollStore / Sideloadly |

---

## 🚀 Quick Start (Web & Development)

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (>= 18.0.0)
- API key for at least one supported provider (DashScope, xAI, OpenAI, Gemini, Volcengine, or Zhipu GLM).

### 2. Run Development Server

```bash
# 1. Clone the repository
git clone https://github.com/lukelzlz/voicetavern.git
cd voicetavern

# 2. Install dependencies
npm install

# 3. Start Web development server
npm run dev

# Or launch as Tauri Desktop App
npm run tauri:dev
```

### 3. Build Web or Native Binaries

```bash
# Web Production Build
npm run build

# Tauri Desktop Build
npm run tauri:build

# Android APK Build
npm run tauri:android:build

# iOS Unsigned Build
npm run tauri:ios:build
```

---

## 📖 Usage Guide

1. **Configure Provider & Keys**:
   - Open the **⚙️ Settings** modal from the top bar.
   - Choose your preferred Realtime voice provider from the 6 provider cards.
   - Input your API Key (and App ID if using Volcengine), and pick your desired Voice.
2. **Import Character Cards**:
   - Drag and drop SillyTavern PNG or JSON character cards into the library sidebar.
3. **AI Purification (Optional)**:
   - Right-click on a card and select **"Edit"**.
   - Click **"🤖 AI One-Click Cleanse & Rewrite"** to strip non-verbal XML and game mechanics into clean voice prompts.
4. **Start Realtime Voice Call**:
   - Click the bottom **Microphone** button to connect and start talking with zero latency!

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
