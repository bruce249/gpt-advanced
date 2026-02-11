# GPT Advanced ✨

A ChatGPT clone built with React + Vite, featuring a unique **Mini GPT** chatbot for instant text explanations.

![Dark Theme](https://img.shields.io/badge/Theme-Dark-1a1a2e?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square)

## ✨ Features

- 🤖 **Multi-Provider Support** — OpenAI, Google Gemini, Hugging Face (bring your own API key)
- 🔑 **API Key Management** — Add, switch, enable/disable multiple keys
- 💬 **Streaming Responses** — Real-time token streaming with typing indicators
- 📝 **Markdown Rendering** — Full markdown with syntax-highlighted code blocks
- 🖼️ **Image Analysis** — Upload images for AI-powered visual analysis
- 🧠 **Mini GPT** — Select any text in AI responses to get instant explanations in a floating chatbot panel
- 💾 **Conversation Management** — Create, rename, delete, and persist conversations locally
- 🌙 **Dark Theme** — Premium ChatGPT-inspired dark UI

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- An API key from one of: [OpenAI](https://platform.openai.com/api-keys), [Google AI Studio](https://aistudio.google.com/apikey), or [Hugging Face](https://huggingface.co/settings/tokens)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/gpt-advanced.git
cd gpt-advanced

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open http://localhost:3000 — you'll be prompted to enter your API key on first visit.

### Build for Production

```bash
npm run build
npm run preview
```

## 🧠 Mini GPT — The Unique Feature

Mini GPT lets you **select any text** in an AI response to get an instant explanation:

1. Highlight text in any AI response
2. Click "Ask Mini GPT" in the tooltip
3. Get an explanation in a floating panel
4. **Ask follow-up questions** — it's a full mini chatbot!

Explanations are saved as highlights that you can click anytime to re-read.

## 🔧 Supported Providers

| Provider | Models | Free Tier |
|----------|--------|-----------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4-turbo, o1-mini | No |
| **Google Gemini** | Gemini 3, 2.5, 2.0, 1.5 (Flash & Pro) | ✅ Yes |
| **Hugging Face** | Mistral-7B, LLaMA-3-8B | ✅ Yes |

## 📁 Project Structure

```
src/
├── api/              # API integrations
│   ├── openai.js     # OpenAI API
│   ├── gemini.js     # Google Gemini API
│   ├── huggingface.js# Hugging Face API
│   └── ollama.js     # Ollama local API
├── components/       # React components
│   ├── ChatArea.jsx  # Main chat interface
│   ├── ChatInput.jsx # Message input
│   ├── MessageBubble.jsx # Message display
│   ├── MiniGpt.jsx   # Mini GPT chatbot panel
│   ├── Sidebar.jsx   # Conversation sidebar
│   ├── SettingsModal.jsx # API key management
│   ├── SetupScreen.jsx   # First-time setup
│   └── WelcomeScreen.jsx # Empty state
├── context/
│   └── ChatContext.jsx # State management
├── App.jsx
├── main.jsx
└── index.css         # Complete design system
```

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source under the [MIT License](LICENSE).
