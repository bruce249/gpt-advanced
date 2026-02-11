import React from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { HiOutlineSparkles } from 'react-icons/hi2';

const SUGGESTIONS = [
    {
        text: 'Explain quantum computing',
        subtext: 'in simple terms',
    },
    {
        text: 'Write a Python script',
        subtext: 'to organize files by type',
    },
    {
        text: 'Help me plan a trip',
        subtext: 'to Japan for 7 days',
    },
    {
        text: 'Create a React component',
        subtext: 'for a responsive dashboard',
    },
];

export default function WelcomeScreen() {
    const { sendUserMessage } = useChat();

    const handleSuggestionClick = (suggestion) => {
        sendUserMessage(`${suggestion.text} ${suggestion.subtext}`);
    };

    return (
        <div className="welcome-screen">
            <div className="welcome-logo">
                <HiOutlineSparkles style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h1 className="welcome-title">How can I help you today?</h1>
            <div className="welcome-suggestions">
                {SUGGESTIONS.map((suggestion, index) => (
                    <div
                        key={index}
                        className="suggestion-card"
                        onClick={() => handleSuggestionClick(suggestion)}
                    >
                        <div className="suggestion-card-text">{suggestion.text}</div>
                        <div className="suggestion-card-subtext">{suggestion.subtext}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
