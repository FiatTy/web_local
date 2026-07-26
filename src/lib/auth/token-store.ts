import type { LoginUser } from '@/types/user';

export const LOGIN_USER_KEY = 'login_user';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function hasAccessToken(): boolean {
  return accessToken !== null;
}

export function getLoginUser(): LoginUser | null {
  const raw = localStorage.getItem(LOGIN_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LoginUser;
  } catch {
    return null;
  }
}

export function setLoginUser(user: LoginUser): void {
  localStorage.setItem(LOGIN_USER_KEY, JSON.stringify(user));
}

export function clearLoginUser(): void {
  localStorage.removeItem(LOGIN_USER_KEY);
}

export function clearSession(): void {
  clearAccessToken();
  clearLoginUser();
}
