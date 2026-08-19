import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hypertrofia.app',
  appName: 'hypertrof.ia',
  webDir: 'out',
  server: {
    url: 'https://defensive-trades-operations-craig.trycloudflare.com',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;