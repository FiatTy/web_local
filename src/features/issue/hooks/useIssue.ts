import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addIssueComment,
  getIssueAnalysis,
  getIssueById,
  triggerRecommendFixAi,
  updateIssue,
  type UpdateIssuePayload,
} from '@/features/issue/api/issue.api';
import { issuesQueryKey } from '@/features/issue/hooks/useIssues';
import type { AddCommentPayload, IssueAnalysis, IssueWithComments } from '@/features/issue/types';

export function issueQueryKey(issueId: string) {
  return ['issue', issueId] as const;
}

export function issueAnalysisQueryKey(issueId: string) {
  return ['issue-analysis', issueId] as const;
}

export function useIssue(issueId?: string) {
  return useQuery<IssueWithComments>({
    queryKey: issueQueryKey(issueId ?? ''),
    queryFn: () => getIssueById(issueId as string),
    enabled: Boolean(issueId),
  });
}

export function useIssueAnalysis(issueId?: string) {
  return useQuery<IssueAnalysis>({
    queryKey: issueAnalysisQueryKey(issueId ?? ''),
    queryFn: () => getIssueAnalysis(issueId as string),
    enabled: Boolean(issueId),
    retry: false,
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, UpdateIssuePayload>({
    mutationFn: updateIssue,
    onSuccess: (_result, payload) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: issueQueryKey(payload.id) }),
        queryClient.invalidateQueries({ queryKey: issuesQueryKey }),
      ]),
  });
}

interface BulkAssignVariables {
  issueIds: string[];
  assignedTo: string;
}

export interface BulkAssignResult {
  succeeded: number;
  failed: number;
}

export function useBulkAssignIssues() {
  const queryClient = useQueryClient();

  return useMutation<BulkAssignResult, unknown, BulkAssignVariables>({
    mutationFn: async ({ issueIds, assignedTo }) => {
      const results = await Promise.allSettled(
        issueIds.map((id) => updateIssue({ id, assignedTo, status: 'IN_PROGRESS' })),
      );
      const succeeded = results.filter((result) => result.status === 'fulfilled').length;
      return { succeeded, failed: results.length - succeeded };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issuesQueryKey }),
  });
}

export function useAddIssueComment() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, AddCommentPayload>({
    mutationFn: addIssueComment,
    onSuccess: (_result, payload) =>
      queryClient.invalidateQueries({ queryKey: issueQueryKey(payload.issueId) }),
  });
}

interface TriggerAiFixVariables {
  projectId: string;
  issueId: string;
}

export function useTriggerAiFix() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, TriggerAiFixVariables>({
    mutationFn: ({ projectId, issueId }) => triggerRecommendFixAi(projectId, issueId),
    onSuccess: (_result, variables) =>
      queryClient.invalidateQueries({ queryKey: issueAnalysisQueryKey(variables.issueId) }),
  });
}
