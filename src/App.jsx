import React, { useState, useCallback } from 'react';
import { ChatProvider } from './context/ChatContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import SetupScreen from './components/SetupScreen.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import NewsPanel from './components/NewsPanel.jsx';
import { hasAnyKeys } from './components/SettingsModal.jsx';
import 'highlight.js/styles/atom-one-dark.css';

export default function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [newsOpen, setNewsOpen] = useState(false);
    const [isSetup, setIsSetup] = useState(() => hasAnyKeys());
    const [prefillMessage, setPrefillMessage] = useState('');

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleSetupComplete = useCallback(() => {
        setIsSetup(true);
    }, []);

    const handleAskAboutNews = useCallback((prompt) => {
        setPrefillMessage(prompt);
        setNewsOpen(false);
    }, []);

    if (!isSetup) {
        return <SetupScreen onComplete={handleSetupComplete} />;
    }

    return (
        <ChatProvider>
            <div className="app-layout">
                <Sidebar
                    isOpen={sidebarOpen}
                    onToggle={toggleSidebar}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onOpenNews={() => setNewsOpen(true)}
                />
                {newsOpen ? (
                    <NewsPanel
                        onClose={() => setNewsOpen(false)}
                        onAskAbout={handleAskAboutNews}
                    />
                ) : (
                    <ChatArea
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={toggleSidebar}
                        prefillMessage={prefillMessage}
                        onPrefillUsed={() => setPrefillMessage('')}
                    />
                )}
                <SettingsModal
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                />
            </div>
        </ChatProvider>
    );
}
