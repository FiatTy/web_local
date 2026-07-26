import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  Clock,
  FileText,
  Layers,
  Loader2,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { BarList } from '@/components/charts/BarList';
import { LineChart } from '@/components/charts/LineChart';
import { ActionPlanModal } from '@/features/analytics/components/ActionPlanModal';
import { buildMonthlyTrend } from '@/features/scan/lib/scan-trends';
import { useScanHistory } from '@/features/scan/hooks/useScanHistory';
import { useRepositories } from '@/features/repository/hooks/useRepositories';
import {
  computeDebtCategories,
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

const CATEGORY_COLORS = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-major)',
  'var(--color-info)',
  'var(--color-critical)',
];

export function TechnicalDebtPage() {
  const { t } = useTranslation();
  const scansQuery = useScanHistory();
  const repositoriesQuery = useRepositories();

  const scans = useMemo(() => scansQuery.data ?? [], [scansQuery.data]);
  const projectDebts = useMemo(
    () => computeProjectDebts(scans, repositoriesQuery.data ?? []),
    [scans, repositoriesQuery.data],
  );
  const totalDebt = useMemo(() => computeTotalDebt(projectDebts), [projectDebts]);
  const categories = useMemo(() => computeDebtCategories(scans), [scans]);
  const topItems = useMemo(() => computeTopDebtItems(projectDebts), [projectDebts]);

  const debtTrend = useMemo(
    () =>
      buildMonthlyTrend(
        scans,
        (scan) =>
          scan.metrics?.technicalDebtMinutes != null
            ? Math.round((scan.metrics.technicalDebtMinutes / (60 * 8)) * 10) / 10
            : null,
        6,
      ),
    [scans],
  );

  const actionPlan = useMemo(
    () =>
      topItems
        .map(
          (item, index) =>
            `${index + 1}. [${item.priority}] ${item.name} - Owner: <assign>, ETA: <date>`,
        )
        .join('\n'),
    [topItems],
  );

  const [showActionPlan, setShowActionPlan] = useState(false);

  const isLoading = scansQuery.isLoading || repositoriesQuery.isLoading;
  const headCell =
    'px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        {t('COMMON.LOADING')}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('TECHNICAL_DEBT.TITLE')}
        actions={
          <Link
            to="/generatereport"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <FileText size={15} />
            {t('TECHNICAL_DEBT.GENERATE_DEBT_REPORT')}
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              {t('TECHNICAL_DEBT.TOTAL_DEBT')}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/12 text-warning">
              <Clock size={16} />
            </span>
          </div>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold tracking-tight text-fg">
            {totalDebt.days}
            <span className="text-sm font-normal text-muted">{t('TECHNICAL_DEBT.DAYS')}</span>
            {totalDebt.hours}
            <span className="text-sm font-normal text-muted">{t('TECHNICAL_DEBT.HOURS')}</span>
            {totalDebt.minutes}
            <span className="text-sm font-normal text-muted">{t('TECHNICAL_DEBT.MINUTES')}</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
              {t('TECHNICAL_DEBT.ESTIMATED_COST')}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Wallet size={16} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-fg">
            {formatThb(totalDebt.cost)}
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <TrendingDown size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-fg">
              {t('TECHNICAL_DEBT.DEBT_DISTRIBUTION_BY_PROJECT')}
            </h2>
          </div>
          <div className="px-5 py-5">
            <BarList
              items={projectDebts.map((project) => ({
                label: project.name,
                value: project.cost,
                display: formatThb(project.cost),
              }))}
              emptyLabel={t('ANALYTICS.NO_TECHNICAL_DEBT_FOUND')}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Layers size={15} className="text-accent" />
            <h2 className="text-sm font-semibold text-fg">
              {t('TECHNICAL_DEBT.DEBT_BY_CATEGORY')}
            </h2>
          </div>
          <div className="px-5 py-5">
            <BarList
              items={categories.map((category, index) => ({
                label: t(category.labelKey),
                value: category.percent,
                display: `${category.percent}%`,
                color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
              }))}
              emptyLabel={t('COMMON.NO_DATA')}
            />
          </div>
        </section>
      </div>

      <section className="mb-4 rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('TECHNICAL_DEBT.TREND_TITLE')}</h2>
          <p className="text-xs text-muted">{t('TECHNICAL_DEBT.DEBT_TREND_MONTHLY')}</p>
        </div>
        <div className="px-5 py-4">
          {isLoading ? (
            <div className="h-56 animate-pulse rounded-lg bg-surface-2" />
          ) : (
            <LineChart
              series={[
                {
                  name: t('TECHNICAL_DEBT.TREND_TITLE'),
                  color: 'var(--color-accent)',
                  points: debtTrend,
                },
              ]}
              emptyLabel={t('TECHNICAL_DEBT.TREND_EMPTY')}
            />
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('TECHNICAL_DEBT.TOP_DEBT_PROJECT')}</h2>
          <button
            type="button"
            onClick={() => setShowActionPlan(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <ClipboardList size={14} className="text-muted" />
            {t('TECHNICAL_DEBT.ACTION_PLAN')}
          </button>
        </div>
        {topItems.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted">
            {t('ANALYTICS.NO_TECHNICAL_DEBT_FOUND')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">{t('TECHNICAL_DEBT.TABLE_CAPTION')}</caption>
              <thead>
                <tr className="border-b border-border">
                  <th className={headCell}>{t('TECHNICAL_DEBT.COL_PRIORITY')}</th>
                  <th className={headCell}>{t('TECHNICAL_DEBT.COL_PROJECT')}</th>
                  <th className={headCell}>{t('TECHNICAL_DEBT.COL_TIME')}</th>
                  <th className={`${headCell} text-right`}>{t('TECHNICAL_DEBT.COL_COST')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topItems.map((item) => (
                  <tr key={item.projectId} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          PRIORITY_BADGE[item.priority]
                        }`}
                      >
                        {t(PRIORITY_LABEL[item.priority])}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/detailrepo/${item.projectId}`}
                        className="truncate text-fg hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      {formatDebtTime(item.minutes)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs font-medium text-fg">
                      {formatThb(item.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showActionPlan ? (
        <ActionPlanModal plan={actionPlan} onClose={() => setShowActionPlan(false)} />
      ) : null}
    </div>
  );
}
