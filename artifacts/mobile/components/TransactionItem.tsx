import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Transaction, formatCurrency, formatDate } from '@/data/mockData';
import { Avatar } from './ui/Avatar';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

const TYPE_CONFIG = {
  contribution: { icon: 'arrow-down-circle' as const, label: 'Contribution', positive: true },
  repayment: { icon: 'refresh-cw' as const, label: 'Repayment', positive: true },
  income: { icon: 'trending-up' as const, label: 'Income', positive: true },
  loan: { icon: 'arrow-up-circle' as const, label: 'Loan', positive: false },
  expense: { icon: 'minus-circle' as const, label: 'Expense', positive: false },
};

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const colors = useColors();
  const config = TYPE_CONFIG[transaction.type];
  const isPositive = config.positive && transaction.amount > 0;
  const amountColor = isPositive ? colors.success : colors.destructive;
  const amountPrefix = transaction.amount > 0 && isPositive ? '+' : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.muted : 'transparent',
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Avatar
        initials={transaction.memberInitials}
        size="md"
        color={isPositive ? colors.success : colors.destructive}
      />
      <View style={styles.details}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(transaction.date)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(transaction.amount, transaction.currencySymbol, transaction.currency)}
        </Text>
        {transaction.status === 'pending' && (
          <View style={[styles.pendingDot, { backgroundColor: colors.warning }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  details: { flex: 1, gap: 2 },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
