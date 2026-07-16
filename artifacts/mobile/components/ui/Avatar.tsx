import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  initials: string;
  color?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  ring?: boolean;
}

const SIZES: Record<AvatarSize, { container: number; font: number }> = {
  xs: { container: 28, font: 10 },
  sm: { container: 36, font: 13 },
  md: { container: 44, font: 16 },
  lg: { container: 56, font: 20 },
  xl: { container: 72, font: 26 },
};

export function Avatar({ initials, color, size = 'md', style, ring = false }: AvatarProps) {
  const colors = useColors();
  const { container, font } = SIZES[size];
  const bgColor = color ?? colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius: container / 2,
          backgroundColor: bgColor,
          borderWidth: ring ? 2.5 : 0,
          borderColor: colors.background,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: font, color: '#FFFFFF' }]}>
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});
