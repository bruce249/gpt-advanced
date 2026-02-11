import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IoClose, IoSend } from 'react-icons/io5';
import { RiMagicLine } from 'react-icons/ri';
import { useChat } from '../context/ChatContext.jsx';
import { v4 as uuidv4 } from 'uuid';

export default function MiniGpt({ selection, onClose }) {
    const { getMiniExplanation, addHighlight, activeConversationId } = useChat();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const panelRef = useRef(null);
    const bodyRef = useRef(null);
    const inputRef = useRef(null);

    // Calculate panel position
    useEffect(() => {
        if (!selection) return;

        let top, left;

        if (selection.rect) {
            top = selection.rect.bottom + 10;
            left = selection.rect.left;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const panelWidth = 400;
            const panelHeight = 420;

            if (left + panelWidth > viewportWidth - 16) {
                left = viewportWidth - panelWidth - 16;
            }
            if (left < 16) left = 16;

            if (top + panelHeight > viewportHeight - 16) {
                top = selection.rect.top - panelHeight - 10;
                if (top < 16) top = 16;
            }
        } else {
            top = window.innerHeight / 2 - 210;
            left = window.innerWidth / 2 - 200;
        }

        setPosition({ top, left });
    }, [selection]);

    // Scroll chat to bottom
    const scrollToBottom = () => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Fetch initial explanation
    useEffect(() => {
        if (!selection) return;

        // Reset messages for new selection
        setMessages([]);
        setInputValue('');

        if (selection.existingExplanation) {
            setMessages([
                { role: 'user', content: `Explain: "${truncateText(selection.text, 100)}"` },
                { role: 'assistant', content: selection.existingExplanation },
            ]);
            setTimeout(() => inputRef.current?.focus(), 100);
            return;
        }

        const fetchExplanation = async () => {
            // Add the initial "question"
            setMessages([
                { role: 'user', content: `Explain: "${truncateText(selection.text, 100)}"` },
            ]);
            setLoading(true);

            try {
                const result = await getMiniExplanation(
                    selection.text,
                    selection.messageContent
                );

                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: result },
                ]);

                // Save highlight
                if (activeConversationId && selection.messageId) {
                    addHighlight(activeConversationId, selection.messageId, {
                        id: uuidv4(),
                        text: selection.text,
                        explanation: result,
                    });
                }
            } catch {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: 'Sorry, could not generate an explanation.' },
                ]);
            } finally {
                setLoading(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        };

        fetchExplanation();
    }, [selection]);

    // Send follow-up question
    const handleSend = async () => {
        const question = inputValue.trim();
        if (!question || loading) return;

        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: question }]);
        setLoading(true);

        try {
            // Build context: original selection + chat history
            const chatContext = messages
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');

            const fullContext = `Original selected text: "${selection.text}"\n\nConversation so far:\n${chatContext}\n\nUser's follow-up question: ${question}`;

            const result = await getMiniExplanation(question, fullContext);

            setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        } catch {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I could not answer that.' },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                if (e.target.classList.contains('mini-gpt-highlight')) return;
                onClose();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!selection) return null;

    return (
        <div
            className="mini-gpt-panel"
            ref={panelRef}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <div className="mini-gpt-panel-header">
                <div className="mini-gpt-panel-title">
                    <RiMagicLine />
                    Mini GPT
                </div>
                <button className="mini-gpt-panel-close" onClick={onClose}>
                    <IoClose />
                </button>
            </div>

            <div className="mini-gpt-selected-text">
                {truncateText(selection.text, 120)}
            </div>

            <div className="mini-gpt-panel-body" ref={bodyRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`mini-gpt-msg mini-gpt-msg-${msg.role}`}>
                        {msg.role === 'user' ? (
                            <div className="mini-gpt-msg-user-bubble">{msg.content}</div>
                        ) : (
                            <div className="mini-gpt-msg-assistant-bubble">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="mini-gpt-msg mini-gpt-msg-assistant">
                        <div className="mini-gpt-msg-assistant-bubble">
                            <div className="mini-gpt-loading">
                                <div className="mini-gpt-loading-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span>Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mini-gpt-input-area">
                <input
                    ref={inputRef}
                    type="text"
                    className="mini-gpt-input"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up..."
                    disabled={loading}
                />
                <button
                    className="mini-gpt-send-btn"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || loading}
                >
                    <IoSend />
                </button>
            </div>
        </div>
    );
}

function truncateText(text, maxLen) {
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

/**
 * Tooltip that appears when text is selected in assistant messages
 */
export function MiniGptTooltip({ selection, onAskMiniGpt }) {
    if (!selection || !selection.rect) return null;

    const tooltipTop = selection.rect.top - 40;
    const tooltipLeft = selection.rect.left + (selection.rect.width / 2) - 65;

    return (
        <div
            className="mini-gpt-tooltip"
            onClick={() => onAskMiniGpt(selection)}
            style={{
                top: `${Math.max(8, tooltipTop)}px`,
                left: `${Math.max(8, tooltipLeft)}px`,
            }}
        >
            <RiMagicLine />
            Ask Mini GPT
        </div>
    );
}
