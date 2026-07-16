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

export interface Transaction {
  id: string;
  type: 'contribution' | 'loan' | 'expense' | 'repayment' | 'income';
  title: string;
  description: string;
  amount: number;
  currency: string;
  currency_symbol: string;
  created_at: string;
  org_id: string;
  member_id: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface TransactionInsert {
  type: 'contribution' | 'loan' | 'expense' | 'repayment' | 'income';
  title: string;
  description: string;
  amount: number;
  org_id: string;
  member_id: string;
  status?: 'completed' | 'pending' | 'failed';
}

export async function getTransactions(orgId: string, options?: { type?: string; limit?: number }): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

export async function createTransaction(transaction: TransactionInsert): Promise<Transaction | null> {
  const user = await getAuthorizedUserForOrg(transaction.org_id);

  if (transaction.member_id !== user.id) {
    throw new Error('You can only create records for your own user account.');
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }

  return data;
}