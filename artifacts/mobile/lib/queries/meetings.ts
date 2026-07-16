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

export interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  org_id: string;
  created_at: string;
}

export interface MeetingInsert {
  title: string;
  description: string;
  scheduled_at: string;
  location: string;
  org_id: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
}

export async function getMeetings(orgId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('org_id', orgId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }

  return data || [];
}

export async function getUpcomingMeeting(orgId: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'upcoming')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching upcoming meeting:', error);
    return null;
  }

  return data;
}

export async function createMeeting(meeting: MeetingInsert): Promise<Meeting | null> {
  await getAuthorizedUserForOrg(meeting.org_id);

  const { data, error } = await supabase
    .from('meetings')
    .insert(meeting)
    .select()
    .single();

  if (error) {
    console.error('Error creating meeting:', error);
    return null;
  }

  return data;
}