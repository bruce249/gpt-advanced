import React, { useState, useCallback } from 'react';
import { ChatProvider } from './context/ChatContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import SetupScreen from './components/SetupScreen.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { hasAnyKeys } from './components/SettingsModal.jsx';
import 'highlight.js/styles/atom-one-dark.css';

export default function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isSetup, setIsSetup] = useState(() => hasAnyKeys());

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleSetupComplete = useCallback(() => {
        setIsSetup(true);
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
                />
                <ChatArea sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
                <SettingsModal
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                />
            </div>
        </ChatProvider>
    );
}
