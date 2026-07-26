import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import * as authApi from '@/features/auth/api/auth.api';
import { setNavigateHandler } from '@/lib/api-client';
import {
  clearSession,
  getLoginUser,
  hasAccessToken,
  LOGIN_USER_KEY,
  setAccessToken,
  setLoginUser,
} from '@/lib/auth/token-store';
import { AuthContext, type AuthContextValue } from '@/lib/auth/auth-context';
import type { LoginRequest, LoginUser } from '@/types/user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<LoginUser | null>(() => getLoginUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasAccessToken());
  const [isInitializing, setIsInitializing] = useState<boolean>(
    () => Boolean(getLoginUser()) && !hasAccessToken(),
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authApi.refresh();
      setAccessToken(response.accessToken);
      setUser(getLoginUser());
      setIsAuthenticated(true);
      return true;
    } catch {
      clearSession();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const login = useCallback(async (payload: LoginRequest): Promise<LoginUser> => {
    const response = await authApi.login(payload);
    setAccessToken(response.accessToken);
    const loginUser: LoginUser = {
      id: response.id,
      username: response.username,
      email: response.email,
      phone: response.phone,
      role: response.role,
      status: response.status,
    };
    setLoginUser(loginUser);
    setUser(loginUser);
    setIsAuthenticated(true);
    return loginUser;
  }, []);

  const applyUser = useCallback((next: LoginUser): void => {
    setLoginUser(next);
    setUser(next);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authApi.logout().catch(() => undefined);
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    setNavigateHandler((path) => {
      navigate(path);
    });
    return () => setNavigateHandler(null);
  }, [navigate]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (getLoginUser() && !hasAccessToken()) {
        await refreshSession();
      }
      if (active) {
        setIsInitializing(false);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === LOGIN_USER_KEY) {
        setUser(getLoginUser());
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isInitializing,
      login,
      logout,
      refreshSession,
      applyUser,
    }),
    [user, isAuthenticated, isInitializing, login, logout, refreshSession, applyUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
