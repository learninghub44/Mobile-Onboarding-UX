import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { formatCurrency } from '@/lib/format';

interface FinancialCardProps {
  orgName: string;
  orgType: string;
  balance: number;
  currencySymbol: string;
  currency: string;
  membersCount: number;
  /** null when the org hasn't set a monthly contribution goal yet */
  monthlyTarget: number | null;
  /** real month-to-date contribution total, computed from transactions */
  monthContributions: number;
  onSetGoal: () => void;
}

const MONTH_NAME = new Date().toLocaleDateString('en-KE', { month: 'long' });

export function FinancialCard({
  orgName,
  orgType,
  balance,
  currencySymbol,
  currency,
  membersCount,
  monthlyTarget,
  monthContributions,
  onSetGoal,
}: FinancialCardProps) {
  const colors = useColors();
  const [hidden, setHidden] = useState(false);
  const progressPct = monthlyTarget ? Math.min(monthContributions / monthlyTarget, 1) : 0;

  return (
    <LinearGradient
      colors={[colors.gradientCard, colors.gradientCardEnd, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: colors.radius + 4 }]}
    >
      {/* Watermark bank icon for a card-like feel */}
      <Feather
        name="credit-card"
        size={90}
        color="rgba(255,255,255,0.06)"
        style={styles.watermark}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orgType}>{orgType}</Text>
          <Text style={styles.orgName} numberOfLines={1}>{orgName}</Text>
        </View>
        <View style={styles.membersBadge}>
          <Feather name="users" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.membersText}>{membersCount}</Text>
        </View>
      </View>

      {/* Balance */}
      <View style={styles.balanceBlock}>
        <View style={styles.balanceLabelRow}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={10}>
            <Feather name={hidden ? 'eye-off' : 'eye'} size={15} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>
        <Text style={styles.balance} numberOfLines={1}>
          {hidden ? '••••••' : formatCurrency(balance, currencySymbol, currency)}
        </Text>
      </View>

      {/* Contribution progress — only shown once the org has a real goal set */}
      {monthlyTarget ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{MONTH_NAME} Contributions</Text>
            <Text style={styles.progressValue}>{Math.round(progressPct * 100)}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressSub}>
              {formatCurrency(monthContributions, currencySymbol, currency)} collected
            </Text>
            <Text style={styles.progressSub}>
              Target: {formatCurrency(monthlyTarget, currencySymbol, currency)}
            </Text>
          </View>
        </View>
      ) : (
        <Pressable onPress={onSetGoal} style={styles.setGoalRow}>
          <Feather name="target" size={14} color="rgba(255,255,255,0.75)" />
          <Text style={styles.setGoalText}>Set a monthly contribution goal</Text>
          <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.5)" />
        </Pressable>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    marginHorizontal: 20,
    gap: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1B3A6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  watermark: {
    position: 'absolute',
    right: -10,
    bottom: -18,
    transform: [{ rotate: '-12deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orgType: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  orgName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    maxWidth: 220,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    gap: 5,
  },
  membersText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  balanceBlock: { gap: 4 },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  balance: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  progressValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 3,
  },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  setGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
  },
  setGoalText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
});
