import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Loader2,
  ShieldAlert,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { BarList } from '@/components/charts/BarList';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { useSecurityMetrics } from '@/features/security/hooks/useSecurityMetrics';
import { useScanHistory } from '@/features/scan/hooks/useScanHistory';
import { buildRecentScanTrend } from '@/features/scan/lib/scan-trends';
import type { OwaspCategory } from '@/features/security/types';

const SEVERITY_COLOR: Record<string, string> = {
  Critical: 'var(--color-critical)',
  High: 'var(--color-major)',
  Medium: 'var(--color-minor)',
  Low: 'var(--color-info)',
};

const SEVERITY_LABEL: Record<string, string> = {
  Critical: 'SECURITY_DASHBOARD.SEVERITY_CRITICAL',
  High: 'SECURITY_DASHBOARD.SEVERITY_HIGH',
  Medium: 'SECURITY_DASHBOARD.SEVERITY_MEDIUM',
  Low: 'SECURITY_DASHBOARD.SEVERITY_LOW',
};

const RISK_LABEL: Record<string, string> = {
  SAFE: 'SECURITY_DASHBOARD.RISK_SAFE',
  LOW: 'SECURITY_DASHBOARD.RISK_LOW',
  MEDIUM: 'SECURITY_DASHBOARD.RISK_MEDIUM',
  HIGH: 'SECURITY_DASHBOARD.RISK_HIGH',
  CRITICAL: 'SECURITY_DASHBOARD.RISK_CRITICAL',
};

const RISK_TONE: Record<string, string> = {
  SAFE: 'bg-success/12 text-success',
  LOW: 'bg-success/12 text-success',
  MEDIUM: 'bg-warning/12 text-warning',
  HIGH: 'bg-danger/12 text-danger',
  CRITICAL: 'bg-danger/12 text-danger',
};

const OWASP_TONE: Record<OwaspCategory['status'], string> = {
  pass: 'text-success',
  warning: 'text-warning',
  fail: 'text-danger',
};

function OwaspIcon({ status }: { status: OwaspCategory['status'] }) {
  if (status === 'pass') return <CheckCircle2 size={14} className={OWASP_TONE.pass} />;
  if (status === 'warning') return <TriangleAlert size={14} className={OWASP_TONE.warning} />;
  return <XCircle size={14} className={OWASP_TONE.fail} />;
}

export function SecurityDashboardPage() {
  const { t } = useTranslation();
  const metricsQuery = useSecurityMetrics();
  const scansQuery = useScanHistory();

  const scans = useMemo(() => scansQuery.data ?? [], [scansQuery.data]);
  const vulnerabilityTrend = useMemo(
    () => buildRecentScanTrend(scans, (scan) => scan.metrics?.vulnerabilities, 12),
    [scans],
  );
  const hotspotTrend = useMemo(
    () => buildRecentScanTrend(scans, (scan) => scan.metrics?.securityHotspots, 12),
    [scans],
  );

  const metrics = metricsQuery.data;
  const vulnerabilities = useMemo(() => metrics?.vulnerabilities ?? [], [metrics]);
  const totalVulnerabilities = vulnerabilities.reduce((sum, item) => sum + item.count, 0);
  const riskKey = (metrics?.riskLevel ?? 'SAFE').toUpperCase();

  if (metricsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        {t('COMMON.LOADING')}
      </div>
    );
  }

  if (metricsQuery.isError || !metrics) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
        <TriangleAlert size={16} className="mt-0.5 shrink-0" />
        <p>{t('COMMON.ERROR')}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('SECURITY_DASHBOARD.TITLE')}
        actions={
          <Link
            to="/issue"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            {t('SECURITY_DASHBOARD.VIEW_ALL_ISSUES')}
            <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              {t('SECURITY_DASHBOARD.SECURITY_SCORE')}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <ShieldAlert size={16} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-fg">{metrics.score}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
            {t('SECURITY_DASHBOARD.RISK_LEVEL')}
          </span>
          <p className="mt-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                RISK_TONE[riskKey] ?? 'bg-surface-2 text-muted'
              }`}
            >
              {t(RISK_LABEL[riskKey] ?? 'SECURITY_DASHBOARD.RISK_SAFE')}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface lg:col-span-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">
              {t('SECURITY_DASHBOARD.VULNERABILITIES_BY_SEVERITY')}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {t('SECURITY_DASHBOARD.TOTAL_VULNERABILITIES', {
                count: totalVulnerabilities,
              })}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 px-5 py-6">
            <DonutChart
              data={vulnerabilities.map((item) => ({
                label: t(SEVERITY_LABEL[item.severity] ?? item.severity),
                value: item.count,
                color: SEVERITY_COLOR[item.severity] ?? 'var(--color-faint)',
              }))}
              centerValue={String(totalVulnerabilities)}
              centerLabel={t('DETAIL_REPO.VULNERABILITIES')}
            />
            <div className="flex w-full flex-col gap-2">
              {vulnerabilities.map((item) => (
                <div key={item.severity} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        background: SEVERITY_COLOR[item.severity] ?? 'var(--color-faint)',
                      }}
                    />
                    {t(SEVERITY_LABEL[item.severity] ?? item.severity)}
                  </span>
                  <span className="font-medium text-fg">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface lg:col-span-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">
              {t('SECURITY_DASHBOARD.OWASP_COVERAGE')}
            </h2>
          </div>
          {metrics.owaspCoverage.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">{t('COMMON.NO_DATA')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {metrics.owaspCoverage.map((category) => (
                <li key={category.name} className="flex items-center gap-3 px-5 py-3">
                  <OwaspIcon status={category.status} />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">{category.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">{category.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Flame size={15} className="text-danger" />
            <h2 className="text-sm font-semibold text-fg">
              {t('SECURITY_DASHBOARD.HOT_SECURITY_ISSUES')}
            </h2>
          </div>
          <div className="px-5 py-5">
            <BarList
              items={metrics.hotIssues.map((issue) => ({
                label: issue.name,
                value: issue.count,
                color: 'var(--color-critical)',
              }))}
              emptyLabel={t('SECURITY_DASHBOARD.NO_HOT_ISSUES')}
            />
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('SECURITY_DASHBOARD.TREND_TITLE')}</h2>
          <p className="text-xs text-muted">{t('SECURITY_DASHBOARD.TREND_SUBTITLE')}</p>
        </div>
        <div className="px-5 py-4">
          {scansQuery.isPending ? (
            <div className="h-56 animate-pulse rounded-lg bg-surface-2" />
          ) : (
            <>
              <LineChart
                series={[
                  {
                    name: t('SECURITY_DASHBOARD.TREND_VULNERABILITIES'),
                    color: 'var(--color-danger)',
                    points: vulnerabilityTrend,
                  },
                  {
                    name: t('SECURITY_DASHBOARD.TREND_HOTSPOTS'),
                    color: 'var(--color-warning)',
                    points: hotspotTrend,
                  },
                ]}
                emptyLabel={t('SECURITY_DASHBOARD.TREND_EMPTY')}
              />
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  {t('SECURITY_DASHBOARD.TREND_VULNERABILITIES')}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  {t('SECURITY_DASHBOARD.TREND_HOTSPOTS')}
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
