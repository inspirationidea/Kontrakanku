import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kontrakanku.app',
  appName: 'KontrakanKu',
  webDir: 'dist',
  server: {
    // Development: set CAPACITOR_SERVER_URL ke IP lokal, misal: http://192.168.1.x:4000
    // Production: set CAPACITOR_SERVER_URL ke domain backend dengan HTTPS
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: process.env.NODE_ENV !== 'production', // HTTP hanya di dev
  },
  android: {
    allowMixedContent: process.env.NODE_ENV !== 'production',
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production', // matikan di production
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0712',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0712',
    },
    Camera: {
      presentationStyle: 'fullscreen',
    },
  },
};

export default config;
