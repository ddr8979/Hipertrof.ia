import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hypertrofia.app',
  appName: 'hypertrof.ia',
  webDir: 'out',
  server: {
    url: 'https://hypertrofia.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;