import { loadApiKeys, getActiveKey } from '../components/SettingsModal.jsx';

const HF_BASE_URL = 'https://router.huggingface.co/v1/chat/completions';

function getHFKey() {
    const active = getActiveKey();
    if (active && active.provider === 'huggingface') return { key: active.apiKey, model: active.model };

    const keys = loadApiKeys();
    const hfKey = keys.find(k => k.provider === 'huggingface' && k.enabled);
    if (hfKey) return { key: hfKey.apiKey, model: hfKey.model };

    return null;
}

const SYSTEM_PROMPT = `You are GPT Advanced, a helpful, creative, and intelligent AI assistant. You provide clear, accurate, and detailed answers. Format your responses using Markdown when helpful.

IMPORTANT: When answering questions about a topic, concept, or subject — wrap the most important key phrases, definitions, formulas, or critical facts in <mark> tags to highlight them like a revision marker. For example: <mark>The speed of light is approximately 3 × 10⁸ m/s</mark>. Only highlight truly important lines — not entire paragraphs. Do NOT use <mark> in code blocks. Use it sparingly (3-6 highlights per answer) for maximum impact.`;

/**
 * Extract text from HF chat completion response (handles DeepSeek reasoning_content too)
 */
function extractResponseText(data) {
    const choice = data.choices?.[0]?.message;
    if (!choice) return null;
    // Some models (DeepSeek R1) put content in reasoning_content instead of content
    return choice.content || choice.reasoning_content || null;
}

/**
 * Send a text message via Hugging Face Inference API (router.huggingface.co)
 */
export async function sendMessageHF(history, userMessage, onChunk) {
    const config = getHFKey();
    if (!config) throw new Error('No Hugging Face API key configured. Add one in Settings.');

    const model = config.model || 'meta-llama/Llama-3.1-8B-Instruct';

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userMessage },
    ];

    const response = await fetch(HF_BASE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 2048,
            temperature: 0.7,
            top_p: 0.95,
            stream: false,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || error.error || 'Hugging Face API error');
    }

    const data = await response.json();
    const text = extractResponseText(data) || 'Sorry, I could not generate a response.';

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

    const model = config.model || 'meta-llama/Llama-3.1-8B-Instruct';

    const response = await fetch(HF_BASE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You explain text concisely in under 150 words. If technical, simplify it.' },
                { role: 'user', content: `Explain this:\n\n"${selectedText}"\n\nContext: "${messageContext.substring(0, 300)}"` },
            ],
            max_tokens: 300,
            temperature: 0.5,
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error('Hugging Face API error');
    }

    const data = await response.json();
    return extractResponseText(data) || 'Could not generate explanation.';
}
