import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lightway.lcmspro',
  appName: 'LCMS PRO',
  webDir: 'dist',
  server: {
    // For local/dev testing against a live backend, uncomment and set your
    // hosted Cloud Run URL here. Leave commented to load the bundled build.
    // url: 'https://your-cloud-run-url.run.app',
    // cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
