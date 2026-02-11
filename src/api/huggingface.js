import { loadApiKeys, getActiveKey } from '../components/SettingsModal.jsx';

function getHFKey() {
    const active = getActiveKey();
    if (active && active.provider === 'huggingface') return { key: active.apiKey, model: active.model };

    const keys = loadApiKeys();
    const hfKey = keys.find(k => k.provider === 'huggingface' && k.enabled);
    if (hfKey) return { key: hfKey.apiKey, model: hfKey.model };

    return null;
}

const SYSTEM_PROMPT = `You are GPT Advanced, a helpful, creative, and intelligent AI assistant. You provide clear, accurate, and detailed answers. Format your responses using Markdown when helpful.`;

/**
 * Send a text message via Hugging Face Inference API
 */
export async function sendMessageHF(history, userMessage, onChunk) {
    const config = getHFKey();
    if (!config) throw new Error('No Hugging Face API key configured. Add one in Settings.');

    const modelUrl = `https://api-inference.huggingface.co/models/${config.model || 'mistralai/Mistral-7B-Instruct-v0.3'}`;

    // Format conversation for Mistral instruct format
    let prompt = `<s>[INST] ${SYSTEM_PROMPT}\n\n`;

    for (const msg of history) {
        if (msg.role === 'user') {
            prompt += `${msg.content} [/INST]`;
        } else {
            prompt += ` ${msg.content}</s>[INST] `;
        }
    }

    prompt += `${userMessage} [/INST]`;

    const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: 2048,
                temperature: 0.7,
                top_p: 0.95,
                return_full_text: false,
                stream: false,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Hugging Face API error');
    }

    const data = await response.json();
    const text = data[0]?.generated_text || 'Sorry, I could not generate a response.';

    // Simulate streaming for consistent UX
    const words = text.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        onChunk(accumulated);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    return text;
}

/**
 * Get a Mini GPT explanation via Hugging Face
 */
export async function getMiniGptExplanationHF(selectedText, messageContext) {
    const config = getHFKey();
    if (!config) throw new Error('No Hugging Face API key configured.');

    const modelUrl = `https://api-inference.huggingface.co/models/${config.model || 'mistralai/Mistral-7B-Instruct-v0.3'}`;

    const prompt = `<s>[INST] Explain the following text concisely in under 150 words. If technical, simplify it.

Selected text: "${selectedText}"

Context: "${messageContext.substring(0, 300)}"

Provide a brief, clear explanation. [/INST]`;

    const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: 300,
                temperature: 0.5,
                return_full_text: false,
            },
        }),
    });

    if (!response.ok) {
        throw new Error('Hugging Face API error');
    }

    const data = await response.json();
    return data[0]?.generated_text || 'Could not generate explanation.';
}
