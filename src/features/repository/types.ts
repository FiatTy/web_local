export type RepoStatus = 'Active' | 'Scanning' | 'Error';
export type ProjectType = 'ANGULAR' | 'SPRING_BOOT';

export interface RepoMetrics {
  bugs?: number;
  vulnerabilities?: number;
  codeSmells?: number;
  coverage?: number;
  duplications?: number;
  securityRating?: string;
  reliabilityRating?: string;
  maintainabilityRating?: string;
  securityHotspots?: number;
}

export interface Repository {
  projectId: string;
  name: string;
  repositoryUrl: string;
  projectType?: ProjectType;
  projectTypeLabel?: string;
  sonarProjectKey?: string;
  costPerDay?: number;
  createdAt?: string;
  updatedAt?: string;
  scanId?: string;
  status: RepoStatus;
  lastScan?: string;
  qualityGate?: string;
  metrics?: RepoMetrics;
}
