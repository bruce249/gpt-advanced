import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadApiKeys, getActiveKey } from '../components/SettingsModal.jsx';

function getGeminiKey() {
    // First try the active key if it's Gemini
    const active = getActiveKey();
    if (active && active.provider === 'gemini') return { key: active.apiKey, model: active.model };

    // Otherwise find any enabled Gemini key
    const keys = loadApiKeys();
    const geminiKey = keys.find(k => k.provider === 'gemini' && k.enabled);
    if (geminiKey) return { key: geminiKey.apiKey, model: geminiKey.model };

    return null;
}

const SYSTEM_INSTRUCTION = `You are GPT Advanced, a helpful, creative, and intelligent AI assistant. You provide clear, accurate, and detailed answers. You can write code, explain concepts, help with analysis, creative writing, math, science, and much more. Format your responses using Markdown when helpful (headers, bold, code blocks, lists, tables). Be conversational, friendly, and thorough.`;

/**
 * Send a text message and get a streamed response
 */
export async function sendMessage(history, userMessage, onChunk) {
    const config = getGeminiKey();
    if (!config) throw new Error('No Gemini API key configured. Add one in Settings.');

    const genAI = new GoogleGenerativeAI(config.key);
    const model = genAI.getGenerativeModel({ model: config.model || 'gemini-2.0-flash' });

    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        })),
        systemInstruction: {
            role: 'user',
            parts: [{ text: SYSTEM_INSTRUCTION }],
        },
    });

    const result = await chat.sendMessageStream(userMessage);

    let fullText = '';
    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(fullText);
    }

    return fullText;
}

/**
 * Send a message with an image for multimodal analysis
 */
export async function sendMessageWithImage(history, userMessage, imageData, onChunk) {
    const config = getGeminiKey();
    if (!config) throw new Error('No Gemini API key configured.');

    const genAI = new GoogleGenerativeAI(config.key);
    const model = genAI.getGenerativeModel({ model: config.model || 'gemini-2.0-flash' });

    const imagePart = {
        inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType,
        },
    };

    const textPart = { text: userMessage || 'What do you see in this image? Describe it in detail.' };

    const result = await model.generateContentStream([textPart, imagePart]);

    let fullText = '';
    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(fullText);
    }

    return fullText;
}

/**
 * Get a Mini GPT explanation for selected text
 */
export async function getMiniGptExplanation(selectedText, messageContext) {
    const config = getGeminiKey();
    if (!config) throw new Error('No Gemini API key configured.');

    const genAI = new GoogleGenerativeAI(config.key);
    const model = genAI.getGenerativeModel({ model: config.model || 'gemini-2.0-flash' });

    const prompt = `The user selected the following text from an AI response and wants a brief, clear explanation of what it means:

Selected text: "${selectedText}"

Context from the full message:
"${messageContext.substring(0, 500)}"

Provide a concise, helpful explanation of the selected text. Keep it under 150 words. If it's a technical term, explain it simply. If it's a concept, break it down. Use markdown formatting if helpful.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}
