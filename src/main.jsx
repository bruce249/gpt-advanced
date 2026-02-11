import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import App from './App.jsx';
import './index.css';

// Initialize Capacitor plugins on native platforms
if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0a0a0f' }).catch(() => {});

    // Handle keyboard events for better mobile UX
    Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
        document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.setProperty('--keyboard-height', '0px');
        document.body.classList.remove('keyboard-open');
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
