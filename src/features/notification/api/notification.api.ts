import { apiClient } from '@/lib/api-client';
import type { AppNotification, CreateNotificationPayload } from '@/features/notification/types';

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const response = await apiClient.get<AppNotification[]>(`/notifications/${userId}`);
  return (response.data ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`, {});
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await apiClient.patch(`/notifications/${userId}/read-all`, {});
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<AppNotification> {
  const response = await apiClient.post<AppNotification>('/notifications', payload);
  return response.data;
}
