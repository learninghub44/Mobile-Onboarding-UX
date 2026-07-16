import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import {
  TRANSACTIONS,
  MEETINGS,
  MEMBERS,
  formatCurrency,
  getGreeting,
} from '@/data/mockData';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, currentOrg } = useApp();

  if (!currentOrg || !user) return null;

  const greeting = getGreeting();
  const recentTransactions = TRANSACTIONS.slice(0, 4);
  const upcomingMeeting = MEETINGS[0];
  const recentMembers = MEMBERS.slice(0, 6);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
          <QuickAction icon="plus-circle" label="Contribute" onPress={() => {}} color={colors.success} />
          <QuickAction icon="credit-card" label="Loan" onPress={() => {}} color={colors.info} />
          <QuickAction icon="minus-circle" label="Expense" onPress={() => {}} color={colors.warning} />
          <QuickAction icon="user-plus" label="Invite" onPress={() => {}} color={colors.accent} />
        </View>

        {/* Recent Activity */}
        <SectionHeader
          title="Recent Activity"
          onViewAll={() => router.push('/(tabs)/finance' as never)}
          subtitle="Latest transactions"
        />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {recentTransactions.map(t => (
            <TransactionItem key={t.id} transaction={t} />
          ))}
        </View>

        {/* Upcoming Meeting */}
        <SectionHeader title="Upcoming Meeting" />
        <Card style={styles.meetingCard}>
          <View style={styles.meetingHeader}>
            <View style={[styles.meetingIcon, { backgroundColor: colors.infoLight }]}>
              <Feather name="calendar" size={18} color={colors.info} />
            </View>
            <View style={styles.meetingInfo}>
              <Text style={[styles.meetingTitle, { color: colors.foreground }]}>
                {upcomingMeeting.title}
              </Text>
              <Text style={[styles.meetingDate, { color: colors.mutedForeground }]}>
                {upcomingMeeting.date} · {upcomingMeeting.time}
              </Text>
            </View>
          </View>
          <View style={[styles.meetingLocation, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.meetingLocationText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {upcomingMeeting.location}
            </Text>
          </View>
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
          {recentMembers.map(m => (
            <View key={m.id} style={styles.memberAvatarItem}>
              <Avatar initials={m.initials} color={m.avatarColor} size="md" />
              <Text
                style={[styles.memberAvatarName, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {m.name.split(' ')[0]}
              </Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
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
});
