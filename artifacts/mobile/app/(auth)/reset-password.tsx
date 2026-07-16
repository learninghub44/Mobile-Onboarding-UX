import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

// Supabase recovery links append tokens as a URL fragment
// (chamayetu://reset-password#access_token=...&refresh_token=...&type=recovery).
// detectSessionInUrl is off for the RN client, so we parse them ourselves.
function parseTokensFromUrl(url: string | null): { access_token?: string; refresh_token?: string } {
  if (!url) return {};
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const paramsStr =
    hashIndex >= 0 ? url.slice(hashIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : '';
  if (!paramsStr) return {};
  const params = new URLSearchParams(paramsStr);
  return {
    access_token: params.get('access_token') ?? undefined,
    refresh_token: params.get('refresh_token') ?? undefined,
  };
}

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function establishSession(url: string | null) {
      const { access_token, refresh_token } = parseTokensFromUrl(url);
      if (!access_token || !refresh_token) return;
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (cancelled) return;
      if (error) {
        setLinkError('This reset link is invalid or has expired. Request a new one from the sign-in screen.');
      } else {
        setReady(true);
      }
    }

    Linking.getInitialURL().then(establishSession);
    const subscription = Linking.addEventListener('url', ({ url }) => establishSession(url));

    // Some platforms surface the recovery session via this event instead.
    const { data: authSub } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.remove();
      authSub.subscription.unsubscribe();
    };
  }, []);

  async function handleReset() {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Feather name="check-circle" size={48} color={colors.success} />
        <Text style={[styles.title, styles.centerText, { color: colors.foreground }]}>Password updated</Text>
        <Text style={[styles.subtitle, styles.centerText, { color: colors.mutedForeground }]}>
          Your password has been reset. Sign in with your new password.
        </Text>
        <Button title="Back to Sign In" onPress={() => router.replace('/(auth)/login' as never)} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Set a new password</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {linkError ? ' ' : ready ? 'Choose a new password for your account.' : 'Verifying your reset link…'}
          </Text>

          {(error || linkError) ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error || linkError}</Text>
            </View>
          ) : null}

          <Input
            label="New password"
            placeholder="Enter a new password"
            value={password}
            onChangeText={setPassword}
            secureToggle
            leftIcon="lock"
            editable={ready}
          />
          <Input
            label="Confirm password"
            placeholder="Re-enter the new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureToggle
            leftIcon="lock"
            editable={ready}
          />

          <Button title="Reset Password" onPress={handleReset} loading={loading} disabled={!ready} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 24 },
  centerText: { textAlign: 'center' },
  container: { paddingHorizontal: 24, gap: 20 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
});
