import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { formatCurrency } from '@/data/mockData';

interface FinancialCardProps {
  orgName: string;
  orgType: string;
  balance: number;
  currencySymbol: string;
  currency: string;
  contributionProgress: number; // 0-1
  contributionTarget: number;
  contributionCurrent: number;
  membersCount: number;
}

export function FinancialCard({
  orgName,
  orgType,
  balance,
  currencySymbol,
  currency,
  contributionProgress,
  contributionTarget,
  contributionCurrent,
  membersCount,
}: FinancialCardProps) {
  const colors = useColors();
  const progressPct = Math.min(contributionProgress, 1);

  return (
    <LinearGradient
      colors={[colors.gradientCard, colors.gradientCardEnd, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: colors.radius + 4 }]}
    >
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
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balance} numberOfLines={1}>
          {formatCurrency(balance, currencySymbol, currency)}
        </Text>
      </View>

      {/* Contribution progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>July Contributions</Text>
          <Text style={styles.progressValue}>
            {Math.round(progressPct * 100)}%
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct * 100}%` },
            ]}
          />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressSub}>
            {formatCurrency(contributionCurrent, currencySymbol, currency)} collected
          </Text>
          <Text style={styles.progressSub}>
            Target: {formatCurrency(contributionTarget, currencySymbol, currency)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    marginHorizontal: 20,
    gap: 20,
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
});
