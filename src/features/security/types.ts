export interface SecurityCountItem {
  name: string;
  count: number;
  status?: string | null;
}

export interface VulnerabilitySeverity {
  severity: string;
  count: number;
}

export interface OwaspCategory {
  name: string;
  count: number;
  status: 'pass' | 'warning' | 'fail';
}

export interface HotSecurityIssue {
  name: string;
  count: number;
}

export interface SecurityMetrics {
  score: number;
  riskLevel: string;
  vulnerabilities: VulnerabilitySeverity[];
  hotIssues: HotSecurityIssue[];
  owaspCoverage: OwaspCategory[];
}
