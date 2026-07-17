import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { SupportPageLayout, SupportSection } from '@/components/SupportPageLayout';

let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {
  // optional dependency — not available on this platform/build
}

type Status = 'checking' | 'no-hardware' | 'not-enrolled' | 'ready';

export default function BiometricScreen() {
  const colors = useColors();
  const [status, setStatus] = useState<Status>('checking');
  const [biometryType, setBiometryType] = useState<string>('Biometric');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('biometric_enabled');
      setEnabled(stored === 'true');

      if (!LocalAuthentication) {
        setStatus('no-hardware');
        return;
      }
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          setStatus('no-hardware');
          return;
        }
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types?.includes?.(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometryType('Face ID');
        } else if (types?.includes?.(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometryType('Fingerprint');
        }
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setStatus(isEnrolled ? 'ready' : 'not-enrolled');
      } catch {
        setStatus('no-hardware');
      }
    })();
  }, []);

  async function handleToggle(next: boolean) {
    if (status !== 'ready') return;
    setBusy(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: next ? 'Authenticate to enable biometric login' : 'Authenticate to disable biometric login',
        fallbackLabel: 'Use passcode',
      });
      if (result.success) {
        setEnabled(next);
        await AsyncStorage.setItem('biometric_enabled', String(next));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch {
      Alert.alert('Error', 'Failed to configure biometric authentication.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SupportPageLayout title="Biometric Login">
      <SupportSection>
        Use {biometryType} to unlock ChamaYetu instead of typing your password every time.
      </SupportSection>

      {status === 'checking' && (
        <View style={styles.centerRow}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {status === 'no-hardware' && (
        <View style={[styles.noticeBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="alert-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            This device doesn't support biometric authentication, or it's unavailable in this build.
          </Text>
        </View>
      )}

      {status === 'not-enrolled' && (
        <View style={[styles.noticeBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="alert-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            No {biometryType.toLowerCase()} is set up on this device yet. Add one in your device Settings
            first, then come back here.
          </Text>
        </View>
      )}

      {status === 'ready' && (
        <Pressable
          onPress={() => handleToggle(!enabled)}
          disabled={busy}
          style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
        >
          <View style={[styles.toggleIcon, { backgroundColor: colors.accent + '15' }]}>
            <Feather name="smartphone" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{biometryType} Login</Text>
            <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Switch value={enabled} onValueChange={handleToggle} disabled={busy} />
        </Pressable>
      )}
    </SupportPageLayout>
  );
}

const styles = StyleSheet.create({
  centerRow: { paddingVertical: 24, alignItems: 'center' },
  noticeBox: { flexDirection: 'row', gap: 10, padding: 16, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1 },
  toggleIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  toggleSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
});
