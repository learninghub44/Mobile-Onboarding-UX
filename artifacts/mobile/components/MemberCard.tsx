import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import type { Member } from '@/lib/queries';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

interface MemberCardProps {
  member: Member;
  onPress?: () => void;
}

const ROLE_LABELS: Record<Member['role'], string> = {
  admin: 'Admin',
  treasurer: 'Treasurer',
  secretary: 'Secretary',
  member: 'Member',
};

const CONTRIB_CONFIG: Record<string, { variant: 'success' | 'danger' | 'info'; label: string }> = {
  up_to_date: { variant: 'success', label: 'Up to date' },
  behind: { variant: 'danger', label: 'Behind' },
  ahead: { variant: 'info', label: 'Ahead' },
};

const ELEVATED_ROLES: Member['role'][] = ['admin', 'treasurer', 'secretary'];

export function MemberCard({ member, onPress }: MemberCardProps) {
  const colors = useColors();
  const { currentOrg } = useApp();
  const cs = CONTRIB_CONFIG[member.contribution_status] ?? CONTRIB_CONFIG.up_to_date;
  const isElevated = ELEVATED_ROLES.includes(member.role);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isElevated ? colors.accent + '40' : colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.avatarWrap}>
        <Avatar initials={member.initials} color={member.avatar_color} size="md" />
        {member.status === 'active' && (
          <View style={[styles.presenceDot, { backgroundColor: colors.success, borderColor: colors.card }]} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {member.name}
          </Text>
          {isElevated && (
            <View style={[styles.rolePill, { backgroundColor: colors.accent + '18' }]}>
              <Text style={[styles.rolePillText, { color: colors.accent }]}>{ROLE_LABELS[member.role]}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.contribution, { color: colors.mutedForeground }]} numberOfLines={1}>
          Contribution: {formatCurrency(member.total_contributions, currentOrg?.currencySymbol ?? 'KSh', currentOrg?.currency ?? 'KES')}
        </Text>
      </View>

      <View style={styles.right}>
        <Badge label={cs.label} variant={cs.variant} dot />
        {member.status !== 'active' && (
          <Badge label={member.status === 'inactive' ? 'Inactive' : 'Pending'} variant={member.status === 'inactive' ? 'muted' : 'warning'} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  avatarWrap: { position: 'relative' },
  presenceDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flexShrink: 1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  rolePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  contribution: { fontFamily: 'Inter_400Regular', fontSize: 12.5 },
  right: { alignItems: 'flex-end', gap: 4 },
});
