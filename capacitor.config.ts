import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gptadvanced.app',
  appName: 'GPT Advanced',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0f',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    backgroundColor: '#0a0a0f',
    allowMixedContent: true,
  },
};

export default config;
