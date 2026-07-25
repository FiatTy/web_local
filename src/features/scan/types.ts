export type ScanStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface ScanMetrics {
  bugs?: number;
  vulnerabilities?: number;
  codeSmells?: number;
  coverage?: number;
  securityHotspots?: number;
  duplicatedLinesDensity?: number;
  maintainabilityRating?: string;
  reliabilityRating?: string;
  securityRating?: string;
}

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
