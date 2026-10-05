"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { User } from "@/interface/types";
import { api, setUnauthorizedHandler, tokenStore } from "@/services/api";

interface AuthState {
  /** null = browsing without an account (the dashboard works either way) */
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api.me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const token = await api.login(username, password);
    tokenStore.set(token.access_token);
    setUser(await api.me());
  }, []);

  const register = useCallback(async (username: string, password: string, fullName?: string) => {
    const token = await api.register(username, password, fullName);
    tokenStore.set(token.access_token);
    setUser(await api.me());
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
