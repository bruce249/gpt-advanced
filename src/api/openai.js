/**
 * OpenAI API integration
 * Uses the user-provided API key stored in localStorage
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_INSTRUCTION = `You are GPT Advanced, a helpful, creative, and intelligent AI assistant. You provide clear, accurate, and detailed answers. You can write code, explain concepts, help with analysis, creative writing, math, science, and much more. Format your responses using Markdown when helpful (headers, bold, code blocks, lists, tables). Be conversational, friendly, and thorough.

IMPORTANT: When answering questions about a topic, concept, or subject — wrap the most important key phrases, definitions, formulas, or critical facts in <mark> tags to highlight them like a revision marker. For example: <mark>The speed of light is approximately 3 × 10⁸ m/s</mark>. Only highlight truly important lines — not entire paragraphs. Do NOT use <mark> in code blocks. Use it sparingly (3-6 highlights per answer) for maximum impact.`;

/**
 * Send a text message with streaming via OpenAI API
 */
export async function sendMessageOpenAI(apiKey, model, history, userMessage, onChunk) {
    const messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...history.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
        { role: 'user', content: userMessage },
    ];

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI API error (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim().startsWith('data:'));

        for (const line of lines) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]') continue;

            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                    fullText += delta;
                    onChunk(fullText);
                }
            } catch {
                // Skip invalid JSON
            }
        }
    }

    return fullText;
}

/**
 * Send message with image via OpenAI (GPT-4o vision)
 */
export async function sendMessageWithImageOpenAI(apiKey, model, history, userMessage, imageData, onChunk) {
    const messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...history.map(msg => ({ role: msg.role, content: msg.content })),
        {
            role: 'user',
            content: [
                { type: 'text', text: userMessage || 'What do you see in this image? Describe it in detail.' },
                {
                    type: 'image_url',
                    image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` },
                },
            ],
        },
    ];

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI Vision error (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim().startsWith('data:'));

        for (const line of lines) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]') continue;
            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                    fullText += delta;
                    onChunk(fullText);
                }
            } catch { }
        }
    }

    return fullText;
}

/**
 * Get a Mini GPT explanation via OpenAI
 */
export async function getMiniGptExplanationOpenAI(apiKey, model, selectedText, messageContext) {
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: `Explain the following text concisely in under 150 words. If technical, simplify it.\n\nSelected text: "${selectedText}"\n\nContext: "${messageContext.substring(0, 500)}"\n\nProvide a brief, clear explanation using markdown formatting if helpful.`,
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error('OpenAI Mini GPT error');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Could not generate explanation.';
}
