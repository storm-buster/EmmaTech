import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
} from './authClient';
import type { AccountResponse } from './authClient';

interface AuthContextValue {
  account: AccountResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setAccount(await fetchMe());
    } catch {
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await fetchMe();
        if (active) setAccount(me);
      } catch {
        if (active) setAccount(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAccount(await apiLogin({ email, password }));
  }, []);

  const signup = useCallback(
    async (input: { name: string; email: string; password: string; organizationName: string }) => {
      setAccount(await apiSignup(input));
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setAccount(null);
  }, []);

  const value = useMemo(
    () => ({ account, loading, refresh, login, signup, logout }),
    [account, loading, refresh, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
