/**
 * Ollama API - Local LLM inference
 * Requires Ollama installed and running: https://ollama.com
 * Default endpoint: http://localhost:11434
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';

// Preferred models in order - will try each until one works
const PREFERRED_MODELS = ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'phi3', 'gemma2', 'qwen2.5'];

/**
 * Check if Ollama is running and get available models
 */
export async function checkOllamaStatus() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!response.ok) throw new Error('Ollama not reachable');
        const data = await response.json();
        return {
            running: true,
            models: data.models?.map(m => m.name) || [],
        };
    } catch {
        return { running: false, models: [] };
    }
}

/**
 * Find the best available model
 */
export async function getBestModel() {
    const status = await checkOllamaStatus();
    if (!status.running) return null;
    if (status.models.length === 0) return null;

    // Try preferred models first
    for (const preferred of PREFERRED_MODELS) {
        const found = status.models.find(m => m.startsWith(preferred));
        if (found) return found;
    }

    // Return first available model
    return status.models[0];
}

/**
 * Send a chat message to Ollama with streaming
 */
export async function sendMessageOllama(history, userMessage, onChunk, model = null) {
    const selectedModel = model || await getBestModel();

    if (!selectedModel) {
        throw new Error('No Ollama models available. Please run: ollama pull llama3.2');
    }

    const messages = [
        {
            role: 'system',
            content: 'You are GPT Advanced, a helpful, creative, and intelligent AI assistant. You provide clear, accurate, and detailed answers. You can write code, explain concepts, help with analysis, creative writing, math, science, and much more. Format your responses using Markdown when helpful (headers, bold, code blocks, lists, tables). Be conversational, friendly, and thorough.',
        },
        ...history.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        })),
        { role: 'user', content: userMessage },
    ];

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: selectedModel,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errData = await response.text();
        throw new Error(`Ollama error: ${errData}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                    fullText += json.message.content;
                    onChunk(fullText);
                }
            } catch {
                // Skip invalid JSON lines
            }
        }
    }

    return fullText;
}

/**
 * Send a message with an image to Ollama (for multimodal models like llava)
 */
export async function sendMessageWithImageOllama(history, userMessage, imageData, onChunk, model = null) {
    const selectedModel = model || 'llava';

    const messages = [
        ...history.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        })),
        {
            role: 'user',
            content: userMessage || 'What do you see in this image? Describe it in detail.',
            images: [imageData.base64],
        },
    ];

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: selectedModel,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        throw new Error('Ollama multimodal error. Make sure you have a vision model: ollama pull llava');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                    fullText += json.message.content;
                    onChunk(fullText);
                }
            } catch {
                // Skip
            }
        }
    }

    return fullText;
}

/**
 * Get a Mini GPT explanation via Ollama
 */
export async function getMiniGptExplanationOllama(selectedText, messageContext, model = null) {
    const selectedModel = model || await getBestModel();

    if (!selectedModel) {
        throw new Error('No Ollama model available');
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: selectedModel,
            messages: [
                {
                    role: 'user',
                    content: `Explain the following text concisely in under 150 words. If technical, simplify it.\n\nSelected text: "${selectedText}"\n\nContext: "${messageContext.substring(0, 500)}"\n\nProvide a brief, clear explanation. Use markdown formatting if helpful.`,
                },
            ],
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error('Ollama Mini GPT error');
    }

    const data = await response.json();
    return data.message?.content || 'Could not generate explanation.';
}
