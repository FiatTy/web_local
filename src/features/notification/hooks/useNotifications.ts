import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notification/api/notification.api';
import { useAuth } from '@/lib/auth/auth-context';
import type { AppNotification, CreateNotificationPayload } from '@/features/notification/types';

export function notificationsQueryKey(userId: string) {
  return ['notifications', userId] as const;
}

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery<AppNotification[]>({
    queryKey: notificationsQueryKey(userId),
    queryFn: () => getNotifications(userId),
    enabled: Boolean(userId),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useMutation<void, unknown, string>({
    mutationFn: markNotificationRead,
    onMutate: (notificationId) => {
      queryClient.setQueryData<AppNotification[]>(notificationsQueryKey(userId), (current) =>
        (current ?? []).map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useMutation<void, unknown, void>({
    mutationFn: () => markAllNotificationsRead(userId),
    onMutate: () => {
      queryClient.setQueryData<AppNotification[]>(notificationsQueryKey(userId), (current) =>
        (current ?? []).map((item) => ({ ...item, isRead: true })),
      );
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation<AppNotification, unknown, CreateNotificationPayload>({
    mutationFn: createNotification,
    onSuccess: (notification, payload) => {
      queryClient.setQueryData<AppNotification[]>(
        notificationsQueryKey(payload.userId),
        (current) => {
          const list = current ?? [];
          if (list.some((item) => item.id === notification.id)) {
            return list;
          }
          return [notification, ...list];
        },
      );
    },
  });
}
