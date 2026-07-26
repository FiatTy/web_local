import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Bug,
  CheckCircle2,
  FolderGit2,
  Gauge,
  ScanLine,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRepositories } from '@/features/repository/hooks/useRepositories';
import { useScanHistory } from '@/features/scan/hooks/useScanHistory';
import { useIssues } from '@/features/issue/hooks/useIssues';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { buildDailyTrend } from '@/features/scan/lib/scan-trends';
import type { Scan } from '@/features/scan/types';

const OPEN_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'PENDING']);
const RESOLVED_STATUSES = new Set(['DONE', 'RESOLVED']);
const SEVERITY_RANK: Record<string, number> = {
  BLOCKER: 5,
  CRITICAL: 4,
  MAJOR: 3,
  MINOR: 2,
  INFO: 1,
};
const SEVERITY_DOT: Record<string, string> = {
  BLOCKER: 'bg-blocker',
  CRITICAL: 'bg-critical',
  MAJOR: 'bg-major',
  MINOR: 'bg-minor',
  INFO: 'bg-faint',
};

function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bug;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          {label}
        </span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-fg">{value}</p>
    </div>
  );
}

function GradeChip({ scan }: { scan: Scan }) {
  const { t } = useTranslation();
  if (scan.status === 'PENDING') {
    return (
      <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-medium text-primary">
        {t('SCAN.SCANNING')}
      </span>
    );
  }
  const passed =
    String(scan.qualityGate ?? '')
      .trim()
      .toUpperCase() === 'OK';
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${passed ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'}`}
    >
      {passed ? t('SCAN.STATUS_PASS') : t('SCAN.STATUS_FAILED')}
    </span>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const repositoriesQuery = useRepositories();
  const scansQuery = useScanHistory();
  const issuesQuery = useIssues();

  const repos = useMemo(() => repositoriesQuery.data ?? [], [repositoriesQuery.data]);
  const scans = useMemo(() => scansQuery.data ?? [], [scansQuery.data]);
  const issues = useMemo(() => issuesQuery.data ?? [], [issuesQuery.data]);

  const coverageTrend = useMemo(
    () => buildDailyTrend(scans, (scan) => scan.metrics?.coverage, 30),
    [scans],
  );

  const openIssues = issues.filter((issue) => OPEN_STATUSES.has(issue.status)).length;
  const resolvedIssues = issues.filter((issue) => RESOLVED_STATUSES.has(issue.status)).length;

  const metrics = useMemo(() => {
    let bugs = 0;
    let vulnerabilities = 0;
    let codeSmells = 0;
    let coverageSum = 0;
    let coverageCount = 0;
    for (const repo of repos) {
      bugs += repo.metrics?.bugs ?? 0;
      vulnerabilities += repo.metrics?.vulnerabilities ?? 0;
      codeSmells += repo.metrics?.codeSmells ?? 0;
      if (repo.metrics?.coverage != null) {
        coverageSum += repo.metrics.coverage;
        coverageCount += 1;
      }
    }
    return {
      bugs,
      vulnerabilities,
      codeSmells,
      coverage: coverageCount ? Math.round((coverageSum / coverageCount) * 10) / 10 : 0,
    };
  }, [repos]);

  const qualityGate = useMemo(() => {
    const passed = repos.filter((repo) => repo.qualityGate === 'Passed').length;
    const failed = repos.filter((repo) => repo.qualityGate === 'Failed').length;
    return { passed, failed };
  }, [repos]);

  const projectTypes = useMemo(() => {
    const angular = repos.filter((repo) => repo.projectType === 'ANGULAR').length;
    const spring = repos.filter((repo) => repo.projectType === 'SPRING_BOOT').length;
    return [
      {
        label: t('REPOSITORY.TAB_ANGULAR'),
        value: angular,
        color: 'var(--color-primary)',
      },
      {
        label: t('REPOSITORY.TAB_SPRING'),
        value: spring,
        color: 'var(--color-accent)',
      },
    ];
  }, [repos, t]);

  const recentScans = scans.slice(0, 6);
  const topIssues = useMemo(
    () =>
      [...issues]
        .sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0))
        .slice(0, 5),
    [issues],
  );

  const metricCards = [
    {
      icon: Bug,
      label: t('DASHBOARD.BUGS'),
      value: metrics.bugs,
      tone: 'text-blocker',
    },
    {
      icon: ShieldAlert,
      label: t('DASHBOARD.SECURITY'),
      value: metrics.vulnerabilities,
      tone: 'text-major',
    },
    {
      icon: Sparkles,
      label: t('DASHBOARD.CODE_SMELLS'),
      value: metrics.codeSmells,
      tone: 'text-primary',
    },
    {
      icon: Gauge,
      label: t('DASHBOARD.COVERAGE'),
      value: `${metrics.coverage}%`,
      tone: 'text-success',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          {t('DASHBOARD.WELCOME_BACK')} {user?.username}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('DASHBOARD.WELCOME_TEXT')}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={FolderGit2}
          label={t('DASHBOARD.TOTAL_REPOSITORIES')}
          value={repos.length}
          tone="bg-primary-subtle text-primary"
        />
        <StatCard
          icon={ScanLine}
          label={t('DASHBOARD.TOTAL_SCANS')}
          value={scans.length}
          tone="bg-surface-2 text-fg"
        />
        <StatCard
          icon={Bug}
          label={t('DASHBOARD.OPEN_ISSUES')}
          value={openIssues}
          tone="bg-warning/12 text-warning"
        />
        <StatCard
          icon={CheckCircle2}
          label={t('DASHBOARD.RESOLVED_ISSUES')}
          value={resolvedIssues}
          tone="bg-success/12 text-success"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
            >
              <Icon size={18} className={card.tone} />
              <div>
                <p className="text-lg font-semibold text-fg">{card.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-faint">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">{t('DASHBOARD.RECENT_ACTIVITY')}</h2>
            <Link to="/scanhistory" className="text-xs font-medium text-primary hover:underline">
              {t('DASHBOARD.VIEW_ALL')}
            </Link>
          </div>
          {recentScans.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              {t('DASHBOARD.NO_RECENT_ACTIVITY')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentScans.map((scan) => (
                <li key={scan.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {scan.projectName || '—'}
                    </p>
                    <p className="text-xs text-faint">{formatDateTime(scan.startedAt)}</p>
                  </div>
                  <GradeChip scan={scan} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">{t('DASHBOARD.PROJECT_TYPES')}</h2>
          </div>
          {repos.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              {t('DASHBOARD.NO_PROJECT_DATA')}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              <DonutChart
                data={projectTypes}
                centerValue={String(repos.length)}
                centerLabel={t('DASHBOARD.PROJECTS')}
              />
              <div className="flex w-full flex-col gap-2">
                {projectTypes.map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: segment.color }}
                      />
                      {segment.label}
                    </span>
                    <span className="font-medium text-fg">{segment.value}</span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="flex items-center gap-1.5 text-muted">
                    <CheckCircle2 size={14} className="text-success" />
                    {t('DASHBOARD.QUALITY_GATE')}
                  </span>
                  <span className="font-medium text-fg">
                    <span className="text-success">{qualityGate.passed}</span>
                    <span className="text-faint"> / </span>
                    <span className="text-danger">{qualityGate.failed}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('DASHBOARD.QUALITY_TRENDS')}</h2>
          <p className="text-xs text-muted">{t('DASHBOARD.TREND_SUBTITLE')}</p>
        </div>
        <div className="px-5 py-4">
          {scansQuery.isPending ? (
            <div className="h-56 animate-pulse rounded-lg bg-surface-2" />
          ) : (
            <LineChart
              series={[
                {
                  name: t('DASHBOARD.TREND_COVERAGE'),
                  color: 'var(--color-primary)',
                  points: coverageTrend,
                },
              ]}
              suffix="%"
              maxValue={100}
              emptyLabel={t('DASHBOARD.TREND_EMPTY')}
            />
          )}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('DASHBOARD.TOP_ISSUES')}</h2>
          <Link to="/issue" className="text-xs font-medium text-primary hover:underline">
            {t('DASHBOARD.VIEW_ALL')}
          </Link>
        </div>
        {topIssues.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            {t('DASHBOARD.NO_ISSUES_FOUND')}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {topIssues.map((issue) => (
              <li key={issue.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[issue.severity] ?? 'bg-faint'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg" title={issue.message}>
                    {issue.message || '—'}
                  </p>
                  <p className="truncate font-mono text-xs text-faint">{issue.component}</p>
                </div>
                <Link
                  to={`/issuedetail/${issue.id}`}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  {t('DASHBOARD.NOTI_VIEW_DETAILS')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
