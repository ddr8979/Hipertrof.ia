import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hypertrofia.app',
  appName: 'hypertrof.ia',
  webDir: 'out',
  server: {
    url: 'https://answering-chef-producer-reservation.trycloudflare.com',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;