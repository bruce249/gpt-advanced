import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { HiOutlineClipboard, HiOutlineCheck, HiOutlineUser } from 'react-icons/hi2';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { useChat } from '../context/ChatContext.jsx';

export default function MessageBubble({ message, isStreaming, onTextSelect }) {
    const { getHighlightsForMessage } = useChat();
    const contentRef = useRef(null);
    const highlights = getHighlightsForMessage(message.id);

    const handleMouseUp = useCallback(() => {
        if (message.role !== 'assistant') return;

        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 2) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            onTextSelect({
                text: selectedText,
                rect: {
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                },
                messageId: message.id,
                messageContent: message.content,
            });
        }
    }, [message, onTextSelect]);

    // Apply highlights to content
    const renderContent = useMemo(() => {
        if (highlights.length === 0) {
            return message.content;
        }
        return message.content;
    }, [message.content, highlights]);

    return (
        <div className="message">
            <div className={`message-avatar ${message.role}`}>
                {message.role === 'user' ? (
                    <HiOutlineUser />
                ) : (
                    <HiOutlineSparkles />
                )}
            </div>
            <div className={`message-content ${message.role === 'assistant' ? 'assistant-content' : ''}`}>
                {message.imageUrl && (
                    <img src={message.imageUrl} alt="Uploaded" className="message-image" />
                )}
                {message.role === 'assistant' ? (
                    <div
                        ref={contentRef}
                        onMouseUp={handleMouseUp}
                        className={isStreaming ? 'streaming-cursor' : ''}
                    >
                        {message.content ? (
                            <HighlightedMarkdown
                                content={message.content}
                                highlights={highlights}
                                onHighlightClick={(highlight) => {
                                    onTextSelect({
                                        text: highlight.text,
                                        rect: null,
                                        messageId: message.id,
                                        messageContent: message.content,
                                        existingExplanation: highlight.explanation,
                                        highlightId: highlight.id,
                                    });
                                }}
                            />
                        ) : isStreaming ? (
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div>{message.content}</div>
                )}
                {message.role === 'assistant' && message.content && !isStreaming && (
                    <MessageActions content={message.content} />
                )}
            </div>
        </div>
    );
}

function HighlightedMarkdown({ content, highlights, onHighlightClick }) {
    // If there are highlights, wrap matching text segments
    const processContent = useCallback((text) => {
        if (!highlights || highlights.length === 0) return text;

        let result = text;
        // Sort highlights by length descending to avoid partial match issues
        const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);

        for (const h of sorted) {
            const escapedText = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedText})`, 'gi');
            result = result.replace(regex, `<mark class="mini-gpt-highlight" data-highlight-id="${h.id}">$1</mark>`);
        }
        return result;
    }, [highlights]);

    // Custom renderer for paragraphs and text to inject highlights
    const components = useMemo(() => ({
        p: ({ children, node, ...props }) => {
            if (highlights.length === 0) {
                return <p {...props}>{children}</p>;
            }

            // Process children to add highlights
            const processedChildren = React.Children.map(children, child => {
                if (typeof child === 'string') {
                    return processTextWithHighlights(child, highlights, onHighlightClick);
                }
                return child;
            });

            return <p {...props}>{processedChildren}</p>;
        },
        li: ({ children, node, ...props }) => {
            if (highlights.length === 0) {
                return <li {...props}>{children}</li>;
            }

            const processedChildren = React.Children.map(children, child => {
                if (typeof child === 'string') {
                    return processTextWithHighlights(child, highlights, onHighlightClick);
                }
                return child;
            });

            return <li {...props}>{processedChildren}</li>;
        },
        td: ({ children, node, ...props }) => {
            if (highlights.length === 0) {
                return <td {...props}>{children}</td>;
            }

            const processedChildren = React.Children.map(children, child => {
                if (typeof child === 'string') {
                    return processTextWithHighlights(child, highlights, onHighlightClick);
                }
                return child;
            });

            return <td {...props}>{processedChildren}</td>;
        },
        code: ({ children, className, node, ...props }) => {
            const isInline = !className;
            if (isInline) {
                return <code {...props}>{children}</code>;
            }

            return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        pre: ({ children }) => {
            return <>{children}</>;
        },
    }), [highlights, onHighlightClick]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={components}
        >
            {content}
        </ReactMarkdown>
    );
}

function processTextWithHighlights(text, highlights, onHighlightClick) {
    if (!highlights || highlights.length === 0) return text;

    let segments = [{ text, highlighted: false }];

    for (const h of highlights) {
        const newSegments = [];
        for (const seg of segments) {
            if (seg.highlighted) {
                newSegments.push(seg);
                continue;
            }

            const idx = seg.text.toLowerCase().indexOf(h.text.toLowerCase());
            if (idx === -1) {
                newSegments.push(seg);
                continue;
            }

            if (idx > 0) {
                newSegments.push({ text: seg.text.substring(0, idx), highlighted: false });
            }
            newSegments.push({
                text: seg.text.substring(idx, idx + h.text.length),
                highlighted: true,
                highlight: h,
            });
            if (idx + h.text.length < seg.text.length) {
                newSegments.push({ text: seg.text.substring(idx + h.text.length), highlighted: false });
            }
        }
        segments = newSegments;
    }

    return segments.map((seg, i) => {
        if (seg.highlighted) {
            return (
                <span
                    key={i}
                    className="mini-gpt-highlight"
                    onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.target.getBoundingClientRect();
                        onHighlightClick({
                            ...seg.highlight,
                            rect: {
                                top: rect.top,
                                left: rect.left,
                                right: rect.right,
                                bottom: rect.bottom,
                                width: rect.width,
                            },
                        });
                    }}
                    title="Click to see Mini GPT explanation"
                >
                    {seg.text}
                </span>
            );
        }
        return seg.text;
    });
}

function CodeBlock({ className, children }) {
    const [copied, setCopied] = useState(false);
    const language = className?.replace('language-', '') || '';

    const codeText = React.Children.toArray(children)
        .map(child => {
            if (typeof child === 'string') return child;
            if (child?.props?.children) {
                if (typeof child.props.children === 'string') return child.props.children;
                return React.Children.toArray(child.props.children)
                    .map(c => (typeof c === 'string' ? c : c?.props?.children || ''))
                    .join('');
            }
            return '';
        })
        .join('');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-block-language">{language || 'code'}</span>
                <button className={`copy-code-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                    {copied ? <HiOutlineCheck /> : <HiOutlineClipboard />}
                    {copied ? 'Copied!' : 'Copy code'}
                </button>
            </div>
            <pre>
                <code className={className}>{children}</code>
            </pre>
        </div>
    );
}

function MessageActions({ content }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    return (
        <div className="message-actions">
            <button className="message-action-btn" onClick={handleCopy} title="Copy message">
                {copied ? <HiOutlineCheck /> : <HiOutlineClipboard />}
            </button>
        </div>
    );
}
