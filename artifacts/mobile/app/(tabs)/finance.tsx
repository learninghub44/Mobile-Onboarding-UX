import React, { useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { TransactionItem } from '@/components/TransactionItem';
import { MiniChart } from '@/components/MiniChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard, SkeletonCircle, SkeletonText } from '@/components/SkeletonLoader';
import { useOrgQuery } from '@/lib/useOrgQuery';
import { useRequireOrg } from '@/hooks/useRequireOrg';
import { getTransactions, getLoans, getOrgMembers } from '@/lib/queries';
import { formatCurrency } from '@/lib/format';
import type { Transaction, Loan } from '@/lib/queries';

type TabKey = 'all' | 'contributions' | 'loans' | 'expenses';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Overview' },
  { key: 'contributions', label: 'Contributions' },
  { key: 'loans', label: 'Loans' },
  { key: 'expenses', label: 'Expenses' },
];

function LoanCard({ loan, memberName }: { loan: Loan; memberName: string }) {
  const colors = useColors();
  const statusColor = loan.status === 'overdue' ? colors.destructive : loan.status === 'settled' ? colors.success : colors.accent;
  const repaidAmount = Math.max(loan.amount - loan.balance, 0);
  const repaidPct = loan.amount > 0 ? Math.min(Math.round((repaidAmount / loan.amount) * 100), 100) : 0;

  return (
    <View style={[styles.loanCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.loanHeader}>
        <View>
          <Text style={[styles.loanMember, { color: colors.foreground }]}>{memberName}</Text>
          <Text style={[styles.loanMeta, { color: colors.mutedForeground }]}>
            {loan.interest_rate}% interest · Due {loan.due_date}
          </Text>
        </View>
        <View>
          <Text style={[styles.loanAmount, { color: colors.foreground }]}>
            {formatCurrency(loan.amount, 'KES', 'KES')}
          </Text>
          <Text style={[styles.loanBalance, { color: statusColor }]}>
            {formatCurrency(loan.balance, 'KES', 'KES')} remaining
          </Text>
        </View>
      </View>
      <View style={[styles.loanTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.loanProgress, { width: `${repaidPct}%`, backgroundColor: statusColor }]} />
      </View>
      <Text style={[styles.loanPercent, { color: colors.mutedForeground }]}>
        {repaidPct}% repaid
      </Text>
    </View>
  );
}

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentOrg } = useApp();
  const canRenderOrg = useRequireOrg();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: transactions = [], isLoading: txLoading, isError: txError } = useOrgQuery(
    ['transactions'],
    (orgId) => getTransactions(orgId)
  );
  const { data: loans = [], isLoading: loansLoading, isError: loansError } = useOrgQuery(
    ['loans'],
    (orgId) => getLoans(orgId)
  );
  const { data: members = [] } = useOrgQuery(
    ['members'],
    (orgId) => getOrgMembers(orgId)
  );
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.user_id, m.name);
    return map;
  }, [members]);

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'contributions') return t.type === 'contribution' || t.type === 'repayment';
    if (activeTab === 'loans') return t.type === 'loan';
    if (activeTab === 'expenses') return t.type === 'expense';
    return true;
  });

  const showLoanCards = activeTab === 'loans';

  // Compute monthly contributions from last 6 months of transactions
  const monthlyContributions = useMemo(() => {
    const now = new Date();
    const months: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-KE', { month: 'short' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const amount = transactions
        .filter(t => {
          const created = new Date(t.created_at);
          return t.type === 'contribution' && created >= new Date(monthStart) && created <= new Date(monthEnd);
        })
        .reduce((sum, t) => sum + t.amount, 0);
      months.push({ label, amount });
    }
    return months;
  }, [transactions]);

  // Real category breakdown — no fabricated figures. Percentages are of
  // total transaction volume (in + out) so the bars are comparable.
  const categoryBreakdown = useMemo(() => {
    const sums: Record<string, number> = {
      contribution: 0,
      repayment: 0,
      expense: 0,
      loan: 0,
      income: 0,
    };
    for (const t of transactions) {
      sums[t.type] = (sums[t.type] ?? 0) + Math.abs(t.amount);
    }
    const total = Object.values(sums).reduce((a, b) => a + b, 0);
    const rows = [
      { key: 'contribution', label: 'Contributions', color: colors.success, amount: sums.contribution },
      { key: 'repayment', label: 'Loan Repayments', color: colors.info, amount: sums.repayment },
      { key: 'expense', label: 'Expenses', color: colors.warning, amount: sums.expense },
      { key: 'loan', label: 'Loans Disbursed', color: colors.destructive, amount: sums.loan },
      { key: 'income', label: 'Other Income', color: colors.accent, amount: sums.income },
    ].filter(r => r.amount > 0);
    return rows.map(r => ({ ...r, pct: total > 0 ? r.amount / total : 0 }));
  }, [transactions, colors]);

  if (!canRenderOrg || !currentOrg) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={showLoanCards ? loans : filteredTransactions}
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
              <MiniChart data={monthlyContributions.map(m => ({ month: m.label, amount: m.amount }))} highlightColor={colors.accent} />
            </View>

            {/* Category breakdown — real transaction totals, not fabricated percentages */}
            {activeTab === 'all' && categoryBreakdown.length > 0 && (
              <View style={[styles.breakdownSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chartTitle, { color: colors.foreground }]}>Category Breakdown</Text>
                <View style={styles.breakdownList}>
                  {categoryBreakdown.map(row => (
                    <View key={row.key} style={styles.breakdownRow}>
                      <View style={styles.breakdownLabelRow}>
                        <View style={[styles.breakdownDot, { backgroundColor: row.color }]} />
                        <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{row.label}</Text>
                        <Text style={[styles.breakdownPct, { color: colors.mutedForeground }]}>
                          {Math.round(row.pct * 100)}%
                        </Text>
                      </View>
                      <View style={[styles.breakdownTrack, { backgroundColor: colors.muted }]}>
                        <View style={[styles.breakdownFill, { width: `${row.pct * 100}%`, backgroundColor: row.color }]} />
                      </View>
                      <Text style={[styles.breakdownAmount, { color: colors.mutedForeground }]}>
                        {formatCurrency(row.amount, currentOrg.currencySymbol, currentOrg.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

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
            const loan = item as Loan;
            return (
              <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                <LoanCard loan={loan} memberName={memberNameById.get(loan.member_id) || 'Unknown member'} />
              </View>
            );
          }
          return (
            <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TransactionItem transaction={item as Transaction} />
            </View>
          );
        }}
        ListEmptyComponent={
          txLoading || loansLoading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                  <View style={styles.skeletonHeader}>
                    <SkeletonCircle size={40} />
                    <View style={styles.skeletonContent}>
                      <SkeletonText width="55%" height={14} />
                      <SkeletonText width="40%" height={11} />
                    </View>
                  </View>
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ) : txError || loansError ? (
            <View style={styles.errorWrap}>
              <ErrorState
                title="Finance data is unavailable"
                description="We couldn’t load your organization’s transactions or loans. Please retry to refresh the activity feed."
                actionLabel="Retry"
                onAction={() => router.replace('/(tabs)' as never)}
              />
            </View>
          ) : (
            <EmptyState
              icon="activity"
              title="No transactions yet"
              description="Once you add a contribution or expense, it will appear here instantly."
            />
          )
        }
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
  breakdownSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  breakdownList: { gap: 14 },
  breakdownRow: { gap: 6 },
  breakdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13 },
  breakdownPct: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  breakdownTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 3 },
  breakdownAmount: { fontFamily: 'Inter_400Regular', fontSize: 11 },
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
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 12, textAlign: 'center' },
  errorWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  skeletonList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  skeletonCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonContent: {
    flex: 1,
    gap: 6,
  },
});
