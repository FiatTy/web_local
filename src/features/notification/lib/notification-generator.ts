import { createNotification, getNotifications } from '@/features/notification/api/notification.api';
import type { AppNotification } from '@/features/notification/types';

const notifiedIssueIds = new Set<string>();
const notifiedQualityGateScanIds = new Set<string>();
let qualityGateInProgress = false;

export interface IssueNotificationInput {
  id: string;
  severity: string;
  type: string;
  message: string;
  projectId?: string;
}

export interface QualityGateNotificationInput {
  scanId: string;
  qualityGate?: string | null;
  projectId?: string;
  projectName?: string;
}

export interface ScanNotificationInput {
  projectId: string;
  scanId: string;
  projectName: string;
  succeeded: boolean;
}

export interface ReportNotificationInput {
  projectId: string;
  projectName: string;
  succeeded: boolean;
}

async function loadExisting(userId: string): Promise<AppNotification[]> {
  try {
    return await getNotifications(userId);
  } catch {
    return [];
  }
}

export async function generateScanNotification(
  input: ScanNotificationInput,
  userId: string,
): Promise<boolean> {
  if (!userId) {
    return false;
  }
  try {
    await createNotification({
      userId,
      type: 'Scans',
      title: input.succeeded ? 'Scan Completed' : 'Scan Failed',
      message: input.succeeded
        ? `${input.projectName} scan completed successfully`
        : `${input.projectName} scan failed caused by Git Token is Expired or Failed to connect to Server.`,
      relatedProjectId: input.projectId,
      relatedScanId: input.scanId,
      isBroadcast: false,
    });
    return true;
  } catch {
    return false;
  }
}

export async function generateReportNotification(
  input: ReportNotificationInput,
  userId: string,
): Promise<boolean> {
  if (!userId) {
    return false;
  }
  try {
    await createNotification({
      userId,
      type: 'System',
      title: input.succeeded ? 'Report Generated' : 'Report Generation Failed',
      message: input.succeeded
        ? `${input.projectName} report is ready to download`
        : `${input.projectName} report could not be generated`,
      relatedProjectId: input.projectId,
      isBroadcast: false,
    });
    return true;
  } catch {
    return false;
  }
}

export async function generateQualityGateNotifications(
  scans: QualityGateNotificationInput[],
  userId: string,
): Promise<boolean> {
  if (scans.length === 0 || !userId || qualityGateInProgress) {
    return false;
  }

  const failed = scans.filter((scan) => {
    const gate = (scan.qualityGate ?? '').toUpperCase();
    return gate !== '' && gate !== 'OK' && gate !== 'NONE';
  });
  if (failed.length === 0) {
    return false;
  }
  if (failed.every((scan) => notifiedQualityGateScanIds.has(scan.scanId))) {
    return false;
  }

  qualityGateInProgress = true;
  try {
    const existing = await loadExisting(userId);
    existing
      .filter((item) => item.title?.includes('Quality Gate') && item.relatedScanId)
      .forEach((item) => notifiedQualityGateScanIds.add(item.relatedScanId as string));

    const pending = failed.filter((scan) => !notifiedQualityGateScanIds.has(scan.scanId));
    if (pending.length === 0) {
      return false;
    }
    pending.forEach((scan) => notifiedQualityGateScanIds.add(scan.scanId));

    let created = false;
    for (const scan of pending) {
      try {
        await createNotification({
          userId,
          type: 'System',
          title: 'Quality Gate Failed',
          message: `${scan.projectName ?? 'Unknown'} failed quality gate check`,
          relatedProjectId: scan.projectId,
          relatedScanId: scan.scanId,
          isBroadcast: false,
        });
        created = true;
      } catch {
        notifiedQualityGateScanIds.delete(scan.scanId);
      }
    }
    return created;
  } finally {
    qualityGateInProgress = false;
  }
}

export async function generateIssueNotifications(
  issues: IssueNotificationInput[],
  userId: string,
): Promise<boolean> {
  if (issues.length === 0 || !userId) {
    return false;
  }

  const existing = await loadExisting(userId);
  existing
    .filter((item) => item.relatedIssueId)
    .forEach((item) => notifiedIssueIds.add(item.relatedIssueId as string));

  const pending = issues.filter((issue) => !notifiedIssueIds.has(issue.id));
  if (pending.length === 0) {
    return false;
  }
  pending.forEach((issue) => notifiedIssueIds.add(issue.id));

  let created = false;
  for (const issue of pending) {
    try {
      await createNotification({
        userId,
        type: 'Issues',
        title: `${issue.severity} ${issue.type} Issue`,
        message: issue.message,
        relatedIssueId: issue.id,
        relatedProjectId: issue.projectId,
        isBroadcast: false,
      });
      created = true;
    } catch {
      notifiedIssueIds.delete(issue.id);
    }
  }
  return created;
}
