import { useQuery } from '@tanstack/react-query';
import { getSecurityIssues, getSecurityMetrics } from '@/features/security/api/security.api';
import type { SecurityMetrics } from '@/features/security/types';
import type { Issue } from '@/features/issue/types';

export function securityMetricsQueryKey(projectId?: string) {
  return ['security-metrics', projectId ?? 'all'] as const;
}

export const securityIssuesQueryKey = ['security-issues'] as const;

export function useSecurityMetrics(projectId?: string) {
  return useQuery<SecurityMetrics>({
    queryKey: securityMetricsQueryKey(projectId),
    queryFn: () => getSecurityMetrics(projectId),
  });
}

export function useSecurityIssues() {
  return useQuery<Issue[]>({
    queryKey: securityIssuesQueryKey,
    queryFn: getSecurityIssues,
  });
}
