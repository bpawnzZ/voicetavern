# VoiceTavern 🎙️

<p align="center">
  <b>全平台酒馆角色卡超低延迟实时语音通话客户端</b><br>
  <b>支持 macOS / Windows / Linux AppImage / Android / iOS</b>
</p>

<p align="center">
  <a href="README_CN.md">🇨🇳 简体中文</a> | <a href="README.md">🇺🇸 English</a> | <a href="https://github.com/lukelzlz/voicetavern/releases">📦 下载全平台安装包</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-blue?logo=tauri" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-purple?logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Platform-桌面端_%7C_安卓_%7C_iOS-emerald" alt="Cross-Platform" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT" />
</p>

---

## 🌟 核心特性

- 📱 **全平台原生 App 支持**：基于 **Tauri v2** 轻量级原生架构，全面支持 **macOS** (`.dmg` / `.app`)、**Windows** (`.exe` / `.msi`)、**Linux** (`.AppImage` / `.deb`)、**Android** (`.apk`) 与 **iOS** (未签名 `.ipa`)。
- 🎙️ **6 大主流实时语音大模型支持**：
  - **OpenAI Realtime** (`gpt-4o-realtime-preview`)
  - **xAI Grok Voice** (`grok-voice-latest` Speech-to-Speech)
  - **Google Gemini Live** (`gemini-2.0-flash-exp` Multimodal Live)
  - **阿里云通义千问 (Qwen Realtime)** (`qwen-audio-3.0-realtime-plus`)
  - **火山引擎豆包 (Volcengine Doubao)** (`doubao-realtime`)
  - **智谱清言 (Zhipu GLM-Realtime)** (`glm-realtime`)
- 🎴 **原生兼容酒馆生态**：支持直接拖拽导入标准 V1 / V2 格式 PNG/JSON 角色卡，自动解析内嵌的 Character Book（世界书常驻条目）、性格、场景与提示词。
- 🤖 **AI 一键无损清洗 (Qwen3.8-Max)**：专为复杂文字 RPG 角色卡打造。一键剔除对语音对话有害的 XML 标签（如 `<UpdateVariable>`、`<Analysis>`、`<summary>`）和数值追踪规则，100% 完整保留角色背景、多重人格与说话口吻！
- 📝 **双栏对比编辑器**：提供“转写前（原始提取设定）”与“转写后（最终系统提示词）”的双栏对照视图，支持即时手动微调与二次修改。
- 🗣️ **语音专属优化指令**：内置 VoiceTavern 语音引擎，强制控制 AI 输出短平快，自动加入口语语气词（嗯、啊、哎），自动压制星号动作（`*smiles*`）朗读。
- 💾 **本地原生存储与跨端全量迁移 (`.vtbackup`)**：数据和 API 凭据直接保存在用户本地设备沙盒中。支持一键导出/导入 `.vtbackup` 备份文件，方便在电脑、安卓手机与 iPhone 之间一键同步所有角色卡与聊天记录。

---

## 📥 安装包下载 (Releases)

前往 [**GitHub Releases 发布页**](https://github.com/lukelzlz/voicetavern/releases) 即可下载最新版本的预编译安装包：

| 平台 | 安装包格式 | 说明 |
|---|---|---|
| **macOS** | `.dmg` / `.app` | 原生支持 Apple Silicon (M系列芯片) 与 Intel |
| **Windows** | `.exe` / `.msi` | 64位 Windows 原生安装程序 |
| **Linux** | `.AppImage` / `.deb` | 免安装单文件 AppImage，赋予执行权限即可运行 |
| **Android** | `.apk` | 通用安卓安装包 |
| **iOS** | `.ipa` (未签名) | 支持通过 AltStore / TrollStore / 巨魔 / 证书一键侧载安装 |

---

## 🚀 本地开发与编译指南

### 1. 前置准备

- [Node.js](https://nodejs.org/) (>= 18.0.0)
- 至少一家支持的实时语音服务 API Key（OpenAI / xAI / 阿里云百炼 / Gemini / 火山引擎 / 智谱）

### 2. 启动开发环境

```bash
# 1. 克隆本仓库
git clone https://github.com/lukelzlz/voicetavern.git
cd voicetavern

# 2. 安装依赖
npm install

# 3. 启动 Web 开发服务
npm run dev

# 或以 Tauri 桌面模式启动
npm run tauri:dev
```

### 3. 构建多平台安装包

```bash
# 构建 Web 生产版本
npm run build

# 构建桌面端 (DMG / EXE / AppImage)
npm run tauri:build

# 构建安卓 APK
npm run tauri:android:build

# 构建 iOS 未签名 IPA
npm run tauri:ios:build
```

---

## 📖 使用指南

1. **选择提供商并填写密钥**:
   - 点击右上角的 **⚙️ 设置** 图标。
   - 在 6 大提供商卡片中点击选择你想要使用的服务，填入 API Key 并选择对应音色。
2. **导入角色卡**:
   - 在左侧资料库中点击 **“导入资源”** 或直接拖拽 PNG / JSON 角色卡文件到页面中。
3. **AI 一键清洗（可选）**:
   - 右键角色卡选择 **“编辑”** -> 点击 **“🤖 AI 一键清洗与重写”** 净化复杂格式。
4. **开启实时通话**:
   - 选择角色，点击底部的 **麦克风** 按钮连接语音，即可开启实时低延迟连麦对话！

---

## 📄 开源许可

本项目采用 [MIT License](LICENSE) 许可证开源。
