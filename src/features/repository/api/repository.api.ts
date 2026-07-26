import { apiClient } from '@/lib/api-client';
import type {
  ProjectType,
  RepoMetrics,
  RepoStatus,
  Repository,
  RepositoryDetail,
  RepositoryPayload,
  StartScanRequest,
} from '@/features/repository/types';
import type { SonarQubeConfig } from '@/features/setting/types';
import type { Scan } from '@/features/scan/types';

const DEFAULT_EXCLUSIONS = '**/node_modules/**,**/*.spec.ts';
const DEFAULT_JDK_VERSION = 17;

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
      (a, b) =>
        new Date(b.startedAt as string).getTime() - new Date(a.startedAt as string).getTime(),
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

export async function getRepositoryById(projectId: string): Promise<Repository> {
  const { data } = await apiClient.get<RawProject & { projectId?: string }>(
    `/repository/search-repositories/${projectId}`,
  );
  return mapProject({ ...data, id: data.id ?? data.projectId ?? projectId });
}

export async function createRepository(payload: RepositoryPayload): Promise<Repository> {
  const { data } = await apiClient.post<RawProject & { projectId?: string }>(
    '/repository/new-repository',
    payload,
  );
  return mapProject({ ...data, id: data.id ?? data.projectId ?? '' });
}

export async function updateRepository(
  projectId: string,
  payload: RepositoryPayload,
): Promise<Repository> {
  const { data } = await apiClient.put<RawProject & { projectId?: string }>(
    `/repository/update-repository/${projectId}`,
    payload,
  );
  return mapProject({ ...data, id: data.id ?? data.projectId ?? projectId });
}

export function buildScanRequest(
  config: SonarQubeConfig | undefined,
  branch: string,
  gitToken?: string | null,
  serverUrl?: string | null,
): StartScanRequest {
  return {
    branch,
    sonarToken: config?.authToken || '',
    serverUrl: serverUrl && serverUrl.trim() !== '' ? serverUrl.trim() : null,
    gitToken: gitToken && gitToken.trim() !== '' ? gitToken.trim() : null,
    angularSettings: {
      runNpm: config?.angularRunNpm || false,
      coverage: config?.angularCoverage || false,
      tsFiles: config?.angularTsFiles || false,
      exclusions: config?.angularExclusions || DEFAULT_EXCLUSIONS,
    },
    springSettings: {
      runTests: config?.springRunTests || false,
      jacoco: config?.springJacoco || false,
      buildTool: config?.springBuildTool || 'maven',
      jdkVersion: config?.springJdkVersion || DEFAULT_JDK_VERSION,
    },
    qualityGateSettings: {
      failOnError: config?.qgFailOnError || false,
      coverageThreshold: config?.qgCoverageThreshold || 0,
      maxBugs: config?.qgMaxBugs || 0,
      maxVulnerabilities: config?.qgMaxVulnerabilities || 0,
      maxCodeSmells: config?.qgMaxCodeSmells || 0,
      qgMaxDuplications: config?.qgMaxDuplications || 0,
      qgMaxSecurityHotspots: config?.qgMaxSecurityHotspots || 0,
    },
  };
}

export async function startScan(projectId: string, request: StartScanRequest): Promise<void> {
  await apiClient.post(`/${projectId}/scan`, request);
}

function mapScan(raw: RawScan, project: RawProject): Scan {
  const metrics = raw.metrics as Record<string, unknown> | undefined;
  return {
    id: raw.id ?? '',
    projectId: project.id,
    projectName: project.name,
    projectType: project.projectType,
    status: (raw.status as Scan['status']) ?? 'PENDING',
    startedAt: raw.startedAt ?? '',
    completedAt: raw.completedAt,
    qualityGate: raw.qualityGate ?? null,
    metrics: metrics
      ? {
          bugs: toNumber(metrics.bugs) ?? 0,
          vulnerabilities: toNumber(metrics.vulnerabilities) ?? 0,
          codeSmells: toNumber(metrics.codeSmells ?? metrics.code_smells) ?? 0,
          coverage: toNumber(metrics.coverage) ?? 0,
          securityHotspots: toNumber(metrics.securityHotspots ?? metrics.security_hotspots) ?? 0,
          duplicatedLinesDensity:
            toNumber(metrics.duplicatedLinesDensity ?? metrics.duplicated_lines_density) ?? 0,
          maintainabilityRating: (metrics.maintainabilityRating ?? metrics.sqale_rating) as
            string | undefined,
          reliabilityRating: (metrics.reliabilityRating ?? metrics.reliability_rating) as
            string | undefined,
          securityRating: (metrics.securityRating ?? metrics.security_rating) as string | undefined,
        }
      : null,
  };
}

export async function getRepositoryDetail(projectId: string): Promise<RepositoryDetail> {
  const { data } = await apiClient.get<RawProject>(`/api/${projectId}`);
  const project = { ...data, id: data.id ?? projectId };
  const scans = (project.scanData ?? [])
    .map((scan) => mapScan(scan, project))
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.startedAt).getTime() -
        new Date(a.completedAt ?? a.startedAt).getTime(),
    );
  return { ...mapProject(project), scans };
}
