import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { SupportPageLayout, SupportSection } from '@/components/SupportPageLayout';

export default function SecurityScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  if (!user) return null;

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    setChanging(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      });
      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect.');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Success', 'Password changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', (err as any)?.message || 'Failed to change password.');
    } finally {
      setChanging(false);
    }
  }

  return (
    <SupportPageLayout title="Security">
      <SupportSection heading="Change Password">
        Use a password you don't use anywhere else — at least 8 characters.
      </SupportSection>

      <View style={styles.field}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Current password"
          placeholderTextColor={colors.mutedForeground}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="New password"
          placeholderTextColor={colors.mutedForeground}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Confirm new password"
          placeholderTextColor={colors.mutedForeground}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <Pressable
        onPress={handleChangePassword}
        disabled={changing || !currentPassword || !newPassword || !confirmPassword}
        style={[
          styles.saveBtn,
          { backgroundColor: colors.primary, opacity: changing || !currentPassword || !newPassword || !confirmPassword ? 0.6 : 1 },
        ]}
      >
        <Text style={styles.saveBtnText}>{changing ? 'Updating...' : 'Update Password'}</Text>
      </Pressable>
    </SupportPageLayout>
  );
}

const styles = StyleSheet.create({
  field: { gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  saveBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFFF' },
});
