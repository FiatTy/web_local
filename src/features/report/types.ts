export type ReportFormat = 'PDF' | 'Excel' | 'Word' | 'PowerPoint';

export interface ReportSections {
  qualityGate: boolean;
  issueBreakdown: boolean;
  securityAnalysis: boolean;
  technicalDebt: boolean;
  recommendations: boolean;
}

export interface ReportGenerateRequest {
  projectId: string;
  dateFrom: string;
  dateTo: string;
  format: 'pdf';
  sections: ReportSections;
  userId?: string;
  generatedBy?: string;
}

export interface ReportGenerateResponse {
  fileName: string;
  mimeType: string;
  base64: string;
  fileSizeBytes: number;
  generatedAt: string;
}

export interface ReportHistoryEntry {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  dateFrom: string;
  dateTo: string;
  format: string;
  generatedBy: string;
  generatedAt: string;
  includeQualityGate: boolean;
  includeIssueBreakdown: boolean;
  includeSecurityAnalysis: boolean;
  includeTechnicalDebt: boolean;
  includeRecommendations: boolean;
  fileSizeBytes?: number;
}
