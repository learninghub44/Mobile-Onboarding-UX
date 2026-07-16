import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function PasswordStrength({ password }: { password: string }) {
  const colors = useColors();
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const strengthColor =
    score <= 1 ? colors.destructive : score === 2 ? colors.warning : score === 3 ? colors.info : colors.success;
  const strengthLabel =
    score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  if (!password) return null;

  return (
    <View style={pwStyles.container}>
      <View style={pwStyles.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              pwStyles.bar,
              { backgroundColor: i <= score ? strengthColor : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[pwStyles.label, { color: strengthColor }]}>{strengthLabel}</Text>
    </View>
  );
}

const pwStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 12, minWidth: 44 },
});

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      // Navigate to profile setup
      router.replace('/(profile-setup)' as never);
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>

           <View style={styles.titleBlock}>
             <Text style={[styles.title, { color: colors.foreground }]}>Create account</Text>
             <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
               Join thousands of organizations managing their finances with ChamaYetu
             </Text>
           </View>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Full name"
            placeholder="Sarah Wanjiku"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            leftIcon="user"
          />

          <Input
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail"
          />

          <Input
            label="Password"
            placeholder="Create a strong password"
            value={password}
            onChangeText={setPassword}
            secureToggle
            leftIcon="lock"
            hint="At least 8 characters with uppercase, numbers, and symbols"
          />

          <PasswordStrength password={password} />

          <View style={[styles.termsRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          <Button title="Create Account" onPress={handleRegister} loading={loading} />

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.loginLink, { color: colors.accent }]}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 20 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  titleBlock: { gap: 8, marginBottom: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginTop: -8,
  },
  termsText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1, lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  loginText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  loginLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
