import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
}

interface AppState {
  hasSeenOnboarding: boolean;
  isAuthenticated: boolean;
  user: User | null;
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  completeOnboarding: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
}

// ─── Demo fallback data ───────────────────────────────────────────────────────

const DEMO_USER: User = {
  id: 'demo',
  name: 'Sarah Wanjiku',
  email: 'sarah@chamahub.app',
  phone: '+254 712 345 678',
  role: 'admin',
  initials: 'SW',
};

export const DEMO_ORGS: Organization[] = [
  {
    id: '1',
    name: 'Umoja Investment Group',
    type: 'Investment Group',
    currency: 'KES',
    currencySymbol: 'KSh',
    balance: 1_245_000,
    totalContributions: 960_000,
    totalLoans: 380_000,
    membersCount: 24,
    color: '#1B3A6B',
  },
  {
    id: '2',
    name: 'Amani SACCO',
    type: 'SACCO',
    currency: 'KES',
    currencySymbol: 'KSh',
    balance: 3_890_000,
    totalContributions: 2_400_000,
    totalLoans: 820_000,
    membersCount: 56,
    color: '#059669',
  },
  {
    id: '3',
    name: 'Diaspora Wealth Fund',
    type: 'Chama',
    currency: 'USD',
    currencySymbol: 'US$',
    balance: 48_250,
    totalContributions: 36_000,
    totalLoans: 12_000,
    membersCount: 12,
    color: '#6366F1',
  },
];

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

async function fetchUserOrgs(userId: string): Promise<Organization[]> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, org:organizations(id, name, type, currency, currency_symbol)')
      .eq('user_id', userId);

    if (error || !data?.length) return DEMO_ORGS;

    const orgs: Organization[] = await Promise.all(
      (data as any[]).map(async (row, idx) => {
        const o = row.org as any;
        const [txRes, loanRes, memRes] = await Promise.all([
          supabase.from('transactions').select('amount, type').eq('org_id', o.id),
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
        };
      }),
    );

    return orgs;
  } catch {
    return DEMO_ORGS;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    hasSeenOnboarding: false,
    isAuthenticated: false,
    user: null,
    organizations: [],
    currentOrg: null,
    isLoading: true,
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
          const orgs = await fetchUserOrgs(session.user.id);
          const savedOrgId = await AsyncStorage.getItem('currentOrgId');
          const currentOrg =
            (savedOrgId ? orgs.find(o => o.id === savedOrgId) : null) ??
            orgs[0] ??
            null;
          setState({
            hasSeenOnboarding,
            isAuthenticated: true,
            user,
            organizations: orgs,
            currentOrg,
            isLoading: false,
          });
        } else {
          setState({
            hasSeenOnboarding,
            isAuthenticated: false,
            user: null,
            organizations: [],
            currentOrg: null,
            isLoading: false,
          });
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
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
        const orgs = await fetchUserOrgs(session.user.id);
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          organizations: orgs,
          currentOrg: orgs[0] ?? null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          organizations: [],
          currentOrg: null,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setState(prev => ({ ...prev, hasSeenOnboarding: true }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange updates state once initialized
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    // Attempt to upsert profile — fails gracefully if table not yet created
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({ id: data.user.id, name });
      } catch {
        // Table may not exist yet; auth still succeeds
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([supabase.auth.signOut(), AsyncStorage.removeItem('currentOrgId')]);
  }, []);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const org = state.organizations.find(o => o.id === orgId);
      if (org) {
        AsyncStorage.setItem('currentOrgId', orgId).catch(() => {});
        setState(prev => ({ ...prev, currentOrg: org }));
      }
    },
    [state.organizations],
  );

  return (
    <AppContext.Provider
      value={{ ...state, completeOnboarding, login, register, logout, switchOrganization }}
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
