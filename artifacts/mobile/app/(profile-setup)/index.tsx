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

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useApp();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Update profile with phone number
      const { supabase } = await import('@/lib/supabase');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      // Navigate to organization setup
      router.replace('/(org-setup)/welcome' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Feather name="user" size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>Complete Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Add your phone number so other members can reach you
          </Text>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Phone Number"
              placeholder="+254 712 345 678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              leftIcon="phone"
            />

            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
              <Feather name="info" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Your phone number will be visible to other members in your organization.
              </Text>
            </View>
          </View>

          <View style={styles.continueBtn}>
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={loading}
              disabled={!phone.trim()}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 24 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  content: { gap: 20, marginTop: 20 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: -8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  form: { gap: 16, marginTop: 8 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  continueBtn: { marginTop: 8 },
});