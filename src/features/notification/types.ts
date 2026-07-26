export type NotificationType = 'Scans' | 'Issues' | 'System';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedProjectId?: string;
  relatedScanId?: string;
  relatedIssueId?: string;
  relatedCommentId?: string;
}

export interface CreateNotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedProjectId?: string;
  relatedScanId?: string;
  relatedIssueId?: string;
  relatedCommentId?: string;
  isBroadcast?: boolean;
}
