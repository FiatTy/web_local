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

export interface IssueComment {
  id: string;
  issueId: string;
  userId?: string;
  username: string;
  comment: string;
  createdAt: string;
  parentCommentId?: string;
}

export interface IssueWithComments extends Issue {
  comments: IssueComment[];
}

export interface IssueAnalysis {
  description: string;
  vulnerableCode: string;
  recommendedFix: string;
  recommendedFixByAi?: string | null;
  status?: string | null;
}

export interface AddCommentPayload {
  issueId: string;
  userId: string;
  comment: string;
  parentCommentId?: string;
}
