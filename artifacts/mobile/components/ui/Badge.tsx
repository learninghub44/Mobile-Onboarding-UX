import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  dot?: boolean;
}

export function Badge({ label, variant = 'default', style, dot = false }: BadgeProps) {
  const colors = useColors();

  const config: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: colors.primaryLight, text: colors.primary },
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    danger: { bg: colors.destructiveLight, text: colors.destructive },
    info: { bg: colors.infoLight, text: colors.info },
    muted: { bg: colors.muted, text: colors.mutedForeground },
  };

  const { bg, text } = config[variant] ?? config.default;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: 100 }, style]}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: text }]} />
      )}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
