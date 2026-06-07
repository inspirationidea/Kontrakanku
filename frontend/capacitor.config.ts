import { CapacitorConfig } from '@capacitor/cli';

const isProd = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.kontrakanku.app',
  appName: 'KontrakanKu',
  webDir: 'dist',
  server: {
    // hostname hanya di production agar CORS cookie bekerja dengan benar
    ...(isProd ? { hostname: 'app.kontrakanku.id' } : {}),
    // Saat development: set CAPACITOR_SERVER_URL ke http://<IP-lokal>:5173
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: !isProd,
  },
  android: {
    allowMixedContent: !isProd,
    captureInput: true,
    webContentsDebuggingEnabled: !isProd,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0a0712',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
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
