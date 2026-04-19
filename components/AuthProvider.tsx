"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, tokenStore } from "@/lib/api";
import type { Profile, Role } from "@/lib/types";

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  role: Role | null;
  profile: Profile | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<Role>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    status: "loading",
    role: null,
    profile: null,
  });

  const loadMe = useCallback(async () => {
    const token = tokenStore.getAccess();
    if (!token) {
      setState({ status: "unauthenticated", role: null, profile: null });
      return;
    }
    try {
      const me = await authApi.me();
      setState({
        status: "authenticated",
        role: me.role,
        profile: me.profile,
      });
    } catch {
      tokenStore.clear();
      setState({ status: "unauthenticated", role: null, profile: null });
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.login(username, password);
      tokenStore.set(res.accessToken, res.refreshToken, res.role);
      setState({
        status: "authenticated",
        role: res.role,
        profile: res.profile,
      });
      return res.role;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    tokenStore.clear();
    setState({ status: "unauthenticated", role: null, profile: null });
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refetch: loadMe }),
    [state, login, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
