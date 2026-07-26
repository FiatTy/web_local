import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeTopic } from '@/lib/realtime/useRealtimeTopic';
import { issueCommentsTopic } from '@/lib/realtime/topics';
import { issueQueryKey } from '@/features/issue/hooks/useIssue';
import type { IssueComment, IssueWithComments } from '@/features/issue/types';

interface RawCommentEvent {
  id?: string;
  issue?: string;
  issueId?: string;
  user?: { id?: string; username?: string } | null;
  comment?: string;
  createdAt?: string;
  parentCommentId?: string;
}

export function useIssueCommentStream(issueId?: string): void {
  const queryClient = useQueryClient();

  const handleComment = useCallback(
    (raw: RawCommentEvent) => {
      if (!issueId || !raw?.id) {
        return;
      }

      const comment: IssueComment = {
        id: raw.id,
        issueId: raw.issue ?? raw.issueId ?? issueId,
        userId: raw.user?.id,
        username: raw.user?.username ?? '',
        comment: raw.comment ?? '',
        createdAt: raw.createdAt ?? new Date().toISOString(),
        parentCommentId: raw.parentCommentId || undefined,
      };

      queryClient.setQueryData<IssueWithComments>(issueQueryKey(issueId), (current) => {
        if (!current) {
          return current;
        }
        if (current.comments.some((item) => item.id === comment.id)) {
          return current;
        }
        return {
          ...current,
          comments: [...current.comments, comment].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        };
      });
    },
    [issueId, queryClient],
  );

  useRealtimeTopic<RawCommentEvent>(issueId ? issueCommentsTopic(issueId) : null, handleComment);
}
