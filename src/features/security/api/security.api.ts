import { apiClient } from '@/lib/api-client';
import { mapIssue, type RawIssue } from '@/features/issue/api/issue.api';
import type { Issue } from '@/features/issue/types';
import type { OwaspCategory, SecurityCountItem, SecurityMetrics } from '@/features/security/types';

interface RawSecurityMetrics {
  score?: number;
  riskLevel?: string;
  vulnerabilities?: SecurityCountItem[];
  hotIssues?: SecurityCountItem[];
  owaspCoverage?: SecurityCountItem[];
}

function prettify(slug: string): string {
  if (!slug) {
    return '';
  }
  const owasp = /^a(\d+)$/i.exec(slug);
  if (owasp) {
    return `A${owasp[1].padStart(2, '0')}`;
  }
  if (slug.toLowerCase() === 'others') {
    return 'Other';
  }
  return slug
    .split(/[-_\s]+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export async function getSecurityMetrics(projectId?: string): Promise<SecurityMetrics> {
  const url = projectId ? `/api/security/metrics/${projectId}` : '/api/security/metrics';
  const { data } = await apiClient.get<RawSecurityMetrics>(url);
  return {
    score: data.score ?? 0,
    riskLevel: data.riskLevel ?? 'SAFE',
    vulnerabilities: (data.vulnerabilities ?? []).map((item) => ({
      severity: item.name,
      count: item.count,
    })),
    hotIssues: (data.hotIssues ?? []).map((item) => ({
      name: prettify(item.name),
      count: item.count,
    })),
    owaspCoverage: (data.owaspCoverage ?? []).map((item) => ({
      name: prettify(item.name),
      count: item.count,
      status: (item.status as OwaspCategory['status']) ?? 'pass',
    })),
  };
}

export async function getSecurityIssues(): Promise<Issue[]> {
  const { data } = await apiClient.get<RawIssue[]>('/api/get-issue-by-security');
  return (data ?? []).map(mapIssue);
}
