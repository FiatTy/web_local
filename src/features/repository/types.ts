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

import type { Scan } from '@/features/scan/types';

export interface RepositoryPayload {
  name: string;
  url: string;
  type: ProjectType;
  costPerDay: number;
}

export interface StartScanRequest {
  branch: string;
  sonarToken: string;
  serverUrl: string | null;
  gitToken: string | null;
  angularSettings: {
    runNpm: boolean;
    coverage: boolean;
    tsFiles: boolean;
    exclusions: string;
  };
  springSettings: {
    runTests: boolean;
    jacoco: boolean;
    buildTool: string;
    jdkVersion: number;
  };
  qualityGateSettings: {
    failOnError: boolean;
    coverageThreshold: number;
    maxBugs: number;
    maxVulnerabilities: number;
    maxCodeSmells: number;
    qgMaxDuplications: number;
    qgMaxSecurityHotspots: number;
  };
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

export interface RepositoryDetail extends Repository {
  scans: Scan[];
}
