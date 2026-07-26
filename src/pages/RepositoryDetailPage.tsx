import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Loader2,
  Settings2,
  ShieldAlert,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useRepositoryDetail } from '@/features/repository/hooks/useRepository';
import { useIssues } from '@/features/issue/hooks/useIssues';
import type { Scan } from '@/features/scan/types';

type DetailTab = 'overview' | 'issues' | 'history';

const ISSUE_PAGE_SIZE = 5;
const DETAIL_ISSUE_TYPES = new Set(['BUG', 'VULNERABILITY', 'SECURITY_HOTSPOT']);

const SEVERITY_DOT: Record<string, string> = {
  BLOCKER: 'bg-blocker',
  CRITICAL: 'bg-critical',
  MAJOR: 'bg-major',
  MINOR: 'bg-minor',
  INFO: 'bg-info',
};

const STATUS_BADGE: Record<string, string> = {
  Active: 'bg-success/12 text-success',
  Scanning: 'bg-primary-subtle text-primary',
  Error: 'bg-danger/12 text-danger',
};

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
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
      <p className="mt-3 text-2xl font-semibold tracking-tight text-fg">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      <span
        className={`min-w-0 truncate text-right text-sm text-fg ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function ScanGrade({ scan }: { scan: Scan }) {
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
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        passed ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'
      }`}
    >
      {passed ? t('DETAIL_REPO.PASSED') : t('DETAIL_REPO.FAILED')}
    </span>
  );
}

export function RepositoryDetailPage() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const detailQuery = useRepositoryDetail(projectId);
  const issuesQuery = useIssues();

  const [tab, setTab] = useState<DetailTab>('overview');
  const [page, setPage] = useState(1);

  const repo = detailQuery.data;
  const scans = useMemo(() => (repo?.scans ?? []).filter((scan) => scan.completedAt), [repo]);

  const issues = useMemo(
    () =>
      (issuesQuery.data ?? []).filter(
        (issue) => issue.projectId === projectId && DETAIL_ISSUE_TYPES.has(issue.type),
      ),
    [issuesQuery.data, projectId],
  );

  const totalPages = Math.max(1, Math.ceil(issues.length / ISSUE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedIssues = issues.slice(
    (currentPage - 1) * ISSUE_PAGE_SIZE,
    currentPage * ISSUE_PAGE_SIZE,
  );

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        {t('COMMON.LOADING')}
      </div>
    );
  }

  if (detailQuery.isError || !repo) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
        <TriangleAlert size={16} className="mt-0.5 shrink-0" />
        <p>{t('COMMON.ERROR')}</p>
      </div>
    );
  }

  const metrics = repo.metrics;
  const securityTotal = (metrics?.vulnerabilities ?? 0) + (metrics?.securityHotspots ?? 0);
  const qualityPassed = repo.qualityGate === 'Passed';

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'overview', label: t('DETAIL_REPO.TAB_OVERVIEW') },
    { key: 'issues', label: t('DETAIL_REPO.TAB_ISSUES') },
    { key: 'history', label: t('DETAIL_REPO.TAB_HISTORY') },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/repositories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft size={14} />
            {t('DETAIL_REPO.BACK_TOOLTIP')}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-fg">{repo.name}</h1>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                STATUS_BADGE[repo.status] ?? 'bg-surface-2 text-muted'
              }`}
            >
              {repo.status === 'Scanning'
                ? t('DETAIL_REPO.ANALYSIS_IN_PROGRESS')
                : t(`REPOSITORY.STATUS_${repo.status.toUpperCase()}`)}
            </span>
          </div>
          <a
            href={repo.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-muted hover:text-primary"
          >
            <span className="truncate">{repo.repositoryUrl}</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
        </div>
        <Link
          to={`/settingrepo/${repo.projectId}`}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
        >
          <Settings2 size={15} />
          {t('DETAIL_REPO.SETTINGS')}
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              {t('DETAIL_REPO.QUALITY_GATE')}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                repo.qualityGate
                  ? qualityPassed
                    ? 'bg-success/12 text-success'
                    : 'bg-danger/12 text-danger'
                  : 'bg-surface-2 text-muted'
              }`}
            >
              {repo.qualityGate ? (
                qualityPassed ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <XCircle size={16} />
                )
              ) : (
                <Gauge size={16} />
              )}
            </span>
          </div>
          <p
            className={`mt-3 text-2xl font-semibold tracking-tight ${
              repo.qualityGate ? (qualityPassed ? 'text-success' : 'text-danger') : 'text-fg'
            }`}
          >
            {repo.qualityGate
              ? qualityPassed
                ? t('DETAIL_REPO.PASSED')
                : t('DETAIL_REPO.FAILED')
              : '—'}
          </p>
        </div>
        <MetricCard
          icon={Bug}
          label={t('DETAIL_REPO.BUGS')}
          value={String(metrics?.bugs ?? 0)}
          tone="bg-blocker/12 text-blocker"
        />
        <MetricCard
          icon={ShieldAlert}
          label={t('DETAIL_REPO.SECURITY')}
          value={String(securityTotal)}
          tone="bg-major/12 text-major"
        />
        <MetricCard
          icon={Gauge}
          label={t('DETAIL_REPO.COVERAGE')}
          value={metrics?.coverage != null ? `${metrics.coverage}%` : '—'}
          tone="bg-primary-subtle text-primary"
        />
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-0.5">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`h-9 rounded-md px-4 text-sm font-medium transition ${
              tab === item.key ? 'bg-primary-subtle text-primary' : 'text-muted hover:text-fg'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('REPOSITORY.PROJECT_DETAILS')}
            </p>
            <div className="mt-2">
              <InfoRow label={t('REPOSITORY.PROJECT_TYPE')} value={repo.projectTypeLabel ?? '—'} />
              <InfoRow
                label={t('DETAIL_REPO.SONAR_PROJECT_KEY')}
                value={repo.sonarProjectKey ?? '—'}
                mono
              />
              <InfoRow
                label={t('DETAIL_REPO.COST_PER_DAY')}
                value={repo.costPerDay != null ? repo.costPerDay.toLocaleString() : '—'}
              />
              <InfoRow
                label={t('DETAIL_REPO.LAST_ANALYSIS')}
                value={formatDateTime(repo.lastScan)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('DETAIL_REPO.LATEST_METRICS')}
            </p>
            <div className="mt-2">
              <InfoRow label={t('DETAIL_REPO.BUGS')} value={String(metrics?.bugs ?? 0)} />
              <InfoRow
                label={t('DETAIL_REPO.VULNERABILITIES')}
                value={String(metrics?.vulnerabilities ?? 0)}
              />
              <InfoRow
                label={t('DETAIL_REPO.SECURITY_HOTSPOTS')}
                value={String(metrics?.securityHotspots ?? 0)}
              />
              <InfoRow
                label={t('DASHBOARD.CODE_SMELLS')}
                value={String(metrics?.codeSmells ?? 0)}
              />
              <InfoRow
                label={t('DETAIL_REPO.COVERAGE')}
                value={metrics?.coverage != null ? `${metrics.coverage}%` : '—'}
              />
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'issues' ? (
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          {paginatedIssues.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm text-muted">
              {t('DETAIL_REPO.NO_ISSUES_FOUND')}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        'DETAIL_REPO.COL_TYPE',
                        'DETAIL_REPO.COL_MESSAGE',
                        'DETAIL_REPO.COL_SEVERITY',
                        'DETAIL_REPO.COL_STATUS',
                        'DETAIL_REPO.COL_ASSIGNEE',
                      ].map((key) => (
                        <th
                          key={key}
                          className="px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint"
                        >
                          {t(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedIssues.map((issue) => (
                      <tr key={issue.id} className="transition-colors hover:bg-surface-2/50">
                        <td className="px-5 py-3 font-mono text-[11px] uppercase tracking-wide text-muted">
                          {issue.type.replace(/_/g, ' ')}
                        </td>
                        <td className="max-w-md px-5 py-3">
                          <Link
                            to={`/issuedetail/${issue.id}`}
                            className="block truncate text-fg hover:text-primary"
                            title={issue.message}
                          >
                            {issue.message}
                          </Link>
                          <p className="truncate font-mono text-[11px] text-faint">
                            {issue.component}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                            <span
                              className={`h-2 w-2 rounded-full ${SEVERITY_DOT[issue.severity] ?? 'bg-faint'}`}
                            />
                            {issue.severity}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted">
                          {issue.status.replace(/_/g, ' ')}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted">
                          {issue.assignedName || t('DETAIL_REPO.UNASSIGNED')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <span className="font-mono text-[11px] text-faint">
                  {t('DETAIL_REPO.PAGE_INFO', {
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('DETAIL_REPO.PREVIOUS')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('DETAIL_REPO.NEXT')}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === 'history' ? (
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          {scans.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm text-muted">
              {t('DETAIL_REPO.NO_SCAN_HISTORY')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      'DETAIL_REPO.COL_DATE',
                      'DETAIL_REPO.COL_METRICS',
                      'DETAIL_REPO.QUALITY_GATE',
                    ].map((key) => (
                      <th
                        key={key}
                        className="px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint"
                      >
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="transition-colors hover:bg-surface-2/50">
                      <td className="px-5 py-3 text-fg">
                        <Link to={`/scanresult/${scan.id}`} className="hover:text-primary">
                          {formatDateTime(scan.completedAt ?? scan.startedAt)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {scan.metrics
                          ? `${scan.metrics.bugs ?? 0} / ${scan.metrics.vulnerabilities ?? 0} / ${
                              scan.metrics.coverage ?? 0
                            }%`
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <ScanGrade scan={scan} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
