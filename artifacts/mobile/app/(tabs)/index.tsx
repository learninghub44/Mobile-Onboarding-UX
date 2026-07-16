import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { FinancialCard } from '@/components/FinancialCard';
import { StatCard } from '@/components/StatCard';
import { TransactionItem } from '@/components/TransactionItem';
import { QuickAction } from '@/components/QuickAction';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard, SkeletonCircle, SkeletonText } from '@/components/SkeletonLoader';
import { useOrgQuery } from '@/lib/useOrgQuery';
import { useRequireOrg } from '@/hooks/useRequireOrg';
import { getTransactions, getUpcomingMeeting, getOrgMembers, createTransaction } from '@/lib/queries';
import { formatCurrency, getGreeting } from '@/lib/format';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, currentOrg, orgsError, clearOrgsError } = useApp();
  const canRenderOrg = useRequireOrg();
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: recentTransactions = [], isLoading: txLoading, isError: txError } = useOrgQuery(
    ['recentTransactions'],
    (orgId) => getTransactions(orgId, { limit: 4 })
  );
  const { data: upcomingMeeting, isError: meetingError } = useOrgQuery(
    ['upcomingMeeting'],
    (orgId) => getUpcomingMeeting(orgId)
  );
  const { data: recentMembers = [], isLoading: membersLoading, isError: membersError } = useOrgQuery(
    ['recentMembers'],
    (orgId) => getOrgMembers(orgId)
  );

  const greeting = getGreeting();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (!canRenderOrg || !currentOrg || !user) return null;

  if (orgsError) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}> 
        <View style={styles.errorStateWrap}>
          <ErrorState
            title="Couldn’t load your organizations"
            description={orgsError}
            actionLabel="Retry"
            onAction={clearOrgsError}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting},</Text>
            <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
              {user.name.split(' ')[0]}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              hitSlop={8}
            >
              <Feather name="bell" size={20} color={colors.foreground} />
              <View style={[styles.notifDot, { backgroundColor: colors.destructive }]} />
            </Pressable>
            <Avatar initials={user.initials} color={currentOrg.color} size="sm" />
          </View>
        </View>

        {/* Financial Card */}
        <FinancialCard
          orgName={currentOrg.name}
          orgType={currentOrg.type}
          balance={currentOrg.balance}
          currencySymbol={currentOrg.currencySymbol}
          currency={currentOrg.currency}
          contributionProgress={0.63}
          contributionTarget={140000}
          contributionCurrent={88000}
          membersCount={currentOrg.membersCount}
        />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Members"
            value={String(currentOrg.membersCount)}
            icon="users"
            trend={8}
            iconColor={colors.info}
          />
          <StatCard
            label="Active Loans"
            value={formatCurrency(currentOrg.totalLoans, currentOrg.currencySymbol, currentOrg.currency)}
            icon="credit-card"
            iconColor={colors.warning}
          />
          <StatCard
            label="Total Saved"
            value={formatCurrency(currentOrg.totalContributions, currentOrg.currencySymbol, currentOrg.currency)}
            icon="trending-up"
            trend={12}
            iconColor={colors.success}
          />
        </View>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          <QuickAction icon="plus-circle" label="Contribute" onPress={() => setShowContributeModal(true)} color={colors.success} />
          <QuickAction icon="credit-card" label="Loan" onPress={() => setShowLoanModal(true)} color={colors.info} />
          <QuickAction icon="minus-circle" label="Expense" onPress={() => setShowExpenseModal(true)} color={colors.warning} />
          <QuickAction icon="user-plus" label="Invite" onPress={() => router.push('/(tabs)/invite' as never)} color={colors.accent} />
        </View>

        {/* Recent Activity */}
        <SectionHeader
          title="Recent Activity"
          onViewAll={() => router.push('/(tabs)/finance' as never)}
          subtitle="Latest transactions"
        />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {txLoading ? (
            <View style={styles.skeletonList}>
              <View style={styles.skeletonRow}>
                <SkeletonCircle size={40} />
                <View style={styles.skeletonColumn}>
                  <SkeletonText width="60%" height={14} />
                  <SkeletonText width="40%" height={12} />
                </View>
              </View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : txError ? (
            <ErrorState
              title="Transactions failed to load"
              description="We couldn’t fetch the recent activity for this organization. Try again in a moment."
              actionLabel="Retry"
              onAction={() => router.replace('/(tabs)' as never)}
            />
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              icon="activity"
              title="No transactions yet"
              description="Your recent contributions and expenses will appear here once activity starts flowing."
            />
          ) : (
            recentTransactions.map(t => (
              <TransactionItem key={t.id} transaction={t} />
            ))
          )}
        </View>

        {/* Upcoming Meeting */}
        <SectionHeader title="Upcoming Meeting" />
        <Card style={styles.meetingCard}>
          {meetingError ? (
            <ErrorState
              title="Meeting data unavailable"
              description="We couldn’t load this organization’s upcoming meeting right now. Please retry in a moment."
              actionLabel="Retry"
              onAction={() => router.replace('/(tabs)' as never)}
            />
          ) : upcomingMeeting ? (
            <>
              <View style={styles.meetingHeader}>
                <View style={[styles.meetingIcon, { backgroundColor: colors.infoLight }]}>
                  <Feather name="calendar" size={18} color={colors.info} />
                </View>
                <View style={styles.meetingInfo}>
                  <Text style={[styles.meetingTitle, { color: colors.foreground }]}>
                    {upcomingMeeting.title}
                  </Text>
                  <Text style={[styles.meetingDate, { color: colors.mutedForeground }]}>
                    {new Date(upcomingMeeting.scheduled_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} · {new Date(upcomingMeeting.scheduled_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <View style={[styles.meetingLocation, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={[styles.meetingLocationText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {upcomingMeeting.location}
                </Text>
              </View>
            </>
          ) : (
            <EmptyState
              icon="calendar"
              title="No upcoming meetings"
              description="Schedule a meeting to keep your organization aligned and accountable."
            />
          )}
        </Card>

        {/* Recent Members */}
        <SectionHeader
          title="Team Members"
          onViewAll={() => router.push('/(tabs)/members' as never)}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersScroll}
        >
          {membersLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.memberAvatarItem}>
                  <SkeletonCircle size={48} />
                  <SkeletonText width={56} height={10} />
                </View>
              ))}
            </>
          ) : membersError ? (
            <View style={styles.membersErrorWrap}>
              <ErrorState
                title="Members could not be loaded"
                description="This organization’s member roster is temporarily unavailable. Please retry."
                actionLabel="Retry"
                onAction={() => router.replace('/(tabs)' as never)}
              />
            </View>
          ) : recentMembers.length === 0 ? (
            <EmptyState
              icon="users"
              title="No members yet"
              description="Invite your first team member to start building your organization roster."
            />
          ) : (
            recentMembers.slice(0, 6).map(m => (
              <View key={m.id} style={styles.memberAvatarItem}>
                <Avatar initials={m.initials} color={m.avatar_color} size="md" />
                <Text
                  style={[styles.memberAvatarName, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {m.name.split(' ')[0]}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </ScrollView>

      {/* Contribute Modal */}
      {showContributeModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Make Contribution</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Amount"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Note (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowContributeModal(false);
                  setAmount('');
                  setNote('');
                }}
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!amount || isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    await createTransaction({
                      type: 'contribution',
                      title: note || 'Monthly Contribution',
                      description: note || 'Monthly contribution',
                      amount: parseFloat(amount),
                      org_id: currentOrg.id,
                      member_id: user.id,
                      status: 'completed',
                    });
                    setShowContributeModal(false);
                    setAmount('');
                    setNote('');
                    Alert.alert('Success', 'Contribution recorded successfully');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to record contribution');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                style={[styles.modalBtn, { backgroundColor: colors.success }]}
                disabled={isSubmitting || !amount}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Record Expense</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Amount"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Description"
              placeholderTextColor={colors.mutedForeground}
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowExpenseModal(false);
                  setAmount('');
                  setNote('');
                }}
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!amount || isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    await createTransaction({
                      type: 'expense',
                      title: note || 'Expense',
                      description: note || 'Expense',
                      amount: -Math.abs(parseFloat(amount)),
                      org_id: currentOrg.id,
                      member_id: user.id,
                      status: 'completed',
                    });
                    setShowExpenseModal(false);
                    setAmount('');
                    setNote('');
                    Alert.alert('Success', 'Expense recorded successfully');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to record expense');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                style={[styles.modalBtn, { backgroundColor: colors.warning }]}
                disabled={isSubmitting || !amount}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Loan Modal */}
      {showLoanModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Request Loan</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Loan Amount"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Purpose (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowLoanModal(false);
                  setAmount('');
                  setNote('');
                }}
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!amount || isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    await createTransaction({
                      type: 'loan',
                      title: note || 'Loan Request',
                      description: note || 'Loan request',
                      amount: parseFloat(amount),
                      org_id: currentOrg.id,
                      member_id: user.id,
                      status: 'pending',
                    });
                    setShowLoanModal(false);
                    setAmount('');
                    setNote('');
                    Alert.alert('Success', 'Loan request submitted for approval');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to submit loan request');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                style={[styles.modalBtn, { backgroundColor: colors.info }]}
                disabled={isSubmitting || !amount}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: { gap: 1 },
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  userName: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 20,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 8,
  },
  skeletonList: {
    gap: 12,
    padding: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonColumn: {
    flex: 1,
    gap: 6,
  },
  card: { borderWidth: 1, marginHorizontal: 20, overflow: 'hidden', marginBottom: 24 },
  meetingCard: { marginHorizontal: 20, marginBottom: 24, gap: 12 },
  meetingHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  meetingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingInfo: { flex: 1, gap: 3 },
  meetingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  meetingDate: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  meetingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  meetingLocationText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },
  membersScroll: { paddingHorizontal: 20, gap: 16, paddingBottom: 8 },
  memberAvatarItem: { alignItems: 'center', gap: 6, width: 52 },
  memberAvatarName: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 12 },
  membersErrorWrap: {
    width: 280,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  errorStateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
