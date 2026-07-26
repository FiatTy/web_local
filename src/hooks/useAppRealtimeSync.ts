import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import { realtimeClient } from '@/lib/realtime/stomp-client';
import { useRealtimeTopic } from '@/lib/realtime/useRealtimeTopic';
import {
  ISSUES_TOPIC,
  PROJECTS_TOPIC,
  SCAN_STATUS_TOPIC,
  verifyStatusTopic,
} from '@/lib/realtime/topics';
import {
  toScanStatusEvent,
  type IssueChangeEvent,
  type ProjectChangeEvent,
  type RawScanStatusEvent,
  type UserVerifyStatusEvent,
} from '@/lib/realtime/types';
import { repositoriesQueryKey } from '@/features/repository/hooks/useRepositories';
import {
  repositoryDetailQueryKey,
  repositoryQueryKey,
} from '@/features/repository/hooks/useRepository';
import { clearMyTriggeredScan, isMyTriggeredScan } from '@/features/repository/lib/triggered-scans';
import { scanHistoryQueryKey } from '@/features/scan/hooks/useScanHistory';
import { issuesQueryKey } from '@/features/issue/hooks/useIssues';
import { issueAnalysisQueryKey, issueQueryKey } from '@/features/issue/hooks/useIssue';
import { getAllIssues } from '@/features/issue/api/issue.api';
import { getRepositoryDetail } from '@/features/repository/api/repository.api';
import { notificationsQueryKey } from '@/features/notification/hooks/useNotifications';
import { useNotificationStream } from '@/features/notification/hooks/useNotificationStream';
import {
  generateIssueNotifications,
  generateQualityGateNotifications,
  generateScanNotification,
} from '@/features/notification/lib/notification-generator';
import { useNotificationSettings } from '@/features/setting/hooks/useNotificationSettings';
import { getUserById } from '@/features/user/api/user.api';
import type { Repository } from '@/features/repository/types';

const REPORTABLE_SEVERITIES = ['MAJOR', 'CRITICAL', 'BLOCKER'];

export function useAppRealtimeSync(): void {
  const { t } = useTranslation();
  const { user, applyUser } = useAuth();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: settings } = useNotificationSettings();

  const settingsRef = useRef(settings);
  const hasConnectedBefore = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useNotificationStream();

  const projectNameOf = useCallback(
    (projectId: string): string => {
      const repositories = queryClient.getQueryData<Repository[]>(repositoriesQueryKey) ?? [];
      const match = repositories.find((repository) => repository.projectId === projectId);
      return match?.name ?? t('REALTIME.UNKNOWN_PROJECT');
    },
    [queryClient, t],
  );

  const invalidateRepository = useCallback(
    (projectId: string) => {
      void queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });
      void queryClient.invalidateQueries({
        queryKey: repositoryQueryKey(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: repositoryDetailQueryKey(projectId),
      });
    },
    [queryClient],
  );

  const runScanFollowUp = useCallback(
    async (projectId: string, scanId: string, succeeded: boolean) => {
      const projectName = projectNameOf(projectId);
      let created = await generateScanNotification(
        { projectId, scanId, projectName, succeeded },
        userId,
      );

      if (succeeded) {
        const detail = await getRepositoryDetail(projectId).catch(() => null);
        const latestScan = detail?.scans?.find((scan) => scan.id === scanId) ?? detail?.scans?.[0];

        if (latestScan) {
          const gateCreated = await generateQualityGateNotifications(
            [
              {
                scanId: latestScan.id,
                qualityGate: latestScan.qualityGate,
                projectId,
                projectName,
              },
            ],
            userId,
          );
          created = created || gateCreated;
        }

        const issues = await getAllIssues().catch(() => []);
        const projectIssues = issues.filter(
          (issue) =>
            issue.projectId === projectId &&
            REPORTABLE_SEVERITIES.includes(issue.severity) &&
            issue.type !== 'CODE_SMELL',
        );
        if (projectIssues.length > 0) {
          const issuesCreated = await generateIssueNotifications(
            projectIssues.map((issue) => ({
              id: issue.id,
              severity: issue.severity,
              type: issue.type,
              message: issue.message,
              projectId: issue.projectId,
            })),
            userId,
          );
          created = created || issuesCreated;
        }
      }

      if (created) {
        void queryClient.invalidateQueries({
          queryKey: notificationsQueryKey(userId),
        });
      }
    },
    [projectNameOf, queryClient, userId],
  );

  const handleScanStatus = useCallback(
    (raw: RawScanStatusEvent) => {
      if (!raw?.projectId) {
        return;
      }
      const event = toScanStatusEvent(raw);
      invalidateRepository(event.projectId);

      if (event.status === 'SCANNING') {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: scanHistoryQueryKey });
      void queryClient.invalidateQueries({ queryKey: issuesQueryKey });

      if (!isMyTriggeredScan(event.projectId)) {
        return;
      }
      clearMyTriggeredScan(event.projectId);

      const succeeded = event.status === 'SUCCESS';
      const current = settingsRef.current;
      if (!current || current.scansEnabled) {
        showToast({
          tone: succeeded ? 'success' : 'error',
          title: succeeded ? t('REALTIME.SCAN_COMPLETED') : t('REALTIME.SCAN_FAILED'),
          description: projectNameOf(event.projectId),
        });
      }

      void runScanFollowUp(event.projectId, event.scanId, succeeded);
    },
    [invalidateRepository, projectNameOf, queryClient, runScanFollowUp, showToast, t],
  );

  const handleProjectChange = useCallback(
    (event: ProjectChangeEvent) => {
      if (!event?.action) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });

      if (event.action === 'DELETED') {
        showToast({
          tone: 'warning',
          title: t('REALTIME.PROJECT_DELETED', { name: event.projectName }),
        });
        return;
      }

      showToast({
        tone: 'info',
        title:
          event.action === 'ADDED'
            ? t('REALTIME.PROJECT_ADDED', { name: event.projectName })
            : t('REALTIME.PROJECT_UPDATED', { name: event.projectName }),
      });
    },
    [queryClient, showToast, t],
  );

  const handleIssueChange = useCallback(
    (event: IssueChangeEvent) => {
      if (event?.action !== 'UPDATED') {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: issuesQueryKey });
      if (event.issueId) {
        void queryClient.invalidateQueries({
          queryKey: issueQueryKey(event.issueId),
        });
        void queryClient.invalidateQueries({
          queryKey: issueAnalysisQueryKey(event.issueId),
        });
      }
    },
    [queryClient],
  );

  const handleVerifyStatus = useCallback(
    (event: UserVerifyStatusEvent) => {
      if (!event?.userId || event.userId !== userId) {
        return;
      }
      void getUserById(event.userId)
        .then((freshUser) => {
          if (!user) {
            return;
          }
          applyUser({ ...user, status: freshUser.status });
          showToast({
            tone: freshUser.status === 'VERIFIED' ? 'success' : 'info',
            title:
              freshUser.status === 'VERIFIED'
                ? t('REALTIME.EMAIL_VERIFIED')
                : freshUser.status === 'PENDING_VERIFICATION'
                  ? t('REALTIME.VERIFICATION_PENDING')
                  : t('REALTIME.EMAIL_UNVERIFIED'),
          });
        })
        .catch(() => undefined);
    },
    [applyUser, showToast, t, user, userId],
  );

  useRealtimeTopic<RawScanStatusEvent>(SCAN_STATUS_TOPIC, handleScanStatus);
  useRealtimeTopic<ProjectChangeEvent>(PROJECTS_TOPIC, handleProjectChange);
  useRealtimeTopic<IssueChangeEvent>(ISSUES_TOPIC, handleIssueChange);
  useRealtimeTopic<UserVerifyStatusEvent>(
    userId ? verifyStatusTopic(userId) : null,
    handleVerifyStatus,
  );

  useEffect(() => {
    return realtimeClient.onConnectionChange((connected) => {
      if (!connected) {
        return;
      }
      if (hasConnectedBefore.current) {
        void queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });
        void queryClient.invalidateQueries({ queryKey: issuesQueryKey });
      }
      hasConnectedBefore.current = true;
    });
  }, [queryClient]);
}
