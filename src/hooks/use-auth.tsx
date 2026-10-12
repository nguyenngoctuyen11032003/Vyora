"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDataSource } from "@/src/hooks/use-data-source";
import type { AuthUser, RecoveryParams, Result } from "@/src/types/gym";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export interface AuthApi {
  /** 'loading' while the persisted session is restored (show a skeleton, not the form). */
  status: AuthStatus;
  user: AuthUser | null;
  signIn(email: string, password: string): Promise<Result<AuthUser>>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<Result>;
  /** Verifies the email link. On success the user is NOT signed in yet: call updatePassword next. */
  verifyRecoveryLink(params: RecoveryParams): Promise<Result<AuthUser>>;
  /** Saves the new password; on success the user is signed in. */
  updatePassword(password: string): Promise<Result>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const data = useDataSource();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const recoveryUser = useRef<AuthUser | null>(null);

  useEffect(() => {
    let alive = true;
    data.auth.getUser().then((u) => {
      if (!alive) return;
      setUser(u);
      setStatus(u ? "signedIn" : "signedOut");
    });
    return () => {
      alive = false;
    };
  }, [data]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await data.auth.signIn(email, password);
      if (res.ok) {
        setUser(res.data);
        setStatus("signedIn");
      }
      return res;
    },
    [data],
  );

  const signOut = useCallback(async () => {
    await data.auth.signOut();
    setUser(null);
    setStatus("signedOut");
  }, [data]);

  const requestPasswordReset = useCallback((email: string) => data.auth.requestPasswordReset(email), [data]);

  const verifyRecoveryLink = useCallback(
    async (params: RecoveryParams) => {
      const res = await data.auth.verifyRecoveryLink(params);
      if (res.ok) recoveryUser.current = res.data;
      return res;
    },
    [data],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      const res = await data.auth.updatePassword(password);
      if (res.ok) {
        const u = recoveryUser.current ?? (await data.auth.getUser());
        recoveryUser.current = null;
        if (u) {
          setUser(u);
          setStatus("signedIn");
        }
      }
      return res;
    },
    [data],
  );

  const value = useMemo<AuthApi>(
    () => ({ status, user, signIn, signOut, requestPasswordReset, verifyRecoveryLink, updatePassword }),
    [status, user, signIn, signOut, requestPasswordReset, verifyRecoveryLink, updatePassword],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AppProviders>");
  return ctx;
}
