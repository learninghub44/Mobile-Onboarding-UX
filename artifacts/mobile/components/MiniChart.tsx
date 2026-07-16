import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface BarData {
  month: string;
  amount: number;
}

interface MiniChartProps {
  data: BarData[];
  height?: number;
  highlightColor?: string;
}

export function MiniChart({ data, height = 100, highlightColor }: MiniChartProps) {
  const colors = useColors();
  const barColor = highlightColor ?? colors.accent;
  const maxVal = Math.max(...data.map(d => d.amount), 1);
  const svgWidth = 280;
  const chartHeight = height - 24; // leave room for labels
  const barW = Math.floor((svgWidth - (data.length - 1) * 6) / data.length);
  const lastIdx = data.length - 1;

  return (
    <View>
      <Svg width={svgWidth} height={height} viewBox={`0 0 ${svgWidth} ${height}`}>
        <G>
          {data.map((d, i) => {
            const barH = Math.max(4, (d.amount / maxVal) * chartHeight);
            const x = i * (barW + 6);
            const y = chartHeight - barH;
            const isLast = i === lastIdx;
            return (
              <Rect
                key={d.month}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill={isLast ? barColor : barColor + '55'}
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text
            key={d.month}
            style={[
              styles.label,
              {
                color: i === lastIdx ? colors.foreground : colors.mutedForeground,
                fontFamily: i === lastIdx ? 'Inter_600SemiBold' : 'Inter_400Regular',
              },
            ]}
          >
            {d.month}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: { fontSize: 11 },
});
