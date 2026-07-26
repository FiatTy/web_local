import { apiClient } from '@/lib/api-client';
import type { UserInfo } from '@/types/user';

export async function getAllUsers(): Promise<UserInfo[]> {
  const { data } = await apiClient.get<UserInfo[]>('/user/all-user');
  return Array.isArray(data) ? data : [];
}

export async function getUserById(userId: string): Promise<UserInfo> {
  const { data } = await apiClient.get<UserInfo>(`/user/search-user/${userId}`);
  return data;
}

export async function createUser(payload: UserInfo): Promise<void> {
  await apiClient.post('/user/new-user', payload);
}

export async function updateUser(payload: UserInfo): Promise<void> {
  await apiClient.put(`/user/update-user/${payload.id}`, payload);
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/user/delete-user/${userId}`);
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put('/user/change-password', payload, {
    responseType: 'text',
  });
}

export async function sendVerificationEmail(userId: string): Promise<void> {
  await apiClient.post('/api/email-verification/send', { userId });
}
