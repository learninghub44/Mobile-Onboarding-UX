import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const AppContext = createContext<AppContextType | null>(null);

const DEMO_USER: User = {
  id: '1',
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    hasSeenOnboarding: false,
    isAuthenticated: false,
    user: null,
    organizations: [],
    currentOrg: null,
    isLoading: true,
  });

  useEffect(() => {
    async function loadState() {
      try {
        const [onboardingDone, authData] = await Promise.all([
          AsyncStorage.getItem('hasSeenOnboarding'),
          AsyncStorage.getItem('authUser'),
        ]);

        const isAuth = authData !== null;
        setState({
          hasSeenOnboarding: onboardingDone === 'true',
          isAuthenticated: isAuth,
          user: isAuth ? DEMO_USER : null,
          organizations: isAuth ? DEMO_ORGS : [],
          currentOrg: isAuth ? DEMO_ORGS[0] : null,
          isLoading: false,
        });
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
    loadState();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setState(prev => ({ ...prev, hasSeenOnboarding: true }));
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    await AsyncStorage.setItem('authUser', JSON.stringify({ email }));
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user: { ...DEMO_USER, email },
      organizations: DEMO_ORGS,
      currentOrg: DEMO_ORGS[0],
    }));
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const user: User = { ...DEMO_USER, name, email, initials };
    await AsyncStorage.setItem('authUser', JSON.stringify({ email }));
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user,
      organizations: DEMO_ORGS,
      currentOrg: DEMO_ORGS[0],
    }));
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('authUser');
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      organizations: [],
      currentOrg: null,
    }));
  }, []);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const org = state.organizations.find(o => o.id === orgId);
      if (org) setState(prev => ({ ...prev, currentOrg: org }));
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
