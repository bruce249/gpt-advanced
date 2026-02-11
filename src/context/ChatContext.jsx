import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendMessage, sendMessageWithImage, getMiniGptExplanation } from '../api/gemini.js';
import { sendMessageHF, getMiniGptExplanationHF } from '../api/huggingface.js';
import { sendMessageOllama, sendMessageWithImageOllama, getMiniGptExplanationOllama, checkOllamaStatus, getBestModel } from '../api/ollama.js';
import { sendMessageOpenAI, sendMessageWithImageOpenAI, getMiniGptExplanationOpenAI } from '../api/openai.js';
import { loadApiKeys, getActiveKey, getActiveProvider } from '../components/SettingsModal.jsx';
import { buildDocumentContext } from '../utils/documentParser.js';

const ChatContext = createContext();
const DOCS_STORAGE_KEY = 'gpt-advanced-documents';

const STORAGE_KEY = 'gpt-advanced-conversations';

function loadConversations() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveConversations(conversations) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
        console.warn('Failed to save conversations:', e);
    }
}

function loadDocuments() {
    try {
        const data = localStorage.getItem(DOCS_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function saveDocuments(docs) {
    try {
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs));
    } catch (e) {
        console.warn('Failed to save documents:', e);
    }
}

export function ChatProvider({ children }) {
    const [conversations, setConversations] = useState(() => loadConversations());
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [allDocuments, setAllDocuments] = useState(() => loadDocuments());
    const conversationsRef = useRef(conversations);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        saveConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        saveDocuments(allDocuments);
    }, [allDocuments]);

    // Get documents for the active conversation
    const activeDocuments = activeConversationId ? (allDocuments[activeConversationId] || []) : [];

    const addDocument = useCallback((convId, doc) => {
        setAllDocuments(prev => {
            const convDocs = prev[convId] || [];
            return { ...prev, [convId]: [...convDocs, doc] };
        });
    }, []);

    const removeDocument = useCallback((convId, docId) => {
        setAllDocuments(prev => {
            const convDocs = (prev[convId] || []).filter(d => d.id !== docId);
            return { ...prev, [convId]: convDocs };
        });
    }, []);

    const getDocumentsForConversation = useCallback((convId) => {
        return allDocuments[convId] || [];
    }, [allDocuments]);

    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

    const createConversation = useCallback(() => {
        const newConv = {
            id: uuidv4(),
            title: 'New chat',
            messages: [],
            highlights: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        return newConv.id;
    }, []);

    const deleteConversation = useCallback((id) => {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
            setActiveConversationId(null);
        }
    }, [activeConversationId]);

    const renameConversation = useCallback((id, newTitle) => {
        setConversations(prev => prev.map(c =>
            c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
        ));
    }, []);

    const generateTitle = useCallback((firstMessage) => {
        const title = firstMessage.substring(0, 40).trim();
        return title.length < firstMessage.length ? title + '...' : title;
    }, []);

    /**
     * Send a message using the user's active API key
     */
    const callProvider = useCallback(async (activeKeyConfig, history, text, imageData, onChunk) => {
        const { provider, apiKey, model } = activeKeyConfig;

        if (provider === 'openai') {
            if (imageData) {
                return await sendMessageWithImageOpenAI(apiKey, model, history, text, imageData, onChunk);
            }
            return await sendMessageOpenAI(apiKey, model, history, text, onChunk);
        } else if (provider === 'gemini') {
            if (imageData) {
                return await sendMessageWithImage(history, text, imageData, onChunk);
            }
            return await sendMessage(history, text, onChunk);
        } else if (provider === 'huggingface') {
            return await sendMessageHF(history, text, onChunk);
        } else if (provider === 'ollama') {
            if (imageData) {
                return await sendMessageWithImageOllama(history, text, imageData, onChunk);
            }
            return await sendMessageOllama(history, text, onChunk);
        }

        throw new Error(`Unknown provider: ${provider}`);
    }, []);

    const sendUserMessage = useCallback(async (text, imageData = null) => {
        // Get active API key
        const activeKey = getActiveKey();
        if (!activeKey) {
            return; // Should be caught by setup screen
        }

        let convId = activeConversationId;

        if (!convId) {
            const newConv = {
                id: uuidv4(),
                title: 'New chat',
                messages: [],
                highlights: {},
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setConversations(prev => [newConv, ...prev]);
            convId = newConv.id;
            setActiveConversationId(convId);
        }

        const userMsgId = uuidv4();
        const userMessage = {
            id: userMsgId,
            role: 'user',
            content: text,
            imageUrl: imageData?.dataUrl || null,
            timestamp: Date.now(),
        };

        const assistantMsgId = uuidv4();
        const assistantMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        };

        setConversations(prev => prev.map(c =>
            c.id === convId
                ? {
                    ...c,
                    messages: [...c.messages, userMessage, assistantMessage],
                    title: c.messages.length === 0 ? generateTitle(text) : c.title,
                    updatedAt: Date.now(),
                }
                : c
        ));

        setIsStreaming(true);
        setStreamingText('');

        try {
            const conv = conversationsRef.current.find(c => c.id === convId);
            const history = conv ? conv.messages.filter(m => m.content).map(m => ({
                role: m.role,
                content: m.content,
            })) : [];

            const onChunk = (accumulated) => {
                setStreamingText(accumulated);
                setConversations(prev => prev.map(c =>
                    c.id === convId
                        ? {
                            ...c,
                            messages: c.messages.map(m =>
                                m.id === assistantMsgId ? { ...m, content: accumulated } : m
                            ),
                        }
                        : c
                ));
            };

            // Build document context if documents are uploaded
            const convDocs = allDocuments[convId] || [];
            const docContext = buildDocumentContext(convDocs);
            const augmentedText = docContext ? docContext + text : text;

            // Try the active key's provider
            let fullText;
            try {
                fullText = await callProvider(activeKey, history, augmentedText, imageData, onChunk);
            } catch (primaryError) {
                console.warn(`Primary provider ${activeKey.provider} failed:`, primaryError.message);

                // Try other enabled keys as fallback
                const allKeys = loadApiKeys();
                const otherKeys = allKeys.filter(k => k.id !== activeKey.id && k.enabled);
                let fallbackWorked = false;

                for (const fallbackKey of otherKeys) {
                    try {
                        // Reset content for retry
                        setConversations(prev => prev.map(c =>
                            c.id === convId
                                ? {
                                    ...c,
                                    messages: c.messages.map(m =>
                                        m.id === assistantMsgId ? { ...m, content: '' } : m
                                    ),
                                }
                                : c
                        ));
                        fullText = await callProvider(fallbackKey, history, augmentedText, imageData, onChunk);
                        fallbackWorked = true;
                        break;
                    } catch (fbErr) {
                        console.warn(`Fallback ${fallbackKey.provider} also failed:`, fbErr.message);
                    }
                }

                if (!fallbackWorked) {
                    throw primaryError;
                }
            }

            setConversations(prev => prev.map(c =>
                c.id === convId
                    ? {
                        ...c,
                        messages: c.messages.map(m =>
                            m.id === assistantMsgId ? { ...m, content: fullText } : m
                        ),
                        updatedAt: Date.now(),
                    }
                    : c
            ));
        } catch (error) {
            console.error('Error sending message:', error);
            setConversations(prev => prev.map(c =>
                c.id === convId
                    ? {
                        ...c,
                        messages: c.messages.map(m =>
                            m.id === assistantMsgId
                                ? { ...m, content: `⚠️ **Error:** ${error.message}\n\nPlease check your API key in settings (⚙️ button in sidebar).` }
                                : m
                        ),
                    }
                    : c
            ));
        } finally {
            setIsStreaming(false);
            setStreamingText('');
        }
    }, [activeConversationId, callProvider, generateTitle]);

    const addHighlight = useCallback((conversationId, messageId, highlight) => {
        setConversations(prev => prev.map(c => {
            if (c.id !== conversationId) return c;
            const highlights = { ...c.highlights };
            if (!highlights[messageId]) highlights[messageId] = [];
            highlights[messageId] = [...highlights[messageId], highlight];
            return { ...c, highlights, updatedAt: Date.now() };
        }));
    }, []);

    const getHighlightsForMessage = useCallback((messageId) => {
        if (!activeConversation) return [];
        return activeConversation.highlights?.[messageId] || [];
    }, [activeConversation]);

    const getMiniExplanation = useCallback(async (selectedText, context) => {
        const activeKey = getActiveKey();
        if (!activeKey) return 'No API key configured.';

        try {
            if (activeKey.provider === 'openai') {
                return await getMiniGptExplanationOpenAI(activeKey.apiKey, activeKey.model, selectedText, context);
            } else if (activeKey.provider === 'gemini') {
                return await getMiniGptExplanation(selectedText, context);
            } else if (activeKey.provider === 'huggingface') {
                return await getMiniGptExplanationHF(selectedText, context);
            } else if (activeKey.provider === 'ollama') {
                return await getMiniGptExplanationOllama(selectedText, context);
            }
        } catch (err) {
            console.error('Mini GPT error:', err);
        }
        return 'Sorry, I could not generate an explanation at this time.';
    }, []);

    const stopStreaming = useCallback(() => {
        setIsStreaming(false);
        setStreamingText('');
    }, []);

    const value = {
        conversations,
        activeConversation,
        activeConversationId,
        isStreaming,
        streamingText,
        setActiveConversationId,
        createConversation,
        deleteConversation,
        renameConversation,
        sendUserMessage,
        addHighlight,
        getHighlightsForMessage,
        getMiniExplanation,
        stopStreaming,
        // Document management
        activeDocuments,
        addDocument,
        removeDocument,
        getDocumentsForConversation,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
