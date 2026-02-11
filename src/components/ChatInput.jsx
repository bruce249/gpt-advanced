import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { HiOutlinePaperAirplane, HiOutlinePhoto, HiOutlineStop } from 'react-icons/hi2';
import { IoClose } from 'react-icons/io5';

export default function ChatInput() {
    const { sendUserMessage, isStreaming, stopStreaming } = useChat();
    const [input, setInput] = useState('');
    const [imageData, setImageData] = useState(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleSubmit = () => {
        const trimmed = input.trim();
        if ((!trimmed && !imageData) || isStreaming) return;

        sendUserMessage(trimmed || 'What is in this image?', imageData);
        setInput('');
        setImageData(null);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const base64 = dataUrl.split(',')[1];
            setImageData({
                dataUrl,
                base64,
                mimeType: file.type,
                name: file.name,
            });
        };
        reader.readAsDataURL(file);

        // Reset file input
        e.target.value = '';
    };

    const removeImage = () => {
        setImageData(null);
    };

    return (
        <div className="chat-input-area">
            <div className="chat-input-wrapper">
                {imageData && (
                    <div className="image-preview-container">
                        <div className="image-preview">
                            <img src={imageData.dataUrl} alt="Upload preview" />
                            <button className="image-preview-remove" onClick={removeImage}>
                                <IoClose />
                            </button>
                        </div>
                    </div>
                )}
                <div className={`chat-input-box ${imageData ? 'has-preview' : ''}`}>
                    <div className="chat-input-actions-left">
                        <button
                            className="input-action-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload image"
                            disabled={isStreaming}
                        >
                            <HiOutlinePhoto style={{ fontSize: '20px' }} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <textarea
                        ref={textareaRef}
                        className="chat-textarea"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message GPT Advanced..."
                        rows={1}
                        disabled={isStreaming}
                    />
                    {isStreaming ? (
                        <button className="stop-btn" onClick={stopStreaming} title="Stop generating">
                            <HiOutlineStop style={{ fontSize: '16px' }} />
                        </button>
                    ) : (
                        <button
                            className="send-btn"
                            onClick={handleSubmit}
                            disabled={!input.trim() && !imageData}
                            title="Send message"
                        >
                            <HiOutlinePaperAirplane style={{ fontSize: '16px' }} />
                        </button>
                    )}
                </div>
            </div>
            <div className="chat-footer-note">
                GPT Advanced can make mistakes. Consider checking important information.
            </div>
        </div>
    );
}
