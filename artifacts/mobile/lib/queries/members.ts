import { supabase } from '@/lib/supabase';

async function getAuthorizedUserForOrg(orgId: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication required.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error('You do not have access to this organization.');
  }

  return user;
}

export interface Member {
  id: string;
  user_id: string;
  org_id: string;
  role: 'admin' | 'treasurer' | 'secretary' | 'member';
  name: string;
  email: string;
  phone: string;
  initials: string;
  status: 'active' | 'inactive' | 'pending';
  contribution_status: 'up_to_date' | 'behind' | 'ahead';
  total_contributions: number;
  joined_date: string;
  avatar_color: string;
}

export interface MemberInsert {
  user_id: string;
  org_id: string;
  role?: 'admin' | 'treasurer' | 'secretary' | 'member';
  name: string;
  email: string;
  phone: string;
  initials: string;
  status?: 'active' | 'inactive' | 'pending';
  contribution_status?: 'up_to_date' | 'behind' | 'ahead';
  total_contributions?: number;
  joined_date?: string;
  avatar_color?: string;
}

export async function getOrgMembers(orgId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, profiles:profiles(name, email, phone)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    org_id: row.org_id,
    role: row.role,
    name: row.profiles?.name || 'Unknown',
    email: row.profiles?.email || '',
    phone: row.profiles?.phone || '',
    initials: row.profiles?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() || '??',
    status: row.status || 'active',
    contribution_status: row.contribution_status || 'up_to_date',
    total_contributions: row.total_contributions || 0,
    joined_date: row.created_at || new Date().toISOString(),
    avatar_color: row.avatar_color || '#6366F1',
  }));
}

export async function createMember(member: MemberInsert): Promise<Member | null> {
  const user = await getAuthorizedUserForOrg(member.org_id);

  if (member.user_id !== user.id) {
    throw new Error('You can only add members for your own user account.');
  }

  const { data, error } = await supabase
    .from('organization_members')
    .insert(member)
    .select()
    .single();

  if (error) {
    console.error('Error creating member:', error);
    return null;
  }

  return data;
}

export interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  role: 'admin' | 'treasurer' | 'secretary' | 'member';
  status: 'pending' | 'accepted' | 'cancelled';
  created_at: string;
}

export async function getPendingInvites(orgId: string): Promise<OrgInvite[]> {
  const { data, error } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invites:', error);
    return [];
  }
  return data || [];
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_invites')
    .update({ status: 'cancelled' })
    .eq('id', inviteId);
  if (error) throw error;
}

/**
 * Records a pending invitation for `email` to join `orgId`.
 *
 * IMPORTANT: this must never call supabase.auth.signUp() from the
 * client. Doing so replaces the *currently signed-in admin's* session
 * with a brand-new session for the invited email (that's how
 * supabase-js signUp works), which silently logs the admin out of
 * their own account mid-invite. Instead we just record intent here.
 * When someone registers with a matching email, AppContext.register()
 * checks organization_invites and auto-joins them to every org that
 * invited that email, then marks the invite 'accepted'.
 */
export async function inviteMember(orgId: string, email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Please enter an email address.');
  }

  await getAuthorizedUserForOrg(orgId);

  const { error } = await supabase
    .from('organization_invites')
    .upsert(
      {
        org_id: orgId,
        email: normalizedEmail,
        role: 'member',
        status: 'pending',
      },
      { onConflict: 'org_id,email' },
    );

  if (error) throw error;
}