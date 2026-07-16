import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// EXPO_PUBLIC_ vars are inlined by Metro at bundle time from the runtime environment:
// EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL  EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set both securely in your runtime environment before starting the app.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
