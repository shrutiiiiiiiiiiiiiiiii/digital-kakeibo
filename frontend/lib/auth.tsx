"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

type User = {
  id: string;
  email: string;
  locale: "en" | "ja";
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  settings: {
    weeklyReminderDay: number;
    currency: string;
    baseCurrency?: string;
  };
  createdAt: string;
};

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  completeOnboarding: (payload: {
    locale: "en" | "ja";
    baseCurrency: string;
    weeklyReminderDay: number;
  }) => Promise<void>;
};

type AuthResponse = {
  user: User;
  accessToken: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (token: string) => {
    const data = await apiRequest<{ user: User }>("/auth/me", { token });
    setUser(data.user);
  }, []);

  const refreshSession = useCallback(async () => {
    const { accessToken: freshToken } = await apiRequest<{ accessToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        includeCredentials: true,
      }
    );
    setAccessToken(freshToken);
    await fetchMe(freshToken);
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        includeCredentials: true,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<AuthResponse>("/auth/signup", {
        method: "POST",
        body: { email, password },
        includeCredentials: true,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await apiRequest<{ ok: boolean }>("/auth/logout", {
      method: "POST",
      includeCredentials: true,
    }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(
    async (payload: { locale: "en" | "ja"; baseCurrency: string; weeklyReminderDay: number }) => {
      if (!accessToken) throw new Error("Not authenticated");
      const data = await apiRequest<{ user: User }>("/auth/onboarding", {
        method: "PATCH",
        token: accessToken,
        body: {
          currency: payload.baseCurrency,
          baseCurrency: payload.baseCurrency,
          ...payload,
          onboardingCompleted: true,
        },
      });
      setUser(data.user);
    },
    [accessToken]
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await refreshSession();
      } catch {
        if (mounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      signup,
      logout,
      refreshSession,
      completeOnboarding,
    }),
    [user, accessToken, isLoading, login, signup, logout, refreshSession, completeOnboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
