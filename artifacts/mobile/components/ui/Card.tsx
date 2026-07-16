import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  elevated?: boolean;
}

export function Card({ children, style, onPress, padding = 16, elevated = false }: CardProps) {
  const colors = useColors();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderColor: colors.border,
      padding,
      shadowColor: elevated ? '#000' : 'transparent',
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.95 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
