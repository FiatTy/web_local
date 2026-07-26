import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Loader2, Search, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { FIELD_INPUT_CLASS } from '@/components/common/FormField';
import { useToast } from '@/lib/toast/toast-context';
import { useReportHistory, useGenerateReportPdf } from '@/features/report/hooks/useReports';
import { downloadBase64 } from '@/features/report/api/report.api';
import type { ReportHistoryEntry } from '@/features/report/types';

const PAGE_SIZE = 10;

function formatDateTime(value?: string): string {
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

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportHistoryPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const historyQuery = useReportHistory();
  const generatePdf = useGenerateReportPdf();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const reports = historyQuery.data ?? [];
    if (!keyword) {
      return reports;
    }
    return reports.filter((report) =>
      `${report.projectName} ${report.format} ${report.generatedBy}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [historyQuery.data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleDownload(report: ReportHistoryEntry) {
    if (report.format.toUpperCase() !== 'PDF') {
      showToast({
        tone: 'warning',
        title: t('REPORT_HISTORY.SNACKBAR.FORMAT_NOT_SUPPORTED'),
      });
      return;
    }
    setDownloadingId(report.id);
    try {
      const response = await generatePdf.mutateAsync({
        projectId: report.projectId,
        dateFrom: report.dateFrom,
        dateTo: report.dateTo,
        format: 'pdf',
        sections: {
          qualityGate: report.includeQualityGate,
          issueBreakdown: report.includeIssueBreakdown,
          securityAnalysis: report.includeSecurityAnalysis,
          technicalDebt: report.includeTechnicalDebt,
          recommendations: report.includeRecommendations,
        },
        generatedBy: report.generatedBy,
      });
      downloadBase64(response.base64, response.fileName, response.mimeType);
    } catch {
      showToast({
        tone: 'error',
        title: t('REPORT_HISTORY.SNACKBAR.DOWNLOAD_ERROR'),
      });
    } finally {
      setDownloadingId(null);
    }
  }

  const headCell =
    'px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint';

  return (
    <div>
      <PageHeader title={t('REPORT_HISTORY.TITLE')} subtitle={t('REPORT_HISTORY.SUBTITLE')} />

      <div className="mb-4 relative sm:max-w-xs">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="search"
          className={`${FIELD_INPUT_CLASS} pl-9`}
          placeholder={t('REPORT_HISTORY.SEARCH_PLACEHOLDER')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        {historyQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" />
            {t('REPORT_HISTORY.LOADING')}
          </div>
        ) : historyQuery.isError ? (
          <div className="flex items-start gap-2.5 px-5 py-10 text-sm text-danger">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <p>{t('COMMON.ERROR')}</p>
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            {t('REPORT_HISTORY.NO_REPORTS_FOUND')}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className={headCell}>{t('REPORT_HISTORY.PROJECT')}</th>
                    <th className={headCell}>{t('REPORT_HISTORY.DATE_RANGE')}</th>
                    <th className={headCell}>{t('REPORT_HISTORY.FORMAT')}</th>
                    <th className={headCell}>{t('REPORT_HISTORY.GENERATED_BY')}</th>
                    <th className={headCell}>{t('REPORT_HISTORY.GENERATED_AT')}</th>
                    <th className={`${headCell} text-right`}>{t('REPORT_HISTORY.EXPORT')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((report) => (
                    <tr key={report.id} className="transition-colors hover:bg-surface-2/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                            <FileText size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg">{report.projectName}</p>
                            <p className="font-mono text-[11px] text-faint">
                              {formatBytes(report.fileSizeBytes)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">
                        {report.dateFrom} {t('REPORT_HISTORY.TO')} {report.dateTo}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                          {report.format}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted">
                        {report.generatedBy}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted">
                        {formatDateTime(report.generatedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDownload(report)}
                          disabled={downloadingId === report.id}
                          title={t('REPORT_HISTORY.DOWNLOAD_FILE')}
                          aria-label={t('REPORT_HISTORY.DOWNLOAD_FILE')}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary-subtle disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {downloadingId === report.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Download size={15} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <span className="font-mono text-[11px] text-faint">
                {t('REPORT_HISTORY.PAGE')} {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('COMMON.PREVIOUS')}
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('COMMON.NEXT')}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
