import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ia.hypertrof.app',
  appName: 'HipertrofIA',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.12:3001',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
