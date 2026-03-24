import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { HiOutlinePaperAirplane, HiOutlinePhoto, HiOutlineStop, HiOutlineDocumentPlus } from 'react-icons/hi2';
import { IoClose, IoDocumentText, IoMicOutline, IoStop } from 'react-icons/io5';
import { parseDocument, SUPPORTED_EXTENSIONS } from '../utils/documentParser.js';
import { DocumentChips } from './DocumentPanel.jsx';
import DocumentPanel from './DocumentPanel.jsx';
import { startListening, isSpeechRecognitionSupported } from '../hooks/useVoice.js';

export default function ChatInput({ prefillMessage, onPrefillUsed }) {
    const { sendUserMessage, isStreaming, stopStreaming, activeConversationId, createConversation, activeDocuments, addDocument, removeDocument } = useChat();
    const [input, setInput] = useState('');
    const [imageData, setImageData] = useState(null);
    const [docLoading, setDocLoading] = useState(false);
    const [showDocPanel, setShowDocPanel] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState('');
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const docInputRef = useRef(null);
    const stopListeningRef = useRef(null);

    // Handle prefill from News "Ask AI" button
    useEffect(() => {
        if (prefillMessage) {
            setInput(prefillMessage);
            onPrefillUsed?.();
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    }, [prefillMessage]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [input]);

    // Stop mic on unmount
    useEffect(() => {
        return () => stopListeningRef.current?.();
    }, []);

    const handleSubmit = () => {
        const trimmed = input.trim();
        if ((!trimmed && !imageData) || isStreaming) return;

        sendUserMessage(trimmed || 'What is in this image?', imageData);
        setInput('');
        setImageData(null);

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
        e.target.value = '';
    };

    const handleDocUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setDocLoading(true);

        let convId = activeConversationId;
        if (!convId) {
            convId = createConversation();
        }

        for (const file of files) {
            try {
                const doc = await parseDocument(file);
                addDocument(convId, doc);
            } catch (err) {
                alert(`Error parsing "${file.name}": ${err.message}`);
            }
        }

        setDocLoading(false);
        e.target.value = '';
    };

    const handleRemoveDoc = (docId) => {
        if (activeConversationId) {
            removeDocument(activeConversationId, docId);
        }
    };

    const removeImage = () => setImageData(null);

    const handleVoiceToggle = useCallback(() => {
        if (isListening) {
            stopListeningRef.current?.();
            setIsListening(false);
            return;
        }

        setVoiceError('');
        setIsListening(true);

        const stop = startListening({
            onResult: (transcript, isFinal) => {
                setInput(transcript);
                if (isFinal) {
                    setIsListening(false);
                }
            },
            onEnd: () => setIsListening(false),
            onError: (msg) => {
                setVoiceError(msg);
                setIsListening(false);
            },
        });

        stopListeningRef.current = stop;
    }, [isListening]);

    const speechSupported = isSpeechRecognitionSupported();

    return (
        <div className="chat-input-area">
            {showDocPanel && (
                <DocumentPanel
                    documents={activeDocuments}
                    onRemove={handleRemoveDoc}
                    onClose={() => setShowDocPanel(false)}
                />
            )}
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

                {activeDocuments.length > 0 && (
                    <DocumentChips documents={activeDocuments} onRemove={handleRemoveDoc} />
                )}

                {voiceError && (
                    <div className="voice-error">{voiceError}</div>
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
                        <button
                            className={`input-action-btn ${activeDocuments.length > 0 ? 'has-docs' : ''}`}
                            onClick={() => docInputRef.current?.click()}
                            title="Upload document"
                            disabled={isStreaming || docLoading}
                        >
                            {docLoading ? (
                                <span className="doc-loading-spinner" />
                            ) : (
                                <HiOutlineDocumentPlus style={{ fontSize: '20px' }} />
                            )}
                        </button>
                        <input
                            type="file"
                            ref={docInputRef}
                            accept={SUPPORTED_EXTENSIONS}
                            onChange={handleDocUpload}
                            multiple
                            style={{ display: 'none' }}
                        />
                        {activeDocuments.length > 0 && (
                            <button
                                className="input-action-btn doc-count-btn"
                                onClick={() => setShowDocPanel(!showDocPanel)}
                                title="View uploaded documents"
                            >
                                <IoDocumentText style={{ fontSize: '16px' }} />
                                <span className="doc-count-badge">{activeDocuments.length}</span>
                            </button>
                        )}
                        {speechSupported && (
                            <button
                                className={`input-action-btn mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={handleVoiceToggle}
                                title={isListening ? 'Stop recording' : 'Voice input'}
                                disabled={isStreaming}
                            >
                                {isListening
                                    ? <IoStop style={{ fontSize: '18px' }} />
                                    : <IoMicOutline style={{ fontSize: '20px' }} />
                                }
                                {isListening && <span className="mic-pulse" />}
                            </button>
                        )}
                    </div>
                    <textarea
                        ref={textareaRef}
                        className="chat-textarea"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isListening
                                ? 'Listening...'
                                : activeDocuments.length > 0
                                    ? 'Ask about your documents...'
                                    : 'Message GPT Advanced...'
                        }
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