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
    onSuccess: (_result, payload) => {
      void queryClient.invalidateQueries({ queryKey: issueQueryKey(payload.id) });
      void queryClient.invalidateQueries({ queryKey: issuesQueryKey });
    },
  });
}

export function useAddIssueComment() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, AddCommentPayload>({
    mutationFn: addIssueComment,
    onSuccess: (_result, payload) => {
      void queryClient.invalidateQueries({ queryKey: issueQueryKey(payload.issueId) });
    },
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
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: issueAnalysisQueryKey(variables.issueId) });
    },
  });
}
