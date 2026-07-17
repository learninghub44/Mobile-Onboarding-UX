import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ListRenderItemInfo,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { MemberCard } from '@/components/MemberCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard, SkeletonCircle, SkeletonText } from '@/components/SkeletonLoader';
import { useOrgQuery } from '@/lib/useOrgQuery';
import { getOrgMembers } from '@/lib/queries';
import type { Member } from '@/lib/queries';

type Filter = 'all' | 'active' | 'pending' | 'admin';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'admin', label: 'Admin' },
];

export default function MembersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentOrg } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: members = [], isLoading: membersLoading, isError: membersError } = useOrgQuery(
    ['members'],
    (orgId) => getOrgMembers(orgId)
  );

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const inactive = total - active;
    const participation = total > 0 ? Math.round((active / total) * 100) : 0;
    return { total, active, inactive, participation };
  }, [members]);

  const filtered = useMemo(() => {
    let list = members;
    if (filter === 'active') list = list.filter(m => m.status === 'active');
    else if (filter === 'pending') list = list.filter(m => m.status === 'pending');
    else if (filter === 'admin') list = list.filter(m => m.role === 'admin' || m.role === 'treasurer' || m.role === 'secretary');
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        m => m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s),
      );
    }
    return list;
  }, [members, search, filter]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList<Member>
        data={filtered}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.foreground }]}>Members</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.countText, { color: colors.primary }]}>
                    {members.length}
                  </Text>
                </View>
              </View>

              {/* Overview stat card */}
              {!membersLoading && !membersError && members.length > 0 && (
                <LinearGradient
                  colors={[colors.gradientCard, colors.gradientCardEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.overviewCard, { borderRadius: colors.radius + 2 }]}
                >
                  <Text style={styles.overviewTitle}>Member Overview</Text>
                  <View style={styles.overviewRow}>
                    <View style={styles.overviewStat}>
                      <Text style={styles.overviewValue}>{stats.total}</Text>
                      <Text style={styles.overviewLabel}>Total</Text>
                    </View>
                    <View style={styles.overviewStat}>
                      <Text style={styles.overviewValue}>{stats.active}</Text>
                      <Text style={styles.overviewLabel}>Active</Text>
                    </View>
                    <View style={styles.overviewStat}>
                      <Text style={styles.overviewValue}>{stats.inactive}</Text>
                      <Text style={styles.overviewLabel}>Inactive</Text>
                    </View>
                    <View style={styles.overviewStat}>
                      <Text style={styles.overviewValue}>{stats.participation}%</Text>
                      <Text style={styles.overviewLabel}>Active Rate</Text>
                    </View>
                  </View>
                </LinearGradient>
              )}

              {/* Search */}
              <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Feather name="search" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search members..."
                  placeholderTextColor={colors.mutedForeground}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>

              {/* Filter chips */}
              <View style={styles.filters}>
                {FILTERS.map(f => (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[
                      styles.chip,
                      filter === f.key
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: filter === f.key ? '#FFFFFF' : colors.mutedForeground,
                          fontFamily: filter === f.key ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        }
        renderItem={({ item }: ListRenderItemInfo<Member>) => (
          <View style={styles.itemWrapper}>
            <MemberCard member={item} />
          </View>
        )}
        ListEmptyComponent={
          membersLoading ? (
            <View style={styles.skeletonWrapper}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={[styles.skeletonItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.skeletonMemberRow}>
                    <SkeletonCircle size={42} />
                    <View style={styles.skeletonMemberInfo}>
                      <SkeletonText width="55%" height={14} />
                      <SkeletonText width="40%" height={11} />
                    </View>
                  </View>
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ) : membersError ? (
            <View style={[styles.emptyWrapper, { backgroundColor: colors.card }]}>
              <ErrorState
                title="Members could not be loaded"
                description="Your organization member list is temporarily unavailable. Please retry."
                actionLabel="Retry"
                onAction={() => router.replace('/(tabs)/members' as never)} 
              />
            </View>
          ) : (
            <View style={[styles.emptyWrapper, { backgroundColor: colors.card }]}>
              <EmptyState
                icon="users"
                title="No members found"
                description={search ? `No members match "${search}"` : 'No members in this category yet.'}
                actionLabel={search ? 'Clear Search' : undefined}
                onAction={search ? () => setSearch('') : undefined}
              />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  countText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    paddingVertical: 0,
  },
  filters: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  chipText: { fontSize: 13 },
  overviewCard: {
    padding: 18,
    gap: 14,
  },
  overviewTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewStat: { alignItems: 'flex-start', gap: 2 },
  overviewValue: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#FFFFFF' },
  overviewLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  itemWrapper: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  emptyWrapper: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
  },
  skeletonWrapper: {
    marginHorizontal: 20,
    gap: 12,
  },
  skeletonItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  skeletonMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonMemberInfo: {
    flex: 1,
    gap: 6,
  },
});