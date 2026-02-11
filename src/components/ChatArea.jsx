import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import ChatInput from './ChatInput.jsx';
import WelcomeScreen from './WelcomeScreen.jsx';
import MiniGpt, { MiniGptTooltip } from './MiniGpt.jsx';
import { RiSideBarLine } from 'react-icons/ri';
import { HiOutlineSparkles } from 'react-icons/hi2';

export default function ChatArea({ sidebarOpen, onToggleSidebar }) {
    const { activeConversation, isStreaming } = useChat();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Mini GPT state
    const [textSelection, setTextSelection] = useState(null);
    const [miniGptSelection, setMiniGptSelection] = useState(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeConversation?.messages, isStreaming]);

    // Handle text selection on assistant messages
    const handleTextSelect = useCallback((selectionData) => {
        if (selectionData.existingExplanation) {
            // Clicked on an existing highlight
            setTextSelection(null);
            setMiniGptSelection(selectionData);
        } else {
            // New text selection
            setTextSelection(selectionData);
            setMiniGptSelection(null);
        }
    }, []);

    // Handle click on "Ask Mini GPT" tooltip
    const handleAskMiniGpt = useCallback((selectionData) => {
        setTextSelection(null);
        setMiniGptSelection(selectionData);
        // Clear the native selection
        window.getSelection()?.removeAllRanges();
    }, []);

    // Clear text selection on click elsewhere
    useEffect(() => {
        const handleMouseDown = (e) => {
            // Don't clear if clicking tooltip or highlight
            if (
                e.target.closest('.mini-gpt-tooltip') ||
                e.target.closest('.mini-gpt-panel') ||
                e.target.classList.contains('mini-gpt-highlight')
            ) {
                return;
            }
            setTextSelection(null);
        };

        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, []);

    const messages = activeConversation?.messages || [];

    return (
        <div className="chat-area">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-left">
                    {!sidebarOpen && (
                        <button className="toggle-sidebar-btn" onClick={onToggleSidebar} title="Open sidebar">
                            <RiSideBarLine style={{ fontSize: '20px' }} />
                        </button>
                    )}
                    <span className="chat-header-model">
                        <HiOutlineSparkles style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--accent-primary)' }} />
                        GPT Advanced
                    </span>
                </div>
            </div>

            {/* Messages or Welcome */}
            {messages.length === 0 ? (
                <WelcomeScreen />
            ) : (
                <div className="messages-container" ref={messagesContainerRef}>
                    <div className="messages-list">
                        {messages.map((msg, index) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isStreaming={
                                    isStreaming &&
                                    index === messages.length - 1 &&
                                    msg.role === 'assistant'
                                }
                                onTextSelect={handleTextSelect}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Chat Input */}
            <ChatInput />

            {/* Mini GPT Tooltip (appears on text selection) */}
            <MiniGptTooltip
                selection={textSelection}
                onAskMiniGpt={handleAskMiniGpt}
            />

            {/* Mini GPT Panel (appears after clicking "Ask Mini GPT") */}
            {miniGptSelection && (
                <MiniGpt
                    selection={miniGptSelection}
                    onClose={() => setMiniGptSelection(null)}
                />
            )}
        </div>
    );
}
