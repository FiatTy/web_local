export interface Issue {
  id: string;
  scanId: string;
  projectId?: string;
  projectName: string;
  issueKey: string;
  type: string;
  severity: string;
  ruleKey?: string;
  component: string;
  line?: number;
  message: string;
  status: string;
  assignedId?: string;
  assignedName?: string;
  createdAt: string;
}
