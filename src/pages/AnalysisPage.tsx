import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, Flame, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { BarList } from '@/components/charts/BarList';
import { useSecurityMetrics } from '@/features/security/hooks/useSecurityMetrics';
import { useScanHistory } from '@/features/scan/hooks/useScanHistory';
import { useRepositories } from '@/features/repository/hooks/useRepositories';
import {
  computeProjectDebts,
  computeTopDebtItems,
  computeTotalDebt,
  formatDebtTime,
  formatThb,
} from '@/features/analytics/lib/technical-debt';

const PRIORITY_BADGE: Record<string, string> = {
  High: 'bg-danger/12 text-danger',
  Med: 'bg-warning/12 text-warning',
  Low: 'bg-success/12 text-success',
};

const PRIORITY_LABEL: Record<string, string> = {
  High: 'ANALYTICS.PRIORITY_HIGH',
  Med: 'ANALYTICS.PRIORITY_MED',
  Low: 'ANALYTICS.PRIORITY_LOW',
};

export function AnalysisPage() {
  const { t } = useTranslation();
  const metricsQuery = useSecurityMetrics();
  const scansQuery = useScanHistory();
  const repositoriesQuery = useRepositories();

  const projectDebts = useMemo(
    () => computeProjectDebts(scansQuery.data ?? [], repositoriesQuery.data ?? []),
    [scansQuery.data, repositoriesQuery.data],
  );
  const totalDebt = useMemo(() => computeTotalDebt(projectDebts), [projectDebts]);
  const topDebtItems = useMemo(() => computeTopDebtItems(projectDebts), [projectDebts]);

  const totalDebtMinutes = totalDebt.days * 480 + totalDebt.hours * 60 + totalDebt.minutes;
  const securityScore = metricsQuery.data?.score ?? 0;
  const hotIssues = metricsQuery.data?.hotIssues ?? [];

  return (
    <div>
      <PageHeader title={t('ANALYTICS.TITLE')} subtitle={t('ANALYTICS.QUALITY_OVERVIEW')} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Link
          to="/security-dashboard"
          className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              {t('ANALYTICS.SECURITY_SCORE')}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <ShieldCheck size={16} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-fg">{securityScore}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            {t('ANALYTICS.VIEW_DETAILS')}
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          to="/technical-debt"
          className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              {t('ANALYTICS.TECHNICAL_DEBT')}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/12 text-warning">
              <Clock size={16} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-fg">
            {formatDebtTime(totalDebtMinutes)}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            {t('ANALYTICS.VIEW_DETAILS')}
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Flame size={15} className="text-danger" />
            <h2 className="text-sm font-semibold text-fg">{t('ANALYTICS.TOP_SECURITY_ISSUES')}</h2>
          </div>
          <div className="px-5 py-5">
            <BarList
              items={hotIssues.map((issue) => ({
                label: issue.name,
                value: issue.count,
                color: 'var(--color-critical)',
              }))}
              emptyLabel={t('ANALYTICS.NO_SECURITY_ISSUES_FOUND')}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Clock size={15} className="text-warning" />
            <h2 className="text-sm font-semibold text-fg">{t('ANALYTICS.TOP_TECHNICAL_DEBT')}</h2>
          </div>
          {topDebtItems.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              {t('ANALYTICS.NO_TECHNICAL_DEBT_FOUND')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {topDebtItems.map((item) => (
                <li key={item.projectId} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      PRIORITY_BADGE[item.priority]
                    }`}
                  >
                    {t(PRIORITY_LABEL[item.priority])}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg" title={item.name}>
                    {item.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {formatDebtTime(item.minutes)}
                  </span>
                  <span className="shrink-0 font-mono text-xs font-medium text-fg">
                    {formatThb(item.cost)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
