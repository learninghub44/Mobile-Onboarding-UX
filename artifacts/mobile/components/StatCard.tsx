import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  trend?: number; // percent change, positive = up
  iconColor?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, trend, iconColor, style }: StatCardProps) {
  const colors = useColors();
  const ic = iconColor ?? colors.accent;
  const isUp = trend !== undefined && trend >= 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: ic + '18' }]}>
        <Feather name={icon} size={18} color={ic} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {trend !== undefined && (
        <View style={styles.trend}>
          <Feather
            name={isUp ? 'trending-up' : 'trending-down'}
            size={12}
            color={isUp ? colors.success : colors.destructive}
          />
          <Text
            style={[
              styles.trendText,
              { color: isUp ? colors.success : colors.destructive },
            ]}
          >
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trendText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
