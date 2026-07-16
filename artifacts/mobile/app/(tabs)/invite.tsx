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
import { inviteMember } from '@/lib/queries';

export default function InviteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentOrg } = useApp();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleInvite() {
    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!currentOrg?.id) {
      setError('No active organization selected.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await inviteMember(currentOrg.id, email);
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Feather name="user-plus" size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>Invite Members</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Invite members to join {currentOrg?.name || 'your organization'}
          </Text>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderRadius: colors.radius }]}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="member@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              leftIcon="mail"
            />

            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
              <Feather name="info" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                The member will receive an email invitation to join your organization. They'll need to create an account if they don't have one.
              </Text>
            </View>
          </View>

          <View style={styles.inviteBtn}>
            <Button
              title="Send Invitation"
              onPress={handleInvite}
              loading={loading}
              disabled={!email.trim()}
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  successText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
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
  inviteBtn: { marginTop: 8 },
});