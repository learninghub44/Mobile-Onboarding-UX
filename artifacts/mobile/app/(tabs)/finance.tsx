import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { TransactionItem } from '@/components/TransactionItem';
import { MiniChart } from '@/components/MiniChart';
import {
  TRANSACTIONS,
  LOANS,
  MONTHLY_CONTRIBUTIONS,
  Transaction,
  Loan,
  formatCurrency,
} from '@/data/mockData';

type TabKey = 'all' | 'contributions' | 'loans' | 'expenses';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'contributions', label: 'Contributions' },
  { key: 'loans', label: 'Loans' },
  { key: 'expenses', label: 'Expenses' },
];

function LoanCard({ loan }: { loan: Loan }) {
  const colors = useColors();
  const statusColor = loan.status === 'overdue' ? colors.destructive : loan.status === 'settled' ? colors.success : colors.accent;

  return (
    <View style={[styles.loanCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.loanHeader}>
        <View>
          <Text style={[styles.loanMember, { color: colors.foreground }]}>{loan.memberName}</Text>
          <Text style={[styles.loanMeta, { color: colors.mutedForeground }]}>
            {loan.interestRate}% interest · Due {loan.dueDate}
          </Text>
        </View>
        <View>
          <Text style={[styles.loanAmount, { color: colors.foreground }]}>
            {formatCurrency(loan.amount, loan.currencySymbol, loan.currency)}
          </Text>
          <Text style={[styles.loanBalance, { color: statusColor }]}>
            {formatCurrency(loan.balance, loan.currencySymbol, loan.currency)} remaining
          </Text>
        </View>
      </View>
      <View style={[styles.loanTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.loanProgress, { width: `${loan.progress * 100}%`, backgroundColor: statusColor }]} />
      </View>
      <Text style={[styles.loanPercent, { color: colors.mutedForeground }]}>
        {Math.round(loan.progress * 100)}% repaid
      </Text>
    </View>
  );
}

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentOrg } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  if (!currentOrg) return null;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filteredTransactions = TRANSACTIONS.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'contributions') return t.type === 'contribution' || t.type === 'repayment';
    if (activeTab === 'loans') return t.type === 'loan';
    if (activeTab === 'expenses') return t.type === 'expense';
    return true;
  });

  const showLoanCards = activeTab === 'loans';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={showLoanCards ? LOANS : filteredTransactions}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <LinearGradient
              colors={[colors.gradientCard, colors.gradientCardEnd]}
              style={[styles.hero, { paddingTop: topPad + 20 }]}
            >
              <Text style={styles.heroLabel}>Total Balance</Text>
              <Text style={styles.heroBalance}>
                {formatCurrency(currentOrg.balance, currentOrg.currencySymbol, currentOrg.currency)}
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Feather name="arrow-up" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.heroStatLabel}>Contributions</Text>
                  <Text style={styles.heroStatValue}>
                    {formatCurrency(currentOrg.totalContributions, currentOrg.currencySymbol, currentOrg.currency)}
                  </Text>
                </View>
                <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                <View style={styles.heroStat}>
                  <Feather name="arrow-down" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.heroStatLabel}>Outstanding Loans</Text>
                  <Text style={styles.heroStatValue}>
                    {formatCurrency(currentOrg.totalLoans, currentOrg.currencySymbol, currentOrg.currency)}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Chart */}
            <View style={[styles.chartSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Monthly Contributions</Text>
              <MiniChart data={MONTHLY_CONTRIBUTIONS} highlightColor={colors.accent} />
            </View>

            {/* Tabs */}
            <View style={[styles.tabsBar, { backgroundColor: colors.background }]}>
              {TABS.map(tab => (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabBtn,
                    activeTab === tab.key && {
                      backgroundColor: colors.primary,
                      borderRadius: 100,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: activeTab === tab.key ? '#FFFFFF' : colors.mutedForeground,
                        fontFamily: activeTab === tab.key ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        renderItem={({ item }: ListRenderItemInfo<Transaction | Loan>) => {
          if (showLoanCards) {
            return (
              <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                <LoanCard loan={item as Loan} />
              </View>
            );
          }
          return (
            <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TransactionItem transaction={item as Transaction} />
            </View>
          );
        }}
        ItemSeparatorComponent={() =>
          showLoanCards ? null : (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 6,
  },
  heroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroBalance: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 0,
  },
  heroStat: { flex: 1, gap: 4 },
  heroStatLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  heroStatValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  heroStatDivider: { width: 1, height: 36, marginHorizontal: 14 },
  chartSection: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
  },
  chartTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
    marginBottom: 8,
  },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  tabLabel: { fontSize: 13 },
  txCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  loanCard: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 2,
  },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loanMember: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  loanMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  loanAmount: { fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'right' },
  loanBalance: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'right', marginTop: 2 },
  loanTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  loanProgress: { height: '100%', borderRadius: 3 },
  loanPercent: { fontFamily: 'Inter_400Regular', fontSize: 11 },
});
