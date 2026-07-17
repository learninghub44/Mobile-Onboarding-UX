import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
      end={{ x: 1, y: 1.1 }}
      style={[styles.card, { borderRadius: colors.radius + 8 }]}
    >
      {/* Bank-card watermark */}
      <MaterialCommunityIcons
        name="bank"
        size={160}
        color="rgba(255,255,255,0.08)"
        style={styles.watermark}
      />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orgType}>{orgType}</Text>
          <Text style={styles.orgName} numberOfLines={1}>{orgName}</Text>
        </View>
        <View style={styles.membersBadge}>
          <Feather name="users" size={13} color="rgba(255,255,255,0.85)" />
          <Text style={styles.membersText}>{membersCount} Members</Text>
        </View>
      </View>

      {/* Balance */}
      <View style={styles.balanceBlock}>
        <View style={styles.balanceLabelRow}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={12} style={styles.eyeBtn}>
            <Feather name={hidden ? 'eye-off' : 'eye'} size={16} color="rgba(255,255,255,0.65)" />
          </Pressable>
        </View>
        <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {hidden ? '••••••••' : formatCurrency(balance, currencySymbol, currency)}
        </Text>
      </View>

      {/* Contribution progress — only shown once the org has a real goal set */}
      {monthlyTarget ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{MONTH_NAME} Contributions</Text>
            <Text style={styles.progressValue}>{Math.round(progressPct * 100)}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
            <View style={[styles.progressFill, { width: `${Math.max(progressPct * 100, progressPct > 0 ? 4 : 0)}%` }]} />
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
          <View style={styles.setGoalIconWrap}>
            <Feather name="target" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.setGoalText}>Set a monthly contribution goal</Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
        </Pressable>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 26,
    paddingTop: 24,
    marginHorizontal: 20,
    gap: 26,
    overflow: 'hidden',
    minHeight: 240,
    ...Platform.select({
      ios: {
        shadowColor: '#122B57',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
      },
      android: { elevation: 14 },
    }),
  },
  watermark: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    transform: [{ rotate: '-8deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  orgType: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  orgName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  membersText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  balanceBlock: { gap: 6 },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
  },
  eyeBtn: { padding: 2 },
  balance: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  progressSection: { gap: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  progressValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  setGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
  },
  setGoalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setGoalText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});
