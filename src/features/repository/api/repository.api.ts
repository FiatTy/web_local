import { apiClient } from '@/lib/api-client';
import type { ProjectType, RepoMetrics, RepoStatus, Repository } from '@/features/repository/types';

interface RawScan {
  id?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  qualityGate?: string;
  metrics?: Record<string, unknown>;
}

interface RawProject {
  id: string;
  name: string;
  repositoryUrl: string;
  projectType?: ProjectType;
  sonarProjectKey?: string;
  costPerDay?: number;
  createdAt?: string;
  updatedAt?: string;
  scanData?: RawScan[];
}

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function deriveStatus(scan?: RawScan): RepoStatus {
  switch (scan?.status) {
    case 'SCANNING':
    case 'PENDING':
      return 'Scanning';
    case 'FAILED':
    case 'ERROR':
      return 'Error';
    default:
      return 'Active';
  }
}

function mapQualityStatus(status?: string): string | undefined {
  if (status == null || status === '') {
    return undefined;
  }
  return String(status).trim().toUpperCase() === 'OK' ? 'Passed' : 'Failed';
}

function projectTypeLabel(type?: ProjectType): string | undefined {
  if (type === 'SPRING_BOOT') return 'SPRING BOOT';
  if (type === 'ANGULAR') return 'ANGULAR';
  return undefined;
}

function findLatestScan(scans: RawScan[]): RawScan | undefined {
  return scans
    .filter((scan) => Boolean(scan.startedAt))
    .sort(
      (a, b) => new Date(b.startedAt as string).getTime() - new Date(a.startedAt as string).getTime(),
    )[0];
}

function mapMetrics(metrics?: Record<string, unknown>): RepoMetrics | undefined {
  if (!metrics) {
    return undefined;
  }
  const raw = metrics as Record<string, unknown>;
  return {
    bugs: toNumber(raw.bugs),
    vulnerabilities: toNumber(raw.vulnerabilities),
    codeSmells: toNumber(raw.codeSmells ?? raw.code_smells),
    coverage: toNumber(raw.coverage),
    duplications: toNumber(raw.duplicatedLinesDensity ?? raw.duplicated_lines_density),
    securityRating: (raw.securityRating ?? raw.security_rating) as string | undefined,
    reliabilityRating: (raw.reliabilityRating ?? raw.reliability_rating) as string | undefined,
    maintainabilityRating: (raw.maintainabilityRating ?? raw.sqale_rating) as string | undefined,
    securityHotspots: toNumber(raw.securityHotspots ?? raw.security_hotspots),
  };
}

function mapProject(project: RawProject): Repository {
  const latest = findLatestScan(project.scanData ?? []);
  return {
    projectId: project.id,
    name: project.name,
    repositoryUrl: project.repositoryUrl,
    projectType: project.projectType,
    projectTypeLabel: projectTypeLabel(project.projectType),
    sonarProjectKey: project.sonarProjectKey,
    costPerDay: project.costPerDay,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    scanId: latest?.id,
    status: deriveStatus(latest),
    lastScan: latest?.startedAt,
    qualityGate: mapQualityStatus(latest?.qualityGate),
    metrics: mapMetrics(latest?.metrics),
  };
}

function recencyOf(repo: Repository): number {
  const timestamp = repo.lastScan ?? repo.updatedAt ?? repo.createdAt;
  return timestamp ? new Date(timestamp).getTime() : 0;
}

export async function getAllRepositories(): Promise<Repository[]> {
  const response = await apiClient.get<RawProject[]>('/repository/all-repository');
  return (response.data ?? []).map(mapProject).sort((a, b) => recencyOf(b) - recencyOf(a));
}

export async function deleteRepository(projectId: string): Promise<void> {
  await apiClient.delete(`/repository/delete-repository/${projectId}`);
}
