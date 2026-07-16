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

export default function CreateOrgScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshOrganizations } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState('Chama');
  const [currency, setCurrency] = useState('KES');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ORG_TYPES = [
    { value: 'Chama', label: 'Chama', icon: 'users' },
    { value: 'SACCO', label: 'SACCO', icon: 'briefcase' },
    { value: 'Investment Group', label: 'Investment Group', icon: 'trending-up' },
  ];

  const CURRENCIES = [
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'UGX', label: 'UGX - Ugandan Shilling' },
    { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
    { value: 'NGN', label: 'NGN - Nigerian Naira' },
    { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
  ];

  async function handleCreate() {
    if (!name.trim()) {
      setError('Please enter an organization name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: name.trim(),
          type,
          currency,
          currency_symbol: currency === 'KES' ? 'KSh' : currency === 'USD' ? 'US$' : currency,
          created_by: user!.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          org_id: org.id,
          user_id: user!.id,
          role: 'admin',
          status: 'active',
        });

      if (memberError) throw memberError;

      await refreshOrganizations(org.id);

      // Navigate to dashboard
      router.replace('/(tabs)' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization. Please try again.');
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
          <Text style={[styles.title, { color: colors.foreground }]}>Create Organization</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Set up your organization details
          </Text>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight, borderRadius: colors.radius }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Organization Name"
              placeholder="e.g., Umoja Investment Group"
              value={name}
              onChangeText={setName}
              autoFocus
              leftIcon="users"
            />

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Organization Type</Text>
              <View style={styles.typeGrid}>
                {ORG_TYPES.map(orgType => (
                  <Pressable
                    key={orgType.value}
                    onPress={() => setType(orgType.value)}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: type === orgType.value ? colors.primary : colors.border,
                        borderWidth: type === orgType.value ? 2 : 1,
                      },
                    ]}
                  >
                    <Feather name={orgType.icon as any} size={24} color={type === orgType.value ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.typeLabel, { color: type === orgType.value ? colors.primary : colors.foreground }]}>
                      {orgType.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Currency</Text>
              <View style={styles.currencyList}>
                {CURRENCIES.map(curr => (
                  <Pressable
                    key={curr.value}
                    onPress={() => setCurrency(curr.value)}
                    style={[
                      styles.currencyItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: currency === curr.value ? colors.primary : colors.border,
                        borderWidth: currency === curr.value ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.currencyLabel, { color: currency === curr.value ? colors.primary : colors.foreground }]}>
                      {curr.label}
                    </Text>
                    {currency === curr.value && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.createBtn}>
            <Button
              title="Create Organization"
              onPress={handleCreate}
              loading={loading}
              disabled={!name.trim()}
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
  content: { gap: 20, marginTop: 12 },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: -12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  form: { gap: 24, marginTop: 8 },
  section: { gap: 12 },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  typeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  currencyList: {
    gap: 10,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  currencyLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  createBtn: { marginTop: 8 },
});