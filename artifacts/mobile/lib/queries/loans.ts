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

export interface Loan {
  id: string;
  member_id: string;
  amount: number;
  balance: number;
  interest_rate: number;
  status: 'active' | 'overdue' | 'settled' | 'pending';
  org_id: string;
  created_at: string;
  disbursed_date: string;
  due_date: string;
}

export interface LoanInsert {
  member_id: string;
  amount: number;
  interest_rate: number;
  org_id: string;
  status?: 'active' | 'overdue' | 'settled' | 'pending';
  disbursed_date?: string;
  due_date?: string;
}

export async function getLoans(orgId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching loans:', error);
    return [];
  }

  return data || [];
}

export async function createLoan(loan: LoanInsert): Promise<Loan | null> {
  const user = await getAuthorizedUserForOrg(loan.org_id);

  if (loan.member_id !== user.id) {
    throw new Error('You can only create loans for your own user account.');
  }

  const { data, error } = await supabase
    .from('loans')
    .insert(loan)
    .select()
    .single();

  if (error) {
    console.error('Error creating loan:', error);
    return null;
  }

  return data;
}