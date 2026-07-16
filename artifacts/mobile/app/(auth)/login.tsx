import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { WEB_APP_URL } from '@/constants/site';

// Native builds must use the chamayetu:// scheme to reopen the app;
// a browser tab (Expo web) needs a real https URL on the deployed domain.
const RESET_PASSWORD_REDIRECT =
  Platform.OS === 'web' ? `${WEB_APP_URL}/reset-password` : 'chamayetu://reset-password';
const AUTH_CALLBACK_REDIRECT =
  Platform.OS === 'web' ? `${WEB_APP_URL}/auth/callback` : 'chamayetu://auth/callback';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation will be handled by AppContext's onAuthStateChange
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Gradient header */}
      <LinearGradient
        colors={[colors.gradientCard, colors.gradientCardEnd]}
        style={[styles.header, { paddingTop: insets.top + 32 }]}
      >
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Image
                source={require('@/assets/images/icon_2.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.brandName}>ChamaYetu</Text>
              <Text style={styles.brandTagline}>by ChrisTech</Text>
            </View>
          </View>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your account to continue</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureToggle
            leftIcon="lock"
          />

           <Pressable
             onPress={async () => {
               if (!email.trim()) {
                 setError('Please enter your email address first.');
                 return;
               }
               setError('');
               setLoading(true);
               try {
                 const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                   redirectTo: RESET_PASSWORD_REDIRECT,
                 });
                 if (error) throw error;
                 setResetSent(true);
                 Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
               } catch (err) {
                 setError(err instanceof Error ? err.message : 'Failed to send reset email.');
               } finally {
                 setLoading(false);
               }
             }}
             hitSlop={8}
           >
             <Text style={[styles.forgotPassword, { color: colors.accent }]}>
               Forgot your password?
             </Text>
           </Pressable>

          <Button title="Sign In" onPress={handleLogin} loading={loading} />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

           <View style={styles.socialRow}>
             <Pressable
               onPress={async () => {
                 await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 // Note: OAuth providers must be enabled in Supabase Dashboard → Authentication → Providers
                 const { error } = await supabase.auth.signInWithOAuth({
                   provider: 'google',
                   options: { redirectTo: AUTH_CALLBACK_REDIRECT },
                 });
                 if (error) Alert.alert('Sign In Failed', error.message);
               }}
               style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}
             >
               <Feather name="globe" size={18} color={colors.foreground} />
               <Text style={[styles.socialText, { color: colors.foreground }]}>Google</Text>
             </Pressable>
             {Platform.OS === 'ios' && (
               <Pressable
                 onPress={async () => {
                   await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                   // Note: OAuth providers must be enabled in Supabase Dashboard → Authentication → Providers
                   const { error } = await supabase.auth.signInWithOAuth({
                     provider: 'apple',
                     options: { redirectTo: AUTH_CALLBACK_REDIRECT },
                   });
                   if (error) Alert.alert('Sign In Failed', error.message);
                 }}
                 style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}
               >
                 <Feather name="smartphone" size={18} color={colors.foreground} />
                 <Text style={[styles.socialText, { color: colors.foreground }]}>Apple</Text>
               </Pressable>
             )}
           </View>

           {resetSent && (
             <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderRadius: colors.radius }]}>
               <Feather name="check-circle" size={14} color={colors.success} />
               <Text style={[styles.successText, { color: colors.success }]}>
                 Check your email for a password reset link.
               </Text>
             </View>
           )}
           <View style={styles.signupRow}>
             <Text style={[styles.signupText, { color: colors.mutedForeground }]}>
               Don't have an account?{' '}
             </Text>
             <Pressable onPress={() => router.push('/(auth)/register' as never)}>
               <Text style={[styles.signupLink, { color: colors.accent }]}>Create account</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  welcomeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 40,
  },
  welcomeSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  formContainer: {
    padding: 24,
    gap: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    flex: 1,
  },
  forgotPassword: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  socialText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signupText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  signupLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  successText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1 },
});
