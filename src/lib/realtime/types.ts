export type BackendScanStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type UiScanStatus = 'SCANNING' | 'SUCCESS' | 'FAILED';

export interface RawScanStatusEvent {
  projectId: string;
  scanId?: string;
  id?: string;
  status: BackendScanStatus;
}

export interface ScanStatusEvent {
  projectId: string;
  scanId: string;
  status: UiScanStatus;
}

export interface NotificationEvent {
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

export interface ProjectChangeEvent {
  action: 'ADDED' | 'UPDATED' | 'DELETED';
  projectId: string;
  projectName: string;
}

export interface IssueChangeEvent {
  action: 'UPDATED';
  issueId: string;
}

export interface UserVerifyStatusEvent {
  userId: string;
  status: 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED';
}

export function toUiScanStatus(status: BackendScanStatus): UiScanStatus {
  return status === 'PENDING' ? 'SCANNING' : status;
}

export function toScanStatusEvent(raw: RawScanStatusEvent): ScanStatusEvent {
  return {
    projectId: raw.projectId,
    scanId: raw.scanId ?? raw.id ?? '',
    status: toUiScanStatus(raw.status),
  };
}
