# GPT Advanced ✨

A feature-rich AI chat app built with **React + Vite**, supporting multiple AI providers, voice I/O, document chat, news/weather, and an Android build via Capacitor.

![Dark Theme](https://img.shields.io/badge/Theme-Dark-1a1a2e?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square)
![Android](https://img.shields.io/badge/Android-Capacitor-3ddc84?style=flat-square)

---

## ✨ Features

### 🤖 Multi-Provider AI
- **OpenAI** — GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo, o1-mini
- **OpenRouter** — 200+ models via one API key; curated SLM list including Mistral, Gemma 3, Qwen 2.5/3, Phi-4, Llama 3.x, DeepSeek R1, Zephyr and more
- **Google Gemini** — Gemini 3, 2.5, 2.0, 1.5 series (Flash & Pro); free tier available
- **Hugging Face** — Llama 3, Qwen 2.5, DeepSeek R1 Distill; free tier available
- **Ollama** — Run models fully locally (Llama, Mistral, Phi, Gemma, Qwen)
- **Multi-key fallback** — if the active provider fails, automatically tries other enabled keys

### 🎙️ Voice I/O
- **Voice input** — click the mic button and speak; live transcription streams into the text box using the browser Web Speech API (no extra key needed)
- **Read aloud** — speaker button on every AI message reads the response using Speech Synthesis (markdown stripped automatically for natural speech)

### 📄 Document Chat
- Upload **PDF, DOCX, TXT, CSV, JSON, XML, YAML, MD** and more (up to 10 MB)
- Document text is injected as context so you can ask questions about your files
- Per-conversation document management — add/remove files mid-chat
- Document chips in the input bar show what's currently attached

### 💬 Chat Experience
- **Streaming responses** — real-time token streaming with typing indicators
- **Markdown rendering** — headers, tables, lists, bold, italics, code
- **Syntax-highlighted code blocks** — with one-click copy
- **Image upload** — attach images for visual analysis (GPT-4o / Gemini vision)
- **Conversation management** — create, rename, delete; persisted to localStorage
- Smart grouping in sidebar: Today / This week / Older

### 🧠 Mini GPT
Select any text in an AI response to open a floating mini-chatbot:
1. Highlight text → click "Ask Mini GPT"
2. Get an instant explanation in a side panel
3. Ask follow-up questions — it's a full chat, not just a tooltip
4. Explanations are saved as **highlight annotations** you can click to re-read any time

### 📰 News & Weather
- **Reddit news** — live trending topics, no API key required
- **NewsAPI.org** — optional key for richer news sources
- **Weather widget** — current conditions via Open-Meteo (no key needed)
- "Ask AI" button on news cards to pull a story directly into chat

### 📱 Android App
Full Android build via **Capacitor**:
```bash
npm run android:run   # build → sync → run on device/emulator
npm run android:open  # open in Android Studio
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- An API key from at least one supported provider (see table below)

### Installation

```bash
git clone https://github.com/bruce249/gpt-advanced.git
cd gpt-advanced
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the setup screen will guide you through adding your first API key.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🔑 Supported Providers

| Provider | Free Tier | Key Format | Get Key |
|----------|-----------|------------|---------|
| **OpenAI** | No | `sk-...` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **OpenRouter** | Yes (some models) | `sk-or-v1-...` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Google Gemini** | ✅ Yes | `AIzaSy...` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Hugging Face** | ✅ Yes | `hf_...` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| **Ollama** | ✅ Local | *(none)* | [ollama.com](https://ollama.com) |

### OpenRouter SLMs included
Mistral 7B / Nemo / Small · Gemma 3 (4B / 12B / 27B) · Qwen 2.5 (7B / 14B / 72B) · Qwen3 (8B / 14B) · Phi-3.5 Mini · Phi-4 Mini · Phi-4 · Llama 3.2 (1B / 3B) · Llama 3.1 8B · Llama 3.3 70B · DeepSeek R1 Distill (8B / 14B) · Zephyr 7B

---

## 📁 Project Structure

```
src/
├── api/
│   ├── gemini.js          # Google Gemini SDK integration
│   ├── openai.js          # OpenAI API (streaming)
│   ├── openrouter.js      # OpenRouter API (OpenAI-compatible)
│   ├── huggingface.js     # Hugging Face Inference API
│   ├── ollama.js          # Local Ollama endpoint
│   ├── news.js            # Reddit + NewsAPI integration
│   └── weather.js         # Open-Meteo weather API
├── components/
│   ├── App.jsx            # Root layout
│   ├── ChatArea.jsx       # Main chat view
│   ├── ChatInput.jsx      # Input bar (text, image, doc, voice)
│   ├── MessageBubble.jsx  # Message renderer + Mini GPT + read aloud
│   ├── MiniGpt.jsx        # Floating mini-chatbot panel
│   ├── Sidebar.jsx        # Conversation list
│   ├── DocumentPanel.jsx  # Document management panel
│   ├── NewsPanel.jsx      # News & weather panel
│   ├── WeatherWidget.jsx  # Weather display
│   ├── SettingsModal.jsx  # API key management
│   ├── SetupScreen.jsx    # First-time onboarding
│   └── WelcomeScreen.jsx  # Empty state
├── context/
│   └── ChatContext.jsx    # Global state & provider routing
├── hooks/
│   └── useVoice.js        # Web Speech API (recognition + synthesis)
├── utils/
│   └── documentParser.js  # PDF / DOCX / text extraction
├── App.jsx
├── main.jsx
└── index.css              # Complete design system (dark theme)
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source under the [MIT License](LICENSE).