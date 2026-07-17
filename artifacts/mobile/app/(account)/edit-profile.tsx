import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { SupportPageLayout } from '@/components/SupportPageLayout';
import { Avatar } from '@/components/ui/Avatar';

export default function EditProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), phone: phone.trim() || null })
        .eq('id', user!.id);
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', (err as any)?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SupportPageLayout title="Edit Profile">
      <View style={styles.avatarRow}>
        <Avatar initials={user.initials} size="xl" color={colors.accent} ring />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Full name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="+254 7XX XXX XXX"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
        <View style={[styles.input, styles.readonly, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 15 }}>
            {user.email}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving || !name.trim()}
        style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving || !name.trim() ? 0.6 : 1 }]}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
      </Pressable>
    </SupportPageLayout>
  );
}

const styles = StyleSheet.create({
  avatarRow: { alignItems: 'center', marginBottom: 8 },
  field: { gap: 6 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  readonly: { justifyContent: 'center' },
  saveBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFFF' },
});
