import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  subtitle?: string;
}

export function SectionHeader({ title, onViewAll, subtitle }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        )}
      </View>
      {onViewAll && (
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={[styles.viewAll, { color: colors.accent }]}>View all</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  left: { gap: 1 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  viewAll: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});
