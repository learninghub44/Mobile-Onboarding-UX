import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'treasurer' | 'secretary' | 'member';
  initials: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  currency: string;
  currencySymbol: string;
  balance: number;
  totalContributions: number;
  totalLoans: number;
  membersCount: number;
  color: string;
  monthlyTarget: number | null;
  monthContributions: number;
}

interface AppState {
  hasSeenOnboarding: boolean;
  isAuthenticated: boolean;
  user: User | null;
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
  orgsError: string | null;
  needsProfileSetup: boolean;
}

interface AppContextType extends AppState {
  completeOnboarding: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: (preferredOrgId?: string) => Promise<void>;
  clearOrgsError: () => void;
  hasOrganizations: () => boolean;
}

const ORG_COLORS = ['#1B3A6B', '#059669', '#6366F1', '#D97706', '#DC2626', '#0891B2'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAppUser(su: SupabaseUser): User {
  const name: string =
    (su.user_metadata?.name as string | undefined) ??
    su.email?.split('@')[0] ??
    'User';
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return { id: su.id, name, email: su.email ?? '', role: 'admin', initials };
}

async function fetchUserOrgs(userId: string): Promise<{ orgs: Organization[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, org:organizations(id, name, type, currency, currency_symbol, monthly_target)')
      .eq('user_id', userId);

    if (error) {
      return { orgs: [], error: error.message || 'Failed to fetch organizations' };
    }

    if (!data?.length) {
      return { orgs: [], error: null };
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const orgs: Organization[] = await Promise.all(
      (data as any[]).map(async (row, idx) => {
        const o = row.org as any;
        const [txRes, loanRes, memRes] = await Promise.all([
          supabase.from('transactions').select('amount, type, created_at').eq('org_id', o.id),
          supabase
            .from('loans')
            .select('balance')
            .eq('org_id', o.id)
            .in('status', ['active', 'overdue']),
          supabase
            .from('organization_members')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', o.id),
        ]);

        const txs = txRes.data ?? [];
        const incoming = txs
          .filter(t => ['contribution', 'income', 'repayment'].includes(t.type))
          .reduce((s, t) => s + (t.amount as number), 0);
        const outgoing = txs
          .filter(t => ['expense', 'loan'].includes(t.type))
          .reduce((s, t) => s + Math.abs(t.amount as number), 0);
        const totalLoans = (loanRes.data ?? []).reduce(
          (s, l) => s + (l.balance as number),
          0,
        );
        const monthContributions = txs
          .filter(t => t.type === 'contribution' && new Date(t.created_at as string) >= monthStart)
          .reduce((s, t) => s + (t.amount as number), 0);

        return {
          id: o.id as string,
          name: o.name as string,
          type: o.type as string,
          currency: o.currency as string,
          currencySymbol: o.currency_symbol as string,
          balance: incoming - outgoing,
          totalContributions: incoming,
          totalLoans,
          membersCount: memRes.count ?? 0,
          color: ORG_COLORS[idx % ORG_COLORS.length]!,
          monthlyTarget: o.monthly_target ?? null,
          monthContributions,
        };
      }),
    );

    return { orgs, error: null };
  } catch (err) {
    return { orgs: [], error: err instanceof Error ? err.message : 'Failed to fetch organizations' };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AppState>({
    hasSeenOnboarding: false,
    isAuthenticated: false,
    user: null,
    organizations: [],
    currentOrg: null,
    isLoading: true,
    orgsError: null,
    needsProfileSetup: false,
  });

  // Prevent double-update from onAuthStateChange firing during init
  const initialized = useRef(false);

  useEffect(() => {
    async function init() {
      try {
        const [onboardingStr, { data: sessionData }] = await Promise.all([
          AsyncStorage.getItem('hasSeenOnboarding'),
          supabase.auth.getSession(),
        ]);

        const hasSeenOnboarding = onboardingStr === 'true';
        const session = sessionData.session;

        if (session?.user) {
          const user = buildAppUser(session.user);
          const { orgs, error } = await fetchUserOrgs(session.user.id);
          const savedOrgId = await AsyncStorage.getItem('currentOrgId');
          const currentOrg =
            (savedOrgId ? orgs.find((o: Organization) => o.id === savedOrgId) : null) ??
            orgs[0] ??
            null;

          let needsProfileSetup = false;
          if (orgs.length === 0) {
            const { data: profile } = await supabase.from('profiles').select('phone').eq('id', session.user.id).single();
            needsProfileSetup = !profile?.phone;
          }

          setState({
            hasSeenOnboarding,
            isAuthenticated: true,
            user,
            organizations: orgs,
            currentOrg,
            isLoading: false,
            orgsError: error,
            needsProfileSetup,
          });
        } else {
          setState({
            hasSeenOnboarding,
            isAuthenticated: false,
            user: null,
            organizations: [],
            currentOrg: null,
            isLoading: false,
            orgsError: null,
            needsProfileSetup: false,
          });
        }
      } catch {
        setState((prev: AppState) => ({ ...prev, isLoading: false }));
      } finally {
        initialized.current = true;
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!initialized.current) return; // handled by init()
      if (session?.user) {
        const user = buildAppUser(session.user);
        const { orgs, error } = await fetchUserOrgs(session.user.id);

        // Route based on org status
        let needsProfileSetup = false;
        if (orgs.length === 0) {
          // No organizations - check if profile has phone
          const { data: profile } = await supabase.from('profiles').select('phone').eq('id', session.user.id).single();
          needsProfileSetup = !profile?.phone;
        }

        setState((prev: AppState) => ({
          ...prev,
          isAuthenticated: true,
          user,
          organizations: orgs,
          currentOrg: orgs[0] ?? null,
          orgsError: error,
          needsProfileSetup,
        }));

        if (orgs.length === 0) {
          if (needsProfileSetup) {
            router.replace('/(profile-setup)' as never);
          } else {
            router.replace('/(org-setup)/welcome' as never);
          }
        } else {
          router.replace('/(tabs)' as never);
        }
      } else {
        setState((prev: AppState) => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          organizations: [],
          currentOrg: null,
          needsProfileSetup: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setState((prev: AppState) => ({ ...prev, hasSeenOnboarding: true }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange updates state once initialized
  }, []);

  const hasOrganizations = useCallback(() => {
    return state.organizations.length > 0;
  }, [state.organizations]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.user) {
      throw new Error('Registration failed. Please try again.');
    }
    // Profile creation is required — do not swallow failures
    const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user.id, name });
    if (profileError) {
      // If profile creation fails, sign out the user to avoid orphaned auth accounts
      await supabase.auth.signOut();
      throw new Error('Failed to create profile. Please try again.');
    }

    // Auto-join any organizations that invited this email address before
    // they signed up. Best-effort: an invite lookup failure shouldn't
    // block registration, since the user can still be invited/join later.
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: invites } = await supabase
        .from('organization_invites')
        .select('id, org_id, role')
        .eq('email', normalizedEmail)
        .eq('status', 'pending');

      for (const invite of invites ?? []) {
        const { error: joinError } = await supabase.from('organization_members').insert({
          org_id: invite.org_id,
          user_id: data.user.id,
          role: invite.role,
          status: 'active',
        });
        if (!joinError) {
          await supabase
            .from('organization_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id);
        }
      }
    } catch (err) {
      console.error('Failed to process pending invites at registration:', err);
    }
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([supabase.auth.signOut(), AsyncStorage.removeItem('currentOrgId')]);
  }, []);

  const refreshOrganizations = useCallback(async (preferredOrgId?: string) => {
    if (!state.user?.id) return;

    const { orgs, error } = await fetchUserOrgs(state.user.id);
    const savedOrgId = await AsyncStorage.getItem('currentOrgId');
    const currentOrg =
      (preferredOrgId ? orgs.find((o: Organization) => o.id === preferredOrgId) : null) ??
      (savedOrgId ? orgs.find((o: Organization) => o.id === savedOrgId) : null) ??
      orgs[0] ??
      null;

    if (currentOrg) {
      await AsyncStorage.setItem('currentOrgId', currentOrg.id);
    }

    setState((prev: AppState) => ({
      ...prev,
      organizations: orgs,
      currentOrg,
      orgsError: error,
    }));
  }, [state.user?.id]);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const org = state.organizations.find((o: Organization) => o.id === orgId);
      if (org) {
        AsyncStorage.setItem('currentOrgId', orgId).catch(() => {});
        setState((prev: AppState) => ({ ...prev, currentOrg: org }));
      }
    },
    [state.organizations],
  );

  const clearOrgsError = useCallback(() => {
    setState((prev: AppState) => ({ ...prev, orgsError: null }));
  }, []);

  return (
    <AppContext.Provider
      value={{ ...state, completeOnboarding, login, register, logout, switchOrganization, refreshOrganizations, clearOrgsError, hasOrganizations }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
