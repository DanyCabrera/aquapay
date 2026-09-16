"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";
import type { UsuarioSistema } from "./types";

const TOKEN_KEY = "aquapay_token";
const USER_KEY = "aquapay_user";
const REMEMBER_KEY = "aquapay_remember";

function readStore(remember: boolean) {
  return remember ? localStorage : sessionStorage;
}

interface AuthState {
  user: UsuarioSistema | null;
  token: string | null;
  loading: boolean;
  setSession: (
    token: string,
    user: UsuarioSistema,
    options?: { remember?: boolean },
  ) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsuarioSistema | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const remember = localStorage.getItem(REMEMBER_KEY) !== "0";
    const store = readStore(remember);
    const t = store.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
    const u = store.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    sessionStorage.removeItem("aquapay_mfa_ok");
    setLoading(false);
  }, []);

  const setSession = useCallback(
    (t: string, u: UsuarioSistema, options?: { remember?: boolean }) => {
      const remember = options?.remember ?? true;
      localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem("aquapay_mfa_ok");

      const store = readStore(remember);
      store.setItem(TOKEN_KEY, t);
      store.setItem(USER_KEY, JSON.stringify(u));

      setToken(t);
      setUser(u);
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    const data = await api<UsuarioSistema>("/api/auth/me");
    const remember = localStorage.getItem(REMEMBER_KEY) !== "0";
    readStore(remember).setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("aquapay_mfa_ok");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      setSession,
      refreshUser,
      logout,
    }),
    [user, token, loading, setSession, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
