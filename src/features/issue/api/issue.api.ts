import { apiClient } from '@/lib/api-client';
import type {
  AddCommentPayload,
  Issue,
  IssueAnalysis,
  IssueComment,
  IssueWithComments,
} from '@/features/issue/types';

interface RawComment {
  id?: string;
  issue?: string;
  user?: { id?: string; username?: string } | null;
  comment?: string;
  createdAt?: string;
  parentCommentId?: string;
}

export interface RawIssue {
  id: string;
  scanId: string;
  projectId?: string;
  projectData?: { id?: string; name?: string } | null;
  issueKey: string;
  type?: string;
  severity?: string;
  ruleKey?: string;
  component?: string;
  line?: number;
  message?: string;
  status?: string;
  assignedTo?: { id?: string; username?: string } | null;
  createdAt?: string;
  commentData?: RawComment[] | null;
}

export function mapIssue(raw: RawIssue): Issue {
  return {
    id: raw.id,
    scanId: raw.scanId,
    projectId: raw.projectId ?? raw.projectData?.id,
    projectName: raw.projectData?.name ?? '',
    issueKey: raw.issueKey,
    type: (raw.type ?? '').toUpperCase(),
    severity: (raw.severity ?? '').toUpperCase(),
    ruleKey: raw.ruleKey,
    component: raw.component ?? '',
    line: raw.line,
    message: raw.message ?? '',
    status: (raw.status ?? 'OPEN').toUpperCase().replace(/\s+/g, '_'),
    assignedId: raw.assignedTo?.id,
    assignedName: raw.assignedTo?.username,
    createdAt: raw.createdAt ?? '',
  };
}

export async function getAllIssues(): Promise<Issue[]> {
  const response = await apiClient.get<RawIssue[]>('/api/issues');
  return (response.data ?? [])
    .map(mapIssue)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export interface UpdateIssuePayload {
  id: string;
  status?: string | null;
  assignedTo?: string | null;
}

export async function updateIssue(payload: UpdateIssuePayload): Promise<void> {
  await apiClient.post('/api/issues/update', payload);
}

function mapComment(raw: RawComment, issueId: string): IssueComment {
  return {
    id: raw.id ?? '',
    issueId: raw.issue ?? issueId,
    userId: raw.user?.id,
    username: raw.user?.username ?? '',
    comment: raw.comment ?? '',
    createdAt: raw.createdAt ?? '',
    parentCommentId: raw.parentCommentId || undefined,
  };
}

export async function getIssueById(issueId: string): Promise<IssueWithComments> {
  const { data } = await apiClient.get<RawIssue>(`/api/issues/${issueId}`);
  return {
    ...mapIssue(data),
    comments: (data.commentData ?? [])
      .map((comment) => mapComment(comment, data.id))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  };
}

export async function getIssueAnalysis(issueId: string): Promise<IssueAnalysis> {
  const { data } = await apiClient.get<IssueAnalysis>(`/api/issue-details/${issueId}`);
  return data;
}

export async function addIssueComment(payload: AddCommentPayload): Promise<void> {
  await apiClient.post('/api/comments', payload);
}

export async function triggerRecommendFixAi(projectId: string, issueId: string): Promise<void> {
  await apiClient.post('/api/recommend-fix-ai', { projectId, issueId });
}
