import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export function SupportPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </View>
  );
}

export function SupportSection({ heading, children }: { heading?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      {heading ? <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{heading}</Text> : null}
      <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 20 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 34 },
  body: { gap: 20 },
  section: { gap: 8 },
  sectionHeading: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  paragraph: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
});
