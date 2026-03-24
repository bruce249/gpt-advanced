/**
 * Voice utilities — Speech Recognition (input) & Speech Synthesis (output)
 * Uses browser Web Speech API — no API key needed.
 * Supported: Chrome, Edge, Safari (recognition); all modern browsers (synthesis)
 */

// ─── Speech Recognition (voice → text) ──────────────────────────────────────

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

export function isSpeechRecognitionSupported() {
    return !!SpeechRecognition;
}

/**
 * Start listening and call onResult with the live transcript.
 * Returns a stop function.
 */
export function startListening({ onResult, onEnd, onError, lang = 'en-US' }) {
    if (!SpeechRecognition) {
        onError?.('Speech recognition is not supported in this browser. Try Chrome or Edge.');
        return () => {};
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        const isFinal = event.results[event.results.length - 1]?.isFinal;
        onResult(transcript, isFinal);
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            onEnd?.();
            return;
        }
        onError?.(event.error === 'not-allowed'
            ? 'Microphone access denied. Please allow microphone in your browser.'
            : `Speech error: ${event.error}`);
    };

    recognition.onend = () => {
        onEnd?.();
    };

    recognition.start();
    return () => recognition.stop();
}

// ─── Speech Synthesis (text → voice) ────────────────────────────────────────

/**
 * Strip markdown so it sounds natural when spoken.
 */
function stripMarkdown(text) {
    return text
        .replace(/```[\s\S]*?```/g, 'code block omitted.')   // code blocks
        .replace(/`[^`]+`/g, '')                              // inline code
        .replace(/#{1,6}\s/g, '')                             // headers
        .replace(/\*\*([^*]+)\*\*/g, '$1')                   // bold
        .replace(/\*([^*]+)\*/g, '$1')                       // italic
        .replace(/__([^_]+)__/g, '$1')                       // bold underscore
        .replace(/_([^_]+)_/g, '$1')                         // italic underscore
        .replace(/~~([^~]+)~~/g, '$1')                       // strikethrough
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')             // links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')              // images
        .replace(/^[-*+]\s/gm, '')                           // unordered lists
        .replace(/^\d+\.\s/gm, '')                           // ordered lists
        .replace(/^>\s/gm, '')                               // blockquotes
        .replace(/<[^>]+>/g, '')                             // HTML tags (mark, etc.)
        .replace(/\|/g, ', ')                                // table separators
        .replace(/[-]{3,}/g, '')                             // horizontal rules
        .trim();
}

export function isSpeechSynthesisSupported() {
    return 'speechSynthesis' in window;
}

/**
 * Speak the given text. Returns a stop function.
 */
export function speak({ text, onEnd, rate = 1, pitch = 1 }) {
    if (!isSpeechSynthesisSupported()) return () => {};

    window.speechSynthesis.cancel();

    const clean = stripMarkdown(text);
    if (!clean.trim()) return () => {};

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = 'en-US';
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
    return () => {
        window.speechSynthesis.cancel();
        onEnd?.();
    };
}

export function stopSpeaking() {
    if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
    }
}