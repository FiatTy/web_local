import type { Scan } from '@/features/scan/types';
import type { Repository } from '@/features/repository/types';

const MINUTES_PER_DAY = 480;
const DEFAULT_COST_PER_DAY = 1000;

export type DebtPriority = 'High' | 'Med' | 'Low';

export interface ProjectDebt {
  projectId: string;
  name: string;
  minutes: number;
  days: number;
  cost: number;
  lastScan?: string;
}

export interface TotalDebt {
  days: number;
  hours: number;
  minutes: number;
  cost: number;
}

export interface DebtCategory {
  labelKey: string;
  percent: number;
}

export interface DebtItem extends ProjectDebt {
  priority: DebtPriority;
}

export function toDebtDays(minutes: number): number {
  return minutes / MINUTES_PER_DAY;
}

export function latestScanPerProject(scans: Scan[]): Scan[] {
  const byProject = new Map<string, Scan>();
  for (const scan of scans) {
    const projectId = scan.projectId;
    if (!projectId) {
      continue;
    }
    const previous = byProject.get(projectId);
    if (!previous) {
      byProject.set(projectId, scan);
      continue;
    }
    const current = new Date(scan.completedAt ?? scan.startedAt ?? 0).getTime();
    const stored = new Date(previous.completedAt ?? previous.startedAt ?? 0).getTime();
    if (current > stored) {
      byProject.set(projectId, scan);
    }
  }
  return Array.from(byProject.values());
}

export function computeProjectDebts(scans: Scan[], repositories: Repository[]): ProjectDebt[] {
  const costById = new Map(
    repositories.map((repo) => [repo.projectId, repo.costPerDay ?? DEFAULT_COST_PER_DAY]),
  );

  return latestScanPerProject(scans)
    .map((scan) => {
      const minutes = scan.metrics?.technicalDebtMinutes ?? 0;
      const days = toDebtDays(minutes);
      const costPerDay = costById.get(scan.projectId ?? '') ?? DEFAULT_COST_PER_DAY;
      return {
        projectId: scan.projectId ?? '',
        name: scan.projectName || scan.projectId || 'Unknown',
        minutes,
        days,
        cost: days * costPerDay,
        lastScan: scan.completedAt ?? scan.startedAt,
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

export function computeTotalDebt(projectDebts: ProjectDebt[]): TotalDebt {
  const totalMinutes = projectDebts.reduce((sum, project) => sum + project.minutes, 0);
  const totalCost = projectDebts.reduce((sum, project) => sum + project.cost, 0);
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const remainder = totalMinutes % MINUTES_PER_DAY;
  return {
    days,
    hours: Math.floor(remainder / 60),
    minutes: remainder % 60,
    cost: totalCost,
  };
}

export function computeTopDebtItems(projectDebts: ProjectDebt[], limit = 5): DebtItem[] {
  const maxCost = Math.max(...projectDebts.map((project) => project.cost), 1);
  const step = maxCost / 3;

  return projectDebts.slice(0, limit).map((project) => ({
    ...project,
    priority: project.cost > step * 2 ? 'High' : project.cost > step ? 'Med' : 'Low',
  }));
}

function securityScore(vulnerabilities: number, hotspots: number): number {
  if (vulnerabilities === 0 && hotspots <= 1) return 0;
  if (vulnerabilities === 0 && hotspots <= 3) return 20;
  if (vulnerabilities <= 2) return 40;
  if (vulnerabilities <= 5) return 60;
  return 80;
}

function architectureScore(duplication: number): number {
  if (duplication <= 3) return 0;
  if (duplication <= 8) return 20;
  if (duplication <= 15) return 40;
  if (duplication <= 25) return 60;
  return 80;
}

function documentationScore(codeSmells: number): number {
  if (codeSmells <= 10) return 0;
  if (codeSmells <= 25) return 20;
  if (codeSmells <= 40) return 40;
  if (codeSmells <= 60) return 60;
  return 80;
}

function testCoverageScore(coverage: number): number {
  if (coverage <= 20) return 80;
  if (coverage <= 40) return 60;
  if (coverage <= 60) return 40;
  if (coverage <= 80) return 20;
  return 0;
}

function codeQualityScore(bugs: number): number {
  if (bugs === 0) return 0;
  if (bugs <= 2) return 20;
  if (bugs <= 5) return 40;
  if (bugs <= 10) return 60;
  return 80;
}

export function computeDebtCategories(scans: Scan[]): DebtCategory[] {
  let security = 0;
  let architecture = 0;
  let documentation = 0;
  let testCoverage = 0;
  let codeQuality = 0;
  let count = 0;

  for (const scan of latestScanPerProject(scans)) {
    const metrics = scan.metrics;
    if (!metrics) {
      continue;
    }
    count += 1;
    security += securityScore(metrics.vulnerabilities ?? 0, metrics.securityHotspots ?? 0);
    architecture += architectureScore(metrics.duplicatedLinesDensity ?? 0);
    documentation += documentationScore(metrics.codeSmells ?? 0);
    testCoverage += testCoverageScore(metrics.coverage ?? 0);
    codeQuality += codeQualityScore(metrics.bugs ?? 0);
  }

  const empty: DebtCategory[] = [
    { labelKey: 'TECHNICAL_DEBT.CAT_DOCUMENTATION', percent: 0 },
    { labelKey: 'TECHNICAL_DEBT.CAT_ARCHITECTURE', percent: 0 },
    { labelKey: 'TECHNICAL_DEBT.CAT_CODE_QUALITY', percent: 0 },
    { labelKey: 'TECHNICAL_DEBT.CAT_TEST_COVERAGE', percent: 0 },
    { labelKey: 'TECHNICAL_DEBT.CAT_SECURITY', percent: 0 },
  ];

  if (count === 0) {
    return empty;
  }

  const averages = {
    documentation: documentation / count,
    architecture: architecture / count,
    codeQuality: codeQuality / count,
    testCoverage: testCoverage / count,
    security: security / count,
  };
  const total =
    averages.documentation +
    averages.architecture +
    averages.codeQuality +
    averages.testCoverage +
    averages.security;

  if (total === 0) {
    return empty;
  }

  const share = (value: number) => Number(((value / total) * 100).toFixed(1));

  return [
    {
      labelKey: 'TECHNICAL_DEBT.CAT_DOCUMENTATION',
      percent: share(averages.documentation),
    },
    {
      labelKey: 'TECHNICAL_DEBT.CAT_ARCHITECTURE',
      percent: share(averages.architecture),
    },
    {
      labelKey: 'TECHNICAL_DEBT.CAT_CODE_QUALITY',
      percent: share(averages.codeQuality),
    },
    {
      labelKey: 'TECHNICAL_DEBT.CAT_TEST_COVERAGE',
      percent: share(averages.testCoverage),
    },
    {
      labelKey: 'TECHNICAL_DEBT.CAT_SECURITY',
      percent: share(averages.security),
    },
  ];
}

export function formatDebtTime(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const remainder = totalMinutes % MINUTES_PER_DAY;
  const hours = Math.floor(remainder / 60);
  const minutes = Math.round(remainder % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}

export function formatThb(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}
