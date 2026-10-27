"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { api, ApiError } from "./api";
import type { UsuarioSistema } from "./types";

const TOKEN_KEY = "aquapay_token";
const USER_KEY = "aquapay_user";
const REMEMBER_KEY = "aquapay_remember";
const LAST_ACTIVITY_KEY = "aquapay_last_activity";
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click", "wheel"] as const;

function readStore(remember: boolean) {
  return remember ? localStorage : sessionStorage;
}

function readLastActivity() {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY) ?? sessionStorage.getItem(LAST_ACTIVITY_KEY);
  const last = raw ? Number(raw) : 0;
  return Number.isFinite(last) ? last : 0;
}

function stampActivity() {
  const now = String(Date.now());
  localStorage.setItem(LAST_ACTIVITY_KEY, now);
  sessionStorage.setItem(LAST_ACTIVITY_KEY, now);
}

function sessionExpiredByIdle() {
  const last = readLastActivity();
  return last > 0 && Date.now() - last >= IDLE_TIMEOUT_MS;
}

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  sessionStorage.removeItem("aquapay_mfa_ok");
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
    let cancelled = false;

    async function restore() {
      const remember = localStorage.getItem(REMEMBER_KEY) !== "0";
      const store = readStore(remember);
      const t = store.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
      if (!t) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (sessionExpiredByIdle()) {
        clearStoredSession();
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const data = await api<UsuarioSistema>("/api/auth/me");
        if (cancelled) return;
        setToken(t);
        setUser(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredSession();
          setToken(null);
          setUser(null);
        } else {
          const raw = store.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
          if (raw) {
            try {
              setToken(t);
              setUser(JSON.parse(raw) as UsuarioSistema);
            } catch {
              clearStoredSession();
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      setToken(null);
      setUser(null);
      setLoading(false);
    }
    window.addEventListener("aquapay:unauthorized", onUnauthorized);
    return () => window.removeEventListener("aquapay:unauthorized", onUnauthorized);
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
      stampActivity();

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
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user || !token) return;

    let timer = 0;
    let lastStamp = 0;
    let closing = false;

    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void expire();
      }, IDLE_TIMEOUT_MS);
    }

    async function expire() {
      if (closing) return;
      closing = true;
      toast.info("Sesión cerrada por inactividad.");
      await logout();
    }

    function onActivity() {
      const now = Date.now();
      if (now - lastStamp < 1000) return;
      lastStamp = now;
      stampActivity();
      schedule();
    }

    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (sessionExpiredByIdle()) {
        void expire();
        return;
      }
      schedule();
    }

    stampActivity();
    schedule();
    for (const event of IDLE_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timer);
      for (const event of IDLE_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, token, logout]);

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
