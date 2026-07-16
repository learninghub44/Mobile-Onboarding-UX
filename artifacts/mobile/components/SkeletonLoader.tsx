import React from 'react';
import { View, StyleSheet, type DimensionValue } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function SkeletonCard() {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.muted, borderColor: colors.border }]} />;
}

export function SkeletonText({ width = '100%', height = 14 }: { width?: DimensionValue; height?: number }) {
  const colors = useColors();
  return <View style={[styles.text, { width, height, backgroundColor: colors.muted }]} />;
}

export function SkeletonCircle({ size = 48 }: { size?: number }) {
  const colors = useColors();
  return <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.muted }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  text: {
    borderRadius: 4,
    marginBottom: 8,
  },
  circle: {
    marginRight: 12,
  },
});