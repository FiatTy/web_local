import { apiClient } from '@/lib/api-client';
import type { Issue } from '@/features/issue/types';

interface RawIssue {
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
}

function mapIssue(raw: RawIssue): Issue {
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
  issueId: string;
  status?: string;
  assignedTo?: string;
  annotation?: string;
  dueDate?: string;
}

export async function updateIssue(payload: UpdateIssuePayload): Promise<void> {
  await apiClient.post('/api/issues/update', payload);
}
