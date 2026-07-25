export type BuildTool = 'maven' | 'gradle';

export interface SonarQubeConfig {
  id: string;
  userId: string;
  serverUrl: string;
  authToken?: string;
  organization: string;
  gitAccessToken?: string;
  angularRunNpm: boolean;
  angularCoverage: boolean;
  angularTsFiles: boolean;
  angularExclusions: string;
  springRunTests: boolean;
  springJacoco: boolean;
  springBuildTool: string;
  springJdkVersion: number;
  qgFailOnError: boolean;
  qgCoverageThreshold: number;
  qgMaxBugs: number;
  qgMaxVulnerabilities: number;
  qgMaxCodeSmells: number;
  qgMaxDuplications: number;
  qgMaxSecurityHotspots: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SonarQubeConfigPayload {
  userId: string;
  serverUrl: string;
  authToken: string;
  organization: string;
  gitAccessToken: string;
  angularRunNpm: boolean;
  angularCoverage: boolean;
  angularTsFiles: boolean;
  angularExclusions: string;
  springRunTests: boolean;
  springJacoco: boolean;
  springBuildTool: string;
  springJdkVersion: number;
  qgFailOnError: boolean;
  qgCoverageThreshold: number;
  qgMaxBugs: number;
  qgMaxVulnerabilities: number;
  qgMaxCodeSmells: number;
  qgMaxDuplications: number;
  qgMaxSecurityHotspots: number;
}

export interface TestConnectionRequest {
  sonarHostUrl: string;
  sonarToken: string;
}

export interface TestConnectionResponse {
  connected: boolean;
}
