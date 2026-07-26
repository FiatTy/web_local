import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  GitCompare,
  Loader2,
  RefreshCw,
  ScanLine,
  ScrollText,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SkeletonTable } from '@/components/common/Skeleton';
import { ScanCompareModal } from '@/features/scan/components/ScanCompareModal';
import { useScanHistory } from '@/features/scan/hooks/useScanHistory';
import type { Scan } from '@/features/scan/types';

const PAGE_SIZE = 8;
type StatusFilter = 'all' | 'SUCCESS' | 'FAILED' | 'PENDING';

function formatDateTime(value?: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function issuesCount(scan: Scan): number {
  const metrics = scan.metrics;
  if (!metrics) {
    return 0;
  }
  return (metrics.bugs ?? 0) + (metrics.vulnerabilities ?? 0) + (metrics.codeSmells ?? 0);
}

function withinDate(value: string, start: string, end: string): boolean {
  if (!start && !end) {
    return true;
  }
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return false;
  }
  if (start && time < new Date(start).getTime()) {
    return false;
  }
  if (end && time > new Date(end).getTime() + 24 * 60 * 60 * 1000) {
    return false;
  }
  return true;
}

function GradeChip({ scan }: { scan: Scan }) {
  const { t } = useTranslation();
  if (scan.status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2.5 py-1 text-[11px] font-medium text-primary">
        <Loader2 size={11} className="animate-spin" />
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
        passed ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'
      }`}
    >
      {passed ? t('SCAN.STATUS_PASS') : t('SCAN.STATUS_FAILED')}
    </span>
  );
}

export function ScanHistoryPage() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch, isFetching } = useScanHistory();

  const [project, setProject] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const scans = useMemo(() => data ?? [], [data]);

  const projects = useMemo(
    () => Array.from(new Set(scans.map((scan) => scan.projectName).filter(Boolean))).sort(),
    [scans],
  );

  const filtered = useMemo(
    () =>
      scans.filter((scan) => {
        if (project !== 'all' && scan.projectName !== project) return false;
        if (status !== 'all' && scan.status !== status) return false;
        if (!withinDate(scan.startedAt, startDate, endDate)) return false;
        return true;
      }),
    [scans, project, status, startDate, endDate],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectedScans = useMemo(
    () => scans.filter((scan) => selectedIds.includes(scan.id)),
    [scans, selectedIds],
  );

  function resetFilters() {
    setProject('all');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setSelectedIds([]);
    setPage(1);
  }

  function toggleSelected(scanId: string) {
    setSelectedIds((current) =>
      current.includes(scanId)
        ? current.filter((id) => id !== scanId)
        : current.length >= 3
          ? current
          : [...current, scanId],
    );
  }

  const selectClass =
    'h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25';

  return (
    <div>
      <PageHeader title={t('SCAN.TITLE')} subtitle={t('SCAN.SUBTITLE')} />

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
            {t('SCAN.PROJECT')}
          </span>
          <select
            value={project}
            onChange={(event) => {
              setProject(event.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">{t('SCAN.ALL_PROJECTS')}</option>
            {projects.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
            {t('SCAN.SCAN_STATUS')}
          </span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">{t('SCAN.ALL')}</option>
            <option value="SUCCESS">{t('SCAN.COMPLETED')}</option>
            <option value="FAILED">{t('SCAN.FAILED')}</option>
            <option value="PENDING">{t('SCAN.PENDING')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
            {t('SCAN.START_DATE')}
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
            className={selectClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
            {t('SCAN.END_DATE')}
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
            className={selectClass}
          />
        </label>

        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <RefreshCw size={14} />
          {t('SCAN.CLEAR_FILTER')}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-faint">
            {selectedIds.length > 0
              ? t('SCAN.COMPARE_SELECTED', { count: selectedIds.length })
              : t('SCAN.COMPARE_HINT')}
          </span>
          <button
            type="button"
            onClick={() => setShowCompare(true)}
            disabled={selectedIds.length < 2}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitCompare size={14} />
            {t('SCAN.COMPARE_SCANS')}
          </button>
        </div>
      </div>

      {isPending ? (
        <SkeletonTable rows={6} columns={6} />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 text-center">
          <AlertTriangle size={28} className="text-danger" />
          <p className="mt-3 text-sm text-muted">{t('COMMON.ERROR')}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : undefined} />
            {t('COMMON.RESET')}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <ScanLine size={30} className="text-faint" />
          <h3 className="mt-4 text-sm font-semibold text-fg">{t('SCAN.NO_SCANS_FOUND')}</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">{t('SCAN.NO_SCANS_FOUND_DESC')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50 text-left">
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">{t('SCAN.COL_SELECT')}</span>
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_DATE_TIME')}
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_PROJECT')}
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_GRADE')}
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_ISSUES')}
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_LOG')}
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_RESULT')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`${t('SCAN.COL_SELECT')} ${scan.projectName}`}
                        checked={selectedIds.includes(scan.id)}
                        disabled={!selectedIds.includes(scan.id) && selectedIds.length >= 3}
                        onChange={() => toggleSelected(scan.id)}
                        className="h-4 w-4 cursor-pointer accent-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatDateTime(scan.startedAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-fg">{scan.projectName || '—'}</td>
                    <td className="px-4 py-3">
                      <GradeChip scan={scan} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-fg">
                      {issuesCount(scan)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/logviewer/${scan.id}`}
                        title={t('SCAN.VIEW_LOG_TOOLTIP')}
                        aria-label={t('SCAN.VIEW_LOG_TOOLTIP')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                      >
                        <ScrollText size={15} />
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/scanresult/${scan.id}`}
                        title={t('SCAN.VIEW_RESULT_TOOLTIP')}
                        aria-label={t('SCAN.VIEW_RESULT_TOOLTIP')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary-subtle"
                      >
                        <FileBarChart size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted">
              {t('SCAN.PAGE_INFO', { current: currentPage, total: totalPages })}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompare && selectedScans.length >= 2 ? (
        <ScanCompareModal scans={selectedScans} onClose={() => setShowCompare(false)} />
      ) : null}
    </div>
  );
}
