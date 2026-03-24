/**
 * OpenRouter API integration
 * OpenAI-compatible endpoint — supports hundreds of models
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_INSTRUCTION = `You are GPT Advanced, a helpful, creative, and intelligent AI assistant. You provide clear, accurate, and detailed answers. You can write code, explain concepts, help with analysis, creative writing, math, science, and much more. Format your responses using Markdown when helpful (headers, bold, code blocks, lists, tables). Be conversational, friendly, and thorough.

IMPORTANT: When answering questions about a topic, concept, or subject — wrap the most important key phrases, definitions, formulas, or critical facts in <mark> tags to highlight them like a revision marker. For example: <mark>The speed of light is approximately 3 × 10⁸ m/s</mark>. Only highlight truly important lines — not entire paragraphs. Do NOT use <mark> in code blocks. Use it sparingly (3-6 highlights per answer) for maximum impact.`;

function getHeaders(apiKey) {
    return {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gpt-advanced.app',
        'X-Title': 'GPT Advanced',
    };
}

/**
 * Send a text message with streaming via OpenRouter
 */
export async function sendMessageOpenRouter(apiKey, model, history, userMessage, onChunk) {
    const messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...history.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
        { role: 'user', content: userMessage },
    ];

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            model: model || 'mistralai/mistral-7b-instruct',
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenRouter API error (${response.status})`);
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
 * Get a Mini GPT explanation via OpenRouter
 */
export async function getMiniGptExplanationOpenRouter(apiKey, model, selectedText, messageContext) {
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            model: model || 'mistralai/mistral-7b-instruct',
            messages: [
                {
                    role: 'user',
                    content: `Explain the following text concisely in under 150 words. If technical, simplify it.\n\nSelected text: "${selectedText}"\n\nContext: "${messageContext.substring(0, 500)}"\n\nProvide a brief, clear explanation using markdown formatting if helpful.`,
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error('OpenRouter Mini GPT error');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Could not generate explanation.';
}
