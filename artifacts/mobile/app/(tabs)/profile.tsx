import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Biometric authentication - optional feature
let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {
  console.log('expo-local-authentication not available');
}

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

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState('system');
  const [language, setLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const systemColorScheme = useColorScheme();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const [bio, dark, lang, notif] = await Promise.all([
          AsyncStorage.getItem('biometric_enabled'),
          AsyncStorage.getItem('dark_mode'),
          AsyncStorage.getItem('language'),
          AsyncStorage.getItem('notifications_enabled'),
        ]);
        if (bio !== null) setBiometricEnabled(bio === 'true');
        if (dark !== null) setDarkMode(dark);
        if (lang !== null) setLanguage(lang);
        if (notif !== null) setNotificationsEnabled(notif === 'true');
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
    loadPreferences();
  }, []);

  async function handleLogout() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of ChamaYetu?',
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

  async function handleSaveProfile() {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ name: name.trim(), phone: phone.trim() || null }).eq('id', user!.id);
      if (error) throw error;
      setEditingProfile(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleBiometricToggle() {
    if (!LocalAuthentication) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
        return;
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Not Enrolled', 'Please set up biometric authentication in your device settings first.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        const newValue = !biometricEnabled;
        setBiometricEnabled(newValue);
        await AsyncStorage.setItem('biometric_enabled', String(newValue));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', newValue ? 'Biometric login enabled' : 'Biometric login disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to configure biometric authentication.');
    }
  }

  async function handleDarkModeChange(mode: string) {
    setDarkMode(mode);
    await AsyncStorage.setItem('dark_mode', mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', `Theme set to ${mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'} mode. Restart the app to see changes.`);
  }

  async function handleLanguageChange(lang: string) {
    setLanguage(lang);
    await AsyncStorage.setItem('language', lang);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', `Language changed to ${lang === 'en' ? 'English' : lang}. Restart the app to see changes.`);
  }

  async function handleNotificationsToggle() {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem('notifications_enabled', String(newValue));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', newValue ? 'Notifications enabled' : 'Notifications disabled');
  }

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
    setChangingPassword(true);
    try {
      // First, verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      });
      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect.');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password changed successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  }

  function handleHelpCenter() {
    Linking.openURL('https://chamayetu.christech.co.ke/help');
  }

  function handleContactSupport() {
    Linking.openURL('mailto:support@chamayetu.christech.co.ke?subject=Support Request');
  }

  function handlePrivacyPolicy() {
    Linking.openURL('https://chamayetu.christech.co.ke/privacy');
  }

  function handleTermsOfService() {
    Linking.openURL('https://chamayetu.christech.co.ke/terms');
  }

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
              style={styles.orgCard}
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
             <SettingItem
               icon="user"
               label="Edit Profile"
               value={editingProfile ? 'Editing...' : undefined}
               onPress={() => {
                 setName(user.name);
                 setPhone(user.phone || '');
                 setEditingProfile(true);
               }}
             />
             <SettingItem
               icon="bell"
               label="Notifications"
               value={notificationsEnabled ? 'On' : 'Off'}
               onPress={handleNotificationsToggle}
             />
             <SettingItem
               icon="smartphone"
               label="Biometric Login"
               value={biometricEnabled ? 'On' : 'Off'}
               onPress={handleBiometricToggle}
             />
           </View>
         </View>

         {editingProfile && (
           <View style={[styles.section, { marginTop: -8 }]}>
             <View style={[styles.editProfileCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, padding: 16, gap: 12 }]}>
               <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Edit Profile</Text>
               <TextInput
                 style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                 placeholder="Full name"
                 placeholderTextColor={colors.mutedForeground}
                 value={name}
                 onChangeText={setName}
               />
               <TextInput
                 style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                 placeholder="Phone (optional)"
                 placeholderTextColor={colors.mutedForeground}
                 value={phone}
                 onChangeText={setPhone}
                 keyboardType="phone-pad"
               />
               <View style={styles.modalActions}>
                 <Pressable onPress={() => setEditingProfile(false)} style={[styles.modalBtn, { backgroundColor: colors.muted }]}>
                   <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
                 </Pressable>
                 <Pressable onPress={handleSaveProfile} disabled={saving || !name.trim()} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                   <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>{saving ? 'Saving...' : 'Save'}</Text>
                 </Pressable>
               </View>
             </View>
           </View>
         )}

         {/* Security */}
         <View style={styles.section}>
           <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Security</Text>
           <View style={[{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }, styles.securityCard]}>
             <View style={styles.securitySection}>
               <Text style={[styles.securityTitle, { color: colors.foreground }]}>Change Password</Text>
               <TextInput
                 style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                 placeholder="Current password"
                 placeholderTextColor={colors.mutedForeground}
                 value={currentPassword}
                 onChangeText={setCurrentPassword}
                 secureTextEntry
               />
               <TextInput
                 style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                 placeholder="New password"
                 placeholderTextColor={colors.mutedForeground}
                 value={newPassword}
                 onChangeText={setNewPassword}
                 secureTextEntry
               />
               <TextInput
                 style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                 placeholder="Confirm new password"
                 placeholderTextColor={colors.mutedForeground}
                 value={confirmPassword}
                 onChangeText={setConfirmPassword}
                 secureTextEntry
               />
               <Pressable onPress={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} style={[styles.changePasswordBtn, { backgroundColor: colors.primary }]}>
                 <Text style={[styles.changePasswordBtnText, { color: '#FFFFFF' }]}>{changingPassword ? 'Updating...' : 'Update Password'}</Text>
               </Pressable>
             </View>
           </View>
         </View>

         {/* Preferences */}
         <View style={styles.section}>
           <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
           <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
             <SettingItem
               icon="moon"
               label="Dark Mode"
               value={darkMode === 'light' ? 'Light' : darkMode === 'dark' ? 'Dark' : 'System'}
               onPress={() => {
                 Alert.alert(
                   'Dark Mode',
                   'Choose theme preference',
                   [
                     { text: 'Light', onPress: () => handleDarkModeChange('light') },
                     { text: 'Dark', onPress: () => handleDarkModeChange('dark') },
                     { text: 'System', onPress: () => handleDarkModeChange('system') },
                     { text: 'Cancel', style: 'cancel' },
                   ]
                 );
               }}
             />
             <SettingItem
               icon="globe"
               label="Language"
               value={language === 'en' ? 'English' : language}
               onPress={() => {
                 Alert.alert(
                   'Language',
                   'Choose your preferred language',
                   [
                     { text: 'English', onPress: () => handleLanguageChange('en') },
                     { text: 'Swahili', onPress: () => handleLanguageChange('sw') },
                     { text: 'Cancel', style: 'cancel' },
                   ]
                 );
               }}
             />
             <SettingItem icon="dollar-sign" label="Default Currency" value={currentOrg.currency} onPress={() => Alert.alert('Info', 'Currency is set at the organization level. Contact your organization admin to change it.')} />
           </View>
         </View>

         {/* Support */}
         <View style={styles.section}>
           <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Support</Text>
           <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
             <SettingItem icon="help-circle" label="Help Center" onPress={handleHelpCenter} />
             <SettingItem icon="message-circle" label="Contact Support" onPress={handleContactSupport} />
             <SettingItem icon="file-text" label="Privacy Policy" onPress={handlePrivacyPolicy} />
             <SettingItem icon="check-circle" label="Terms of Service" onPress={handleTermsOfService} />
             <SettingItem icon="info" label="About ChamaYetu" value="v1.0.0" onPress={() => Alert.alert('ChamaYetu', 'Version 1.0.0\nEmpowering African savings groups with modern financial management.\n\n© 2024 ChamaYetu. All rights reserved.')} />
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
  orgCard: { marginBottom: 0, borderWidth: 1, overflow: 'hidden' },
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  editProfileCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  securityCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  securitySection: {
    padding: 16,
    gap: 12,
  },
  securityTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  changePasswordBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  changePasswordBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});