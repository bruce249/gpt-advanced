import React, { useState } from 'react';
import { HiOutlineSparkles, HiOutlineKey } from 'react-icons/hi2';
import { PROVIDERS, saveApiKeys, setActiveProvider } from './SettingsModal.jsx';

const QUICK_SETUP_PROVIDERS = ['openai', 'gemini', 'huggingface'];

export default function SetupScreen({ onComplete }) {
    const [selectedProvider, setSelectedProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState(PROVIDERS.openai.defaultModel);
    const [label, setLabel] = useState('');
    const [error, setError] = useState('');
    const [testing, setTesting] = useState(false);

    const handleProviderChange = (providerId) => {
        setSelectedProvider(providerId);
        setModel(PROVIDERS[providerId].defaultModel);
        setError('');
    };

    const handleSubmit = async () => {
        if (!apiKey.trim()) {
            setError('Please enter an API key.');
            return;
        }

        setTesting(true);
        setError('');

        // Quick validation — just check the format
        const provider = PROVIDERS[selectedProvider];
        let isValid = true;

        if (selectedProvider === 'openai' && !apiKey.startsWith('sk-')) {
            isValid = false;
            setError('OpenAI keys typically start with "sk-". Please check your key.');
        } else if (selectedProvider === 'gemini' && !apiKey.startsWith('AIza')) {
            isValid = false;
            setError('Gemini keys typically start with "AIza". Please check your key.');
        } else if (selectedProvider === 'huggingface' && !apiKey.startsWith('hf_')) {
            isValid = false;
            setError('Hugging Face keys typically start with "hf_". Please check your key.');
        }

        if (!isValid) {
            setTesting(false);
            return;
        }

        // Save the key
        const keyEntry = {
            id: Date.now().toString(),
            provider: selectedProvider,
            label: label.trim() || `${provider.name} Key`,
            apiKey: apiKey.trim(),
            model: model,
            enabled: true,
            createdAt: Date.now(),
        };

        saveApiKeys([keyEntry]);
        setActiveProvider(keyEntry.id);
        setTesting(false);
        onComplete();
    };

    return (
        <div className="setup-screen">
            <div className="setup-container">
                <div className="setup-logo">
                    <HiOutlineSparkles style={{ color: 'var(--accent-primary)', fontSize: '32px' }} />
                </div>
                <h1 className="setup-title">Welcome to GPT Advanced</h1>
                <p className="setup-subtitle">
                    Connect your AI provider to get started. You can add more keys later in settings.
                </p>

                {/* Provider Selection */}
                <div className="setup-providers">
                    {QUICK_SETUP_PROVIDERS.map(id => {
                        const prov = PROVIDERS[id];
                        return (
                            <button
                                key={id}
                                className={`setup-provider-card ${selectedProvider === id ? 'selected' : ''}`}
                                onClick={() => handleProviderChange(id)}
                                style={{ '--provider-color': prov.color }}
                            >
                                <span className="setup-provider-icon">{prov.icon}</span>
                                <span className="setup-provider-name">{prov.name}</span>
                                <span className="setup-provider-desc">{prov.description}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Key Input */}
                <div className="setup-form">
                    <div className="form-group">
                        <label>
                            <HiOutlineKey style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            {PROVIDERS[selectedProvider].name} API Key
                        </label>
                        <input
                            type="password"
                            className="form-input setup-key-input"
                            value={apiKey}
                            onChange={e => { setApiKey(e.target.value); setError(''); }}
                            placeholder={PROVIDERS[selectedProvider].placeholder}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Model</label>
                        <select
                            className="form-input form-select"
                            value={model}
                            onChange={e => setModel(e.target.value)}
                        >
                            {PROVIDERS[selectedProvider].models.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="setup-error">{error}</div>
                    )}

                    <button
                        className="setup-submit-btn"
                        onClick={handleSubmit}
                        disabled={!apiKey.trim() || testing}
                    >
                        {testing ? 'Connecting...' : 'Start Chatting →'}
                    </button>

                    <div className="setup-hint">
                        {selectedProvider === 'openai' && (
                            <span>Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a></span>
                        )}
                        {selectedProvider === 'gemini' && (
                            <span>Get your key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a></span>
                        )}
                        {selectedProvider === 'huggingface' && (
                            <span>Get your key at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">huggingface.co/settings/tokens</a></span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
