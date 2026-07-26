import { apiClient } from '@/lib/api-client';
import { mapIssue, type RawIssue } from '@/features/issue/api/issue.api';
import type {
  AnalysisLog,
  Scan,
  ScanDetail,
  ScanMetrics,
  ScanReportEmailPayload,
  ScanStatus,
} from '@/features/scan/types';

interface RawScan {
  id: string;
  project?: { id?: string; name?: string; projectType?: string } | null;
  status?: ScanStatus;
  startedAt?: string;
  completedAt?: string;
  qualityGate?: string | null;
  metrics?: Record<string, unknown> | null;
  issueData?: RawIssue[] | null;
  logFilePath?: string;
}

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapMetrics(metrics?: Record<string, unknown> | null): ScanMetrics | null {
  if (!metrics) {
    return null;
  }
  return {
    bugs: toNumber(metrics.bugs),
    vulnerabilities: toNumber(metrics.vulnerabilities),
    codeSmells: toNumber(metrics.codeSmells ?? metrics.code_smells),
    coverage: toNumber(metrics.coverage),
    securityHotspots: toNumber(metrics.securityHotspots ?? metrics.security_hotspots),
    duplicatedLinesDensity: toNumber(
      metrics.duplicatedLinesDensity ?? metrics.duplicated_lines_density,
    ),
    technicalDebtMinutes: toNumber(metrics.technicalDebtMinutes ?? metrics.technical_debt_minutes),
    debtRatio: toNumber(metrics.debtRatio ?? metrics.debt_ratio),
    maintainabilityRating: (metrics.maintainabilityRating ?? metrics.sqale_rating) as
      string | undefined,
    reliabilityRating: (metrics.reliabilityRating ?? metrics.reliability_rating) as
      string | undefined,
    securityRating: (metrics.securityRating ?? metrics.security_rating) as string | undefined,
  };
}

function mapAnalysisLog(raw: unknown): AnalysisLog {
  if (typeof raw === 'string') {
    return { message: raw };
  }
  const entry = (raw ?? {}) as { message?: unknown; timestamp?: unknown };
  return {
    message: entry.message == null ? '' : String(entry.message),
    timestamp: entry.timestamp == null ? undefined : String(entry.timestamp),
  };
}

function mapScan(raw: RawScan): Scan {
  return {
    id: raw.id,
    projectId: raw.project?.id,
    projectName: raw.project?.name ?? '',
    projectType: raw.project?.projectType,
    status: raw.status ?? 'PENDING',
    startedAt: raw.startedAt ?? '',
    completedAt: raw.completedAt ?? undefined,
    qualityGate: raw.qualityGate ?? null,
    metrics: mapMetrics(raw.metrics),
  };
}

export async function getScanHistory(): Promise<Scan[]> {
  const response = await apiClient.get<RawScan[]>('/api/scans');
  return (response.data ?? [])
    .map(mapScan)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export async function getScanById(scanId: string): Promise<ScanDetail> {
  const response = await apiClient.get<RawScan>(`/api/scans/${scanId}`);
  const raw = response.data;
  const logs = raw.metrics?.analysisLogs;
  return {
    ...mapScan(raw),
    issues: (raw.issueData ?? []).map(mapIssue),
    analysisLogs: Array.isArray(logs) ? logs.map(mapAnalysisLog) : [],
    logFilePath: raw.logFilePath,
  };
}

export async function sendScanReportEmail(payload: ScanReportEmailPayload): Promise<void> {
  await apiClient.post('/api/email/send', payload);
}
