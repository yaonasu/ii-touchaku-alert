import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iinotify.app',
  appName: 'ii-到着通知',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
