import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface QuickActionProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickAction({ icon, label, onPress, color }: QuickActionProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const ic = color ?? colors.accent;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      style={[animatedStyle, styles.container]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: ic + '18',
            borderRadius: colors.radius,
            borderColor: ic + '30',
          },
        ]}
      >
        <Feather name={icon} size={22} color={ic} />
      </View>
      <Text
        style={[styles.label, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, flex: 1 },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    textAlign: 'center',
  },
});
