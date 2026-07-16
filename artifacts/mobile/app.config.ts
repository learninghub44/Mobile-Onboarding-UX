import { ConfigContext, ExpoConfig } from 'expo/config';

// Keep in sync with constants/site.ts (WEB_APP_URL) -- the Expo config
// loader evaluates this file standalone and can't resolve local TS
// imports, so this value is duplicated rather than imported.
const WEB_APP_URL = 'https://chamayetu.christech.co.ke';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ChamaYetu',
  slug: 'mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon_2.png',
  scheme: 'chamayetu',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/icon_2.png',
    resizeMode: 'contain',
    backgroundColor: '#0F2D5E',
  },
  ios: { supportsTablet: false },
  android: {},
  web: { favicon: './assets/images/icon_2.png' },
  plugins: [
    ['expo-router', { origin: WEB_APP_URL }],
    'expo-font',
    'expo-web-browser',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    // Supabase — anon key is public by design; service role key stays server-only.
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  },
});
