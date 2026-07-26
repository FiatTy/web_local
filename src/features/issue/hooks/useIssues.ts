import { useQuery } from '@tanstack/react-query';
import { getAllIssues } from '@/features/issue/api/issue.api';

export const issuesQueryKey = ['issues'] as const;

export function useIssues() {
  return useQuery({
    queryKey: issuesQueryKey,
    queryFn: getAllIssues,
  });
}
