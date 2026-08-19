import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  requestSignupOtp as apiRequestSignupOtp,
  selectInitialPlan as apiSelectInitialPlan,
  verifySignupOtp as apiVerifySignupOtp,
} from './authClient';
import type { AccountResponse } from './authClient';

interface AuthContextValue {
  account: AccountResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  /** Phase 1 email/password signup — request an OTP (creates nothing yet). */
  requestSignupOtp: (input: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    requestedPlan?: string;
  }) => Promise<void>;
  /** Phase 2 — verify the OTP; on success the session/account is established. */
  verifySignupOtp: (input: { email: string; code: string }) => Promise<void>;
  /** Apply the one-time initial plan selection (generic-path modal). */
  selectPlan: (plan: string) => Promise<void>;
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

  const requestSignupOtp = useCallback(
    async (input: { name: string; email: string; password: string; organizationName: string; requestedPlan?: string }) => {
      await apiRequestSignupOtp(input);
    },
    [],
  );

  const verifySignupOtp = useCallback(async (input: { email: string; code: string }) => {
    setAccount(await apiVerifySignupOtp(input));
  }, []);

  const selectPlan = useCallback(async (plan: string) => {
    await apiSelectInitialPlan(plan);
    // Re-fetch so account.organization.plan / plan_selected reflect the choice
    // (drives the modal's dismissal — it never re-appears once selected).
    setAccount(await fetchMe());
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAccount(null);
  }, []);

  const value = useMemo(
    () => ({ account, loading, refresh, login, requestSignupOtp, verifySignupOtp, selectPlan, logout }),
    [account, loading, refresh, login, requestSignupOtp, verifySignupOtp, selectPlan, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
