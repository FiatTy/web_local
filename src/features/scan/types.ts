export type ScanStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface ScanMetrics {
  bugs?: number;
  vulnerabilities?: number;
  codeSmells?: number;
  coverage?: number;
  securityHotspots?: number;
  duplicatedLinesDensity?: number;
  technicalDebtMinutes?: number;
  debtRatio?: number;
  maintainabilityRating?: string;
  reliabilityRating?: string;
  securityRating?: string;
}

import type { Issue } from '@/features/issue/types';

export interface Scan {
  id: string;
  projectId?: string;
  projectName: string;
  projectType?: string;
  status: ScanStatus;
  startedAt: string;
  completedAt?: string;
  qualityGate?: string | null;
  metrics?: ScanMetrics | null;
}

export interface AnalysisLog {
  message: string;
  timestamp?: string;
}

export interface ScanDetail extends Scan {
  issues: Issue[];
  analysisLogs: AnalysisLog[];
  logFilePath?: string;
}

export interface ScanReportEmailPayload {
  type: 'ScanReport';
  email: string;
  applicationName: string;
  subject: string;
  html: string;
}
