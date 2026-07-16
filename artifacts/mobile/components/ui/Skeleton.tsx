import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius, style }: SkeletonProps) {
  const colors = useColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.muted, colors.border],
    ),
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: width as number,
          height,
          borderRadius: borderRadius ?? 6,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={skeletonStyles.textBlock}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} />
        </View>
      </View>
      <Skeleton height={12} />
      <Skeleton width="70%" height={12} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textBlock: { flex: 1, gap: 6 },
});
