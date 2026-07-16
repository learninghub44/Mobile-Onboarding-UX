import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Member } from '@/lib/queries';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

interface MemberCardProps {
  member: Member;
  onPress?: () => void;
  compact?: boolean;
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

export function MemberCard({ member, onPress, compact = false }: MemberCardProps) {
  const colors = useColors();
  const cs = CONTRIB_CONFIG[member.contribution_status] ?? CONTRIB_CONFIG.up_to_date;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.muted : 'transparent',
          borderBottomColor: colors.border,
          paddingHorizontal: compact ? 16 : 20,
        },
      ]}
    >
      <Avatar initials={member.initials} color={member.avatar_color} size="md" />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {member.name}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.role, { color: colors.mutedForeground }]}>
            {ROLE_LABELS[member.role]}
          </Text>
          {!compact && (
            <Text style={[styles.dot, { color: colors.mutedForeground }]}> · </Text>
          )}
          {!compact && (
            <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
              {member.email}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Badge
          label={cs.label}
          variant={cs.variant}
          dot
        />
        {member.status !== 'active' && (
          <Badge
            label={member.status === 'inactive' ? 'Inactive' : 'Pending'}
            variant={member.status === 'inactive' ? 'muted' : 'warning'}
          />
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
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
  role: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
  },
  email: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    flex: 1,
  },
  right: { alignItems: 'flex-end', gap: 4 },
});
