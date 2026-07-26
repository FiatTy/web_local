import { createContext, useContext } from 'react';
import type { LoginRequest, LoginUser } from '@/types/user';

export interface AuthContextValue {
  user: LoginUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginRequest) => Promise<LoginUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  applyUser: (user: LoginUser) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
