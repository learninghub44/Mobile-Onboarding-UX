import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { SupportPageLayout } from '@/components/SupportPageLayout';

interface Pref {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  default: boolean;
}

const PREFS: Pref[] = [
  { key: 'notif_all', icon: 'bell', label: 'Push Notifications', description: 'Master switch for all notifications', default: true },
  { key: 'notif_contributions', icon: 'plus-circle', label: 'Contributions', description: 'When a member contributes to your organization', default: true },
  { key: 'notif_loans', icon: 'credit-card', label: 'Loans', description: 'Loan requests, approvals, and repayments', default: true },
  { key: 'notif_meetings', icon: 'calendar', label: 'Meetings', description: 'Reminders for upcoming meetings', default: true },
  { key: 'notif_invites', icon: 'user-plus', label: 'Invitations', description: 'When you\'re invited to an organization', default: true },
];

export default function NotificationsScreen() {
  const colors = useColors();
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map(p => [p.key, p.default])),
  );

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        PREFS.map(async p => {
          const stored = await AsyncStorage.getItem(p.key);
          return [p.key, stored !== null ? stored === 'true' : p.default] as const;
        }),
      );
      setValues(Object.fromEntries(entries));
    })();
  }, []);

  async function toggle(key: string, next: boolean) {
    setValues(v => ({ ...v, [key]: next }));
    await AsyncStorage.setItem(key, String(next));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  const masterOff = !values.notif_all;

  return (
    <SupportPageLayout title="Notifications">
      <View style={styles.list}>
        {PREFS.map((p, idx) => (
          <View
            key={p.key}
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
              idx > 0 && masterOff ? { opacity: 0.5 } : null,
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.accent + '15' }]}>
              <Feather name={p.icon} size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{p.label}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{p.description}</Text>
            </View>
            <Switch
              value={values[p.key] ?? p.default}
              onValueChange={next => toggle(p.key, next)}
              disabled={idx > 0 && masterOff}
            />
          </View>
        ))}
      </View>
    </SupportPageLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  rowIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  rowSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
});
