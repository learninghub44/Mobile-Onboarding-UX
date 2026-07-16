import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/data/mockData';

interface SettingItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  showChevron?: boolean;
}

function SettingItem({ icon, label, value, onPress, danger = false, showChevron = true }: SettingItemProps) {
  const colors = useColors();
  const iconColor = danger ? colors.destructive : colors.mutedForeground;
  const labelColor = danger ? colors.destructive : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        { borderBottomColor: colors.border, backgroundColor: pressed ? colors.muted : 'transparent' },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: (danger ? colors.destructive : colors.accent) + '15' }]}>
        <Feather name={icon} size={17} color={iconColor} />
      </View>
      <Text style={[styles.settingLabel, { color: labelColor, flex: 1 }]}>{label}</Text>
      {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
      {showChevron && <Feather name="chevron-right" size={17} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, organizations, currentOrg, switchOrganization, logout } = useApp();

  if (!user || !currentOrg) return null;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  async function handleLogout() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of CHAMA-HUB X?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login' as never);
          },
        },
      ],
    );
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    treasurer: 'Treasurer',
    secretary: 'Secretary',
    member: 'Member',
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Profile header */}
        <LinearGradient
          colors={[colors.gradientCard, colors.gradientCardEnd]}
          style={[styles.profileHeader, { paddingTop: topPad + 24 }]}
        >
          <Avatar initials={user.initials} size="xl" color="rgba(255,255,255,0.2)" ring />
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.profileBadgeRow}>
            <Badge label={ROLE_LABELS[user.role] ?? user.role} variant="default" />
          </View>
        </LinearGradient>

        {/* Organizations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Organizations</Text>
          {organizations.map(org => (
            <Card
              key={org.id}
              onPress={() => switchOrganization(org.id)}
              style={[
                styles.orgCard,
                org.id === currentOrg.id && {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={styles.orgRow}>
                <View style={[styles.orgColorDot, { backgroundColor: org.color }]} />
                <View style={styles.orgInfo}>
                  <Text style={[styles.orgName, { color: colors.foreground }]}>{org.name}</Text>
                  <Text style={[styles.orgType, { color: colors.mutedForeground }]}>
                    {org.type} · {org.membersCount} members
                  </Text>
                </View>
                <View style={styles.orgRight}>
                  <Text style={[styles.orgBalance, { color: colors.foreground }]}>
                    {formatCurrency(org.balance, org.currencySymbol, org.currency)}
                  </Text>
                  {org.id === currentOrg.id && (
                    <View style={[styles.activePill, { backgroundColor: colors.successLight }]}>
                      <Text style={[styles.activePillText, { color: colors.success }]}>Active</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <SettingItem icon="user" label="Edit Profile" onPress={() => {}} />
            <SettingItem icon="bell" label="Notifications" onPress={() => {}} />
            <SettingItem icon="shield" label="Security" onPress={() => {}} />
            <SettingItem icon="smartphone" label="Biometric Login" value="Off" onPress={() => {}} />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <SettingItem icon="moon" label="Dark Mode" value="System" onPress={() => {}} />
            <SettingItem icon="globe" label="Language" value="English" onPress={() => {}} />
            <SettingItem icon="dollar-sign" label="Default Currency" value={currentOrg.currency} onPress={() => {}} />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Support</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <SettingItem icon="help-circle" label="Help Center" onPress={() => {}} />
            <SettingItem icon="message-circle" label="Contact Support" onPress={() => {}} />
            <SettingItem icon="file-text" label="Privacy Policy" onPress={() => {}} />
            <SettingItem icon="info" label="About CHAMA-HUB X" value="v1.0.0" onPress={() => {}} />
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <SettingItem
              icon="log-out"
              label="Sign Out"
              onPress={handleLogout}
              danger
              showChevron={false}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 8,
  },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#FFFFFF', marginTop: 8 },
  profileEmail: { fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  profileBadgeRow: { marginTop: 4 },
  section: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  orgCard: { marginBottom: 0 },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orgColorDot: { width: 12, height: 12, borderRadius: 6 },
  orgInfo: { flex: 1 },
  orgName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  orgType: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  orgRight: { alignItems: 'flex-end', gap: 4 },
  orgBalance: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: -0.2 },
  activePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  activePillText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  settingsCard: { borderWidth: 1, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  settingValue: { fontFamily: 'Inter_400Regular', fontSize: 14 },
});
