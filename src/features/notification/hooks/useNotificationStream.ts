import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import { useRealtimeTopic } from '@/lib/realtime/useRealtimeTopic';
import { GLOBAL_NOTIFICATIONS_TOPIC, userNotificationsTopic } from '@/lib/realtime/topics';
import type { NotificationEvent } from '@/lib/realtime/types';
import { notificationsQueryKey } from '@/features/notification/hooks/useNotifications';
import { useNotificationSettings } from '@/features/setting/hooks/useNotificationSettings';
import type { AppNotification } from '@/features/notification/types';

const TOAST_BUFFER_MS = 2000;

function toNotification(event: NotificationEvent): AppNotification {
  return {
    id: event.id,
    userId: event.userId,
    type: event.type,
    title: event.title,
    message: event.message,
    isRead: event.isRead,
    createdAt: event.createdAt,
    relatedProjectId: event.relatedProjectId,
    relatedScanId: event.relatedScanId,
    relatedIssueId: event.relatedIssueId,
    relatedCommentId: event.relatedCommentId,
  };
}

export function useNotificationStream(): void {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: settings } = useNotificationSettings();

  const settingsRef = useRef(settings);
  const buffer = useRef<AppNotification[]>([]);
  const flushTimer = useRef<number | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const flush = useCallback(() => {
    const batch = buffer.current;
    buffer.current = [];
    flushTimer.current = null;
    if (batch.length === 0) {
      return;
    }

    const current = settingsRef.current;

    if (batch.some((item) => item.type === 'Issues') && (!current || current.issuesEnabled)) {
      showToast({ tone: 'info', title: t('NOTIFICATION.TOAST_NEW_ISSUES') });
    }

    const systemBatch = batch.filter((item) => item.type === 'System');
    if (systemBatch.length > 0 && (!current || current.systemEnabled)) {
      const titles = systemBatch.map((item) => item.title.toLowerCase());
      if (titles.some((title) => title.includes('quality gate'))) {
        showToast({ tone: 'warning', title: t('NOTIFICATION.TOAST_QUALITY_GATE') });
      } else if (titles.some((title) => title.includes('comment'))) {
        showToast({ tone: 'info', title: t('NOTIFICATION.TOAST_NEW_COMMENT') });
      } else if (titles.some((title) => title.includes('assigned'))) {
        showToast({ tone: 'info', title: t('NOTIFICATION.TOAST_NEW_ASSIGNED') });
      } else {
        showToast({ tone: 'info', title: t('NOTIFICATION.TOAST_NEW_SYSTEM') });
      }
    }
  }, [showToast, t]);

  const receive = useCallback(
    (event: NotificationEvent) => {
      if (!event?.id) {
        return;
      }
      const notification = toNotification(event);

      let isNew = false;
      queryClient.setQueryData<AppNotification[]>(notificationsQueryKey(userId), (list) => {
        const currentList = list ?? [];
        if (currentList.some((item) => item.id === notification.id)) {
          return currentList;
        }
        isNew = true;
        return [notification, ...currentList];
      });

      if (!isNew) {
        return;
      }

      buffer.current.push(notification);
      if (flushTimer.current === null) {
        flushTimer.current = window.setTimeout(flush, TOAST_BUFFER_MS);
      }
    },
    [flush, queryClient, userId],
  );

  useEffect(
    () => () => {
      if (flushTimer.current !== null) {
        window.clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
    },
    [],
  );

  useRealtimeTopic<NotificationEvent>(userId ? userNotificationsTopic(userId) : null, receive);
  useRealtimeTopic<NotificationEvent>(GLOBAL_NOTIFICATIONS_TOPIC, receive);
}
