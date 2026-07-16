import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CHAMA-HUB X',
  slug: 'mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon_2.png',
  scheme: 'mobile',
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
    ['expo-router', { origin: 'https://replit.com/' }],
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
