import type { AppNotification } from '@/features/notification/types';

export type SystemNotificationKind = 'comment' | 'assignment' | 'qualityGate' | 'generic';

type Related = Pick<
  AppNotification,
  'relatedCommentId' | 'relatedIssueId' | 'relatedScanId' | 'relatedProjectId'
>;

export function classifySystemNotification(notification: Related): SystemNotificationKind {
  if (notification.relatedCommentId) {
    return 'comment';
  }
  if (notification.relatedIssueId) {
    return 'assignment';
  }
  if (notification.relatedScanId) {
    return 'qualityGate';
  }
  return 'generic';
}

const KIND_PRIORITY: SystemNotificationKind[] = ['qualityGate', 'comment', 'assignment', 'generic'];

export function pickSystemNotificationKind(batch: Related[]): SystemNotificationKind {
  const kinds = new Set(batch.map(classifySystemNotification));
  return KIND_PRIORITY.find((kind) => kinds.has(kind)) ?? 'generic';
}
