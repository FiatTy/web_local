export const SCAN_STATUS_TOPIC = '/topic/scan-status';
export const GLOBAL_NOTIFICATIONS_TOPIC = '/topic/notifications/global';
export const PROJECTS_TOPIC = '/topic/projects';
export const ISSUES_TOPIC = '/topic/issues';

export function userNotificationsTopic(userId: string): string {
  return `/topic/notifications/${userId}`;
}

export function verifyStatusTopic(userId: string): string {
  return `/topic/user/${userId}/verify-status`;
}

export function issueCommentsTopic(issueId: string): string {
  return `/topic/issue/${issueId.toLowerCase()}/comments`;
}
