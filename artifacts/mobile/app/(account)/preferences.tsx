import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { SupportPageLayout } from '@/components/SupportPageLayout';

const THEMES = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

const LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'sw', label: 'Swahili' },
];

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionRow,
        { backgroundColor: colors.card, borderColor: selected ? colors.accent : colors.border, borderRadius: colors.radius },
      ]}
    >
      <Text style={[styles.optionLabel, { color: colors.foreground }]}>{label}</Text>
      {selected ? <Feather name="check" size={18} color={colors.accent} /> : null}
    </Pressable>
  );
}

export default function PreferencesScreen() {
  const colors = useColors();
  const { currentOrg } = useApp();
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    (async () => {
      const [dark, lang] = await Promise.all([
        AsyncStorage.getItem('dark_mode'),
        AsyncStorage.getItem('language'),
      ]);
      if (dark) setTheme(dark);
      if (lang) setLanguage(lang);
    })();
  }, []);

  async function selectTheme(key: string) {
    setTheme(key);
    await AsyncStorage.setItem('dark_mode', key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  async function selectLanguage(key: string) {
    setLanguage(key);
    await AsyncStorage.setItem('language', key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  return (
    <SupportPageLayout title="Preferences">
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>THEME</Text>
        <View style={styles.optionList}>
          {THEMES.map(t => (
            <OptionRow key={t.key} label={t.label} selected={theme === t.key} onPress={() => selectTheme(t.key)} />
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>Restart the app for theme changes to fully apply.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LANGUAGE</Text>
        <View style={styles.optionList}>
          {LANGUAGES.map(l => (
            <OptionRow key={l.key} label={l.label} selected={language === l.key} onPress={() => selectLanguage(l.key)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CURRENCY</Text>
        <View style={[styles.optionRow, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.optionLabel, { color: colors.foreground }]}>{currentOrg?.currency ?? 'KES'}</Text>
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Currency is set per organization. Ask your organization's admin to change it.
        </Text>
      </View>
    </SupportPageLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 },
  optionList: { gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  optionLabel: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});
