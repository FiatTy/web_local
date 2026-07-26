import { API_BASE, apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, RefreshResponse, RegisterRequest } from '@/types/user';

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ResetTokenValidation {
  status: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/user/login', payload);
  return response.data;
}

export async function register(payload: RegisterRequest): Promise<void> {
  await apiClient.post('/user/register', payload);
}

export async function refresh(): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>('/user/refresh', {});
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/user/logout', {}, { responseType: 'text' });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/user/forgot-password', { email });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post('/user/reset-password', payload);
}

export function emailVerificationConfirmUrl(token: string): string {
  return `${API_BASE}/api/email-verification/confirm?token=${encodeURIComponent(token)}`;
}

export async function validateResetToken(token: string): Promise<ResetTokenValidation> {
  const response = await apiClient.get<ResetTokenValidation>('/user/reset-password/validate', {
    params: { token },
  });
  return response.data;
}
