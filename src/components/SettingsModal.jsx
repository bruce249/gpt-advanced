import React, { useState, useEffect } from 'react';
import { HiOutlineKey, HiOutlinePlus, HiOutlineTrash, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import { IoClose } from 'react-icons/io5';
import { RiOpenaiLine } from 'react-icons/ri';
import { SiGooglegemini } from 'react-icons/si';
import { loadNewsKeys, saveNewsKeys } from '../api/news.js';

const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        icon: '🤖',
        color: '#10a37f',
        placeholder: 'sk-...',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini'],
        defaultModel: 'gpt-4o-mini',
        description: 'ChatGPT models — most capable',
    },
    gemini: {
        name: 'Google Gemini',
        icon: '✨',
        color: '#4285f4',
        placeholder: 'AIzaSy...',
        models: [
            'gemini-3-flash-preview',
            'gemini-3-pro-preview',
            'gemini-3-pro-image-preview',
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-2.5-flash-lite',
            'gemini-2.5-flash-image',
            'gemini-2.5-flash-preview-09-2025',
            'gemini-2.5-flash-lite-preview-09-2025',
            'gemini-2.0-flash',
            'gemini-2.0-flash-001',
            'gemini-flash-lite-latest',
            'gemini-pro-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
        ],
        defaultModel: 'gemini-2.5-flash',
        description: 'Google AI — fast & free tier',
    },
    huggingface: {
        name: 'Hugging Face',
        icon: '🤗',
        color: '#ff9d00',
        placeholder: 'hf_...',
        models: [
            // Meta Llama models
            'meta-llama/Llama-3.1-8B-Instruct',
            'meta-llama/Llama-3.2-3B-Instruct',
            'meta-llama/Llama-3.2-1B-Instruct',
            'meta-llama/Llama-3.3-70B-Instruct',
            // Qwen models
            'Qwen/Qwen2.5-7B-Instruct',
            'Qwen/Qwen2.5-72B-Instruct',
            'Qwen/Qwen2.5-Coder-32B-Instruct',
            // DeepSeek (reasoning model)
            'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
        ],
        defaultModel: 'meta-llama/Llama-3.1-8B-Instruct',
        description: 'Open-source models — free tier available',
    },
};

const KEYS_STORAGE = 'gpt-advanced-api-keys';
const ACTIVE_PROVIDER_STORAGE = 'gpt-advanced-active-provider';

export function loadApiKeys() {
    try {
        const data = localStorage.getItem(KEYS_STORAGE);
        if (!data) return [];
        let keys = JSON.parse(data);

        // Auto-migrate: fix invalid model names and clean API keys
        let changed = false;
        keys = keys.map(k => {
            const provider = PROVIDERS[k.provider];
            const updated = { ...k };

            // Clean non-ASCII characters from API key (fixes Headers append error)
            const cleanKey = k.apiKey.replace(/[^\x20-\x7E]/g, '').trim();
            if (cleanKey !== k.apiKey) {
                updated.apiKey = cleanKey;
                changed = true;
            }

            // Fix model if it's not in the provider's list
            if (provider && !provider.models.includes(k.model)) {
                updated.model = provider.defaultModel;
                changed = true;
            }

            return updated;
        });

        if (changed) {
            localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
        }

        return keys;
    } catch {
        return [];
    }
}

export function saveApiKeys(keys) {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

export function getActiveProvider() {
    return localStorage.getItem(ACTIVE_PROVIDER_STORAGE) || null;
}

export function setActiveProvider(providerId) {
    if (providerId) {
        localStorage.setItem(ACTIVE_PROVIDER_STORAGE, providerId);
    } else {
        localStorage.removeItem(ACTIVE_PROVIDER_STORAGE);
    }
}

export function getActiveKey() {
    const keys = loadApiKeys();
    const activeId = getActiveProvider();
    if (activeId) {
        const key = keys.find(k => k.id === activeId && k.enabled);
        if (key) return key;
    }
    // Return first enabled key
    return keys.find(k => k.enabled) || null;
}

export function hasAnyKeys() {
    const keys = loadApiKeys();
    return keys.some(k => k.enabled);
}

export { PROVIDERS };

/**
 * Settings Modal — API Key Management
 */
export default function SettingsModal({ isOpen, onClose }) {
    const [keys, setKeys] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProvider, setNewProvider] = useState('openai');
    const [newKey, setNewKey] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newModel, setNewModel] = useState('');
    const [activeKeyId, setActiveKeyId] = useState('');
    const [newsKeys, setNewsKeys] = useState({});

    useEffect(() => {
        if (isOpen) {
            setKeys(loadApiKeys());
            setActiveKeyId(getActiveProvider() || '');
            setNewsKeys(loadNewsKeys());
        }
    }, [isOpen]);

    const handleNewsKeyChange = (field, value) => {
        const updated = { ...newsKeys, [field]: value };
        setNewsKeys(updated);
        saveNewsKeys(updated);
    };

    const handleAddKey = () => {
        if (!newKey.trim()) return;

        const provider = PROVIDERS[newProvider];
        const keyEntry = {
            id: Date.now().toString(),
            provider: newProvider,
            label: newLabel.trim() || `${provider.name} Key`,
            apiKey: newKey.trim(),
            model: newModel || provider.defaultModel,
            enabled: true,
            createdAt: Date.now(),
        };

        const updated = [...keys, keyEntry];
        setKeys(updated);
        saveApiKeys(updated);

        // Auto-activate if first key
        if (updated.filter(k => k.enabled).length === 1) {
            setActiveKeyId(keyEntry.id);
            setActiveProvider(keyEntry.id);
        }

        setNewKey('');
        setNewLabel('');
        setNewModel('');
        setShowAddForm(false);
    };

    const handleDeleteKey = (id) => {
        const updated = keys.filter(k => k.id !== id);
        setKeys(updated);
        saveApiKeys(updated);
        if (activeKeyId === id) {
            const nextActive = updated.find(k => k.enabled)?.id || '';
            setActiveKeyId(nextActive);
            setActiveProvider(nextActive);
        }
    };

    const handleToggleKey = (id) => {
        const updated = keys.map(k =>
            k.id === id ? { ...k, enabled: !k.enabled } : k
        );
        setKeys(updated);
        saveApiKeys(updated);
    };

    const handleSetActive = (id) => {
        setActiveKeyId(id);
        setActiveProvider(id);
    };

    const handleModelChange = (id, model) => {
        const updated = keys.map(k =>
            k.id === id ? { ...k, model } : k
        );
        setKeys(updated);
        saveApiKeys(updated);
    };

    if (!isOpen) return null;

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <div className="settings-title">
                        <HiOutlineKey style={{ fontSize: '20px' }} />
                        API Keys
                    </div>
                    <button className="settings-close" onClick={onClose}>
                        <IoClose />
                    </button>
                </div>

                <div className="settings-body">
                    <p className="settings-description">
                        Add your API keys to connect to AI providers. The active key will be used for chat.
                    </p>

                    {/* Existing Keys */}
                    <div className="api-keys-list">
                        {keys.length === 0 ? (
                            <div className="no-keys-message">
                                No API keys configured yet. Add one to get started!
                            </div>
                        ) : (
                            keys.map(key => {
                                const provider = PROVIDERS[key.provider];
                                return (
                                    <div
                                        key={key.id}
                                        className={`api-key-card ${activeKeyId === key.id ? 'active' : ''} ${!key.enabled ? 'disabled' : ''}`}
                                    >
                                        <div className="api-key-card-left">
                                            <span className="api-key-provider-icon">{provider?.icon || '🔑'}</span>
                                            <div className="api-key-info">
                                                <div className="api-key-label">{key.label}</div>
                                                <div className="api-key-meta">
                                                    {provider?.name || key.provider} · {key.apiKey.substring(0, 8)}...
                                                </div>
                                                {provider?.models?.length > 0 && (
                                                    <select
                                                        className="api-key-model-select"
                                                        value={key.model}
                                                        onChange={e => handleModelChange(key.id, e.target.value)}
                                                    >
                                                        {provider.models.map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                        <div className="api-key-card-actions">
                                            {key.enabled && activeKeyId !== key.id && (
                                                <button
                                                    className="api-key-action use"
                                                    onClick={() => handleSetActive(key.id)}
                                                    title="Set as active"
                                                >
                                                    Use
                                                </button>
                                            )}
                                            {activeKeyId === key.id && (
                                                <span className="api-key-active-badge">Active</span>
                                            )}
                                            <button
                                                className={`api-key-action toggle ${key.enabled ? 'enabled' : ''}`}
                                                onClick={() => handleToggleKey(key.id)}
                                                title={key.enabled ? 'Disable' : 'Enable'}
                                            >
                                                {key.enabled ? <HiOutlineCheck /> : <HiOutlineXMark />}
                                            </button>
                                            <button
                                                className="api-key-action delete"
                                                onClick={() => handleDeleteKey(key.id)}
                                                title="Delete key"
                                            >
                                                <HiOutlineTrash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Add Key Form */}
                    {showAddForm ? (
                        <div className="add-key-form">
                            <div className="add-key-form-title">Add New API Key</div>

                            <div className="form-group">
                                <label>Provider</label>
                                <div className="provider-selector">
                                    {Object.entries(PROVIDERS).map(([id, prov]) => (
                                        <button
                                            key={id}
                                            className={`provider-option ${newProvider === id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setNewProvider(id);
                                                setNewModel(prov.defaultModel);
                                            }}
                                            style={{ '--provider-color': prov.color }}
                                        >
                                            <span>{prov.icon}</span>
                                            <span>{prov.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>API Key</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={newKey}
                                    onChange={e => setNewKey(e.target.value)}
                                    placeholder={PROVIDERS[newProvider].placeholder}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Label (optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newLabel}
                                    onChange={e => setNewLabel(e.target.value)}
                                    placeholder={`My ${PROVIDERS[newProvider].name} key`}
                                />
                            </div>

                            <div className="form-group">
                                <label>Model</label>
                                <select
                                    className="form-input form-select"
                                    value={newModel || PROVIDERS[newProvider].defaultModel}
                                    onChange={e => setNewModel(e.target.value)}
                                >
                                    {PROVIDERS[newProvider].models.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-actions">
                                <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddKey}
                                    disabled={!newKey.trim()}
                                >
                                    Add Key
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="add-key-btn" onClick={() => {
                            setShowAddForm(true);
                            setNewModel(PROVIDERS[newProvider].defaultModel);
                        }}>
                            <HiOutlinePlus />
                            Add API Key
                        </button>
                    )}

                    {/* News API Keys Section */}
                    <div className="settings-section-divider" />
                    <div className="settings-subtitle">
                        <span>📰</span> News API Keys
                    </div>
                    <p className="settings-description" style={{ marginTop: 0 }}>
                        Optional — Reddit news works without any key. Add NewsAPI for more sources.
                    </p>

                    <div className="news-keys-form">
                        <div className="form-group">
                            <label>
                                📰 NewsAPI.org
                                <a href="https://newsapi.org/register" target="_blank" rel="noopener noreferrer" className="key-help-link">Get free key →</a>
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                value={newsKeys.newsapi || ''}
                                onChange={e => handleNewsKeyChange('newsapi', e.target.value)}
                                placeholder="Your NewsAPI.org key"
                            />
                        </div>
                        <div className="news-keys-note">
                            ℹ️ Reddit news & Open-Meteo weather work without any API key. Keys are saved locally in your browser.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
