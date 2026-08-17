# VoiceTavern 🎙️

<p align="center">
  <b>基于阿里云通义千问 Realtime 实时语音大模型与 Qwen-Max 的酒馆角色卡语音对话系统。</b>
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

## 🌟 核心特性

- 🎙️ **全双工实时语音交互**：基于通义千问 Realtime (`qwen-audio-3.0-realtime-plus` / `qwen-omni-turbo`) WebSocket 协议，实现真人级别的超低延迟连麦通话体验。
- 🎴 **原生兼容酒馆角色卡**：支持直接拖拽导入标准 V1 / V2 格式的 PNG/JSON 角色卡，自动解析嵌入的 Character Book（世界书常驻条目）、Personality、Scenario 与 System Prompt。
- 🤖 **AI 一键无损清洗 (Qwen3.8-Max)**：专为复杂文字 RPG 角色卡打造。通过 Qwen-Max 智能剔除对语音对话有害的 XML 标签（如 `<UpdateVariable>`、`<Analysis>`、`<summary>`）和数值追踪规则，100% 保留角色背景、多重人格与说话风格。
- 📝 **双栏对比编辑器**：提供“转写前（原始提取信息）”与“转写后（最终系统提示词）”的双栏对照视图，支持即时手动微调与二次编辑。
- 🗣️ **语音专属优化指令**：内置 VoiceTavern 语音引擎，强制控制 AI 输出简短、自然、富有感情，自动加入口语语气词（嗯、啊、哎），避免朗读星号动作（`*smiles*`）。
- 🏷️ **灵活的称呼与变量替换**：支持在设置中自定义用户昵称，自动匹配替换 `{{user}}`、`<user>`、`{{char}}` 等占位符。
- 🔒 **本地优先与隐私安全**：API 密钥、角色卡库、世界书及历史对话完全保存在浏览器本地（`localforage` / IndexedDB），不经过任何第三方服务器中转。
- 📦 **拖拽管理与会话存档**：支持角色卡拖拽自由排序、批量删除管理，以及历史多会话随时切换与重命名。

---

## 🛠️ 技术栈

- **前端核心**：React 19, TypeScript, Vite 8
- **样式与图标**：TailwindCSS, Lucide Icons
- **状态管理与存储**：Zustand, localforage (IndexedDB)
- **拖拽排序**：`@dnd-kit/core`, `@dnd-kit/sortable`
- **实时音频与 AI**：阿里云百炼 DashScope WebSocket Realtime Audio API, Qwen Max 文本补全 API

---

## 🚀 快速上手

### 1. 前置准备

- [Node.js](https://nodejs.org/) (>= 18.0.0)
- 阿里云百炼 / DashScope API Key（开通通义千问 Realtime 语音模型权限，前往 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 获取）

### 2. 安装与运行

```bash
# 1. 克隆本仓库
git clone https://github.com/lukelzlz/voicetavern.git
cd voicetavern

# 2. 安装依赖
npm install

# 3. 启动本地开发服务
npm run dev
```

打开浏览器访问 `http://localhost:5173`。

### 3. 构建生产版本

```bash
npm run build
npm run preview
```

---

## 📖 使用指南

1. **配置密钥 (Setup Key)**:
   - 首次打开应用后，点击右上角的 **⚙️ 设置** 图标。
   - 输入您的 `DashScope API Key`，以及希望角色称呼您的 **用户昵称**。
2. **导入角色卡 (Import Character)**:
   - 在左侧资料库中，点击 **“导入资源”** 或直接将 PNG / JSON 角色卡文件拖入页面。
3. **AI 一键清洗（可选 / Optional）**:
   - 右键点击角色卡选择 **“编辑”**。
   - 点击左下角 **“🤖 AI 一键清洗与重写”**，大模型将自动剔除复杂的 XML 格式并重写为纯粹的语音系统提示词。
   - 在右侧面板中确认或微调提示词后，点击 **“保存修改”**。
4. **开始连麦通话 (Start Voice Call)**:
   - 选择角色卡，点击底部的 **麦克风** 按钮连接语音。
   - 开启麦克风权限后，即可与角色进行实时语音对话！

---

## 📂 项目结构

```text
voicetavern/
├── src/
│   ├── api/                 # DashScope 文本与处理 API
│   │   ├── qwen_realtime.ts # Realtime 实时语音客户端
│   │   └── qwen_text.ts     # Qwen-Max 角色卡清洗与无损重写
│   ├── components/          # UI 组件
│   │   ├── ChatLayout.tsx   # 核心聊天与语音交互主界面
│   │   └── LibrarySidebar.tsx # 角色卡库、世界书与会话管理侧边栏
│   ├── store/               # Zustand 全局状态管理与持久化
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── audio_recorder.ts# 音频流采集与重采样
│   │   ├── preset_engine.ts # 酒馆提示词组装与 Voice 优化引擎
│   │   ├── storage.ts       # localforage 本地存储封装
│   │   ├── tavern_parser.ts # PNG tEXt Chunk 解析与角色卡解码
│   │   └── worldbook_engine.ts # 世界书解析
│   ├── App.tsx              # 应用入口与全局弹窗
│   ├── index.css            # Tailwind 样式定义
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 开源许可

本项目采用 [MIT License](LICENSE) 许可证开源。
