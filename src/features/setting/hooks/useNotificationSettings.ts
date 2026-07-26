import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/features/setting/api/setting.api';
import { useAuth } from '@/lib/auth/auth-context';
import type { NotificationSettings, NotificationSettingsPayload } from '@/features/setting/types';

export function notificationSettingsQueryKey(userId: string) {
  return ['notification-settings', userId] as const;
}

export function useNotificationSettings() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery<NotificationSettings>({
    queryKey: notificationSettingsQueryKey(userId),
    queryFn: () => getNotificationSettings(userId),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation<NotificationSettings, unknown, NotificationSettingsPayload>({
    mutationFn: updateNotificationSettings,
    onSuccess: (settings, payload) => {
      queryClient.setQueryData(notificationSettingsQueryKey(payload.userId), settings);
    },
  });
}
