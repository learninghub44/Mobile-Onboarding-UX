import { supabase } from '@/lib/supabase';

/**
 * Sets (or clears, with `null`) an organization's monthly contribution
 * goal. Only the org's creator can currently update it — see the
 * "Creator can update organization" RLS policy in supabase/schema.sql.
 */
export async function setMonthlyTarget(orgId: string, target: number | null): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ monthly_target: target })
    .eq('id', orgId);

  if (error) throw error;
}
