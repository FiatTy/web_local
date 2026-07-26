import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bug,
  Download,
  Gauge,
  Loader2,
  Mail,
  Printer,
  ShieldAlert,
  Sparkles,
  Terminal,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import { GateStatus } from '@/components/common/GateStatus';
import { useScan, useSendScanReportEmail } from '@/features/scan/hooks/useScan';
import { useSonarQubeConfig } from '@/features/setting/hooks/useSonarQubeConfig';
import {
  formatDateTime,
  formatDuration,
  hotspotReviewRating,
  ratingTone,
} from '@/features/scan/lib/scan-rating';
import type { ScanDetail } from '@/features/scan/types';
import type { Issue } from '@/features/issue/types';

const PAGE_SIZE = 5;

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'LOG_VIEWER.SCANNING',
  SUCCESS: 'LOG_VIEWER.SUCCESS',
  FAILED: 'LOG_VIEWER.STATUS_FAILED',
};

function resolveScannerType(projectType?: string, buildTool?: string): string {
  if (projectType === 'SPRING_BOOT') {
    return buildTool === 'gradle' ? 'gradle sonar' : 'mvn sonar';
  }
  return 'npm sonar';
}

function MetricTile({
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

function IssueTable({ title, issues, tone }: { title: string; issues: Issue[]; tone: string }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(issues.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = issues.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className={`h-2 w-2 rounded-full ${tone}`} />
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">{t('COMMON.NO_DATA')}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    'LOG_VIEWER.COL_HASH',
                    'LOG_VIEWER.COL_MESSAGE',
                    'LOG_VIEWER.COL_COMPONENT',
                    'LOG_VIEWER.COL_LINE',
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
                {rows.map((issue, index) => (
                  <tr key={issue.id} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-5 py-3 font-mono text-xs text-faint">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="max-w-[16rem] px-5 py-3">
                      <span className="block truncate text-fg" title={issue.message}>
                        {issue.message}
                      </span>
                    </td>
                    <td className="max-w-[10rem] px-5 py-3">
                      <span
                        className="block truncate font-mono text-xs text-muted"
                        title={issue.component}
                      >
                        {issue.component}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{issue.line ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="font-mono text-[11px] text-faint">
              {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('LOG_VIEWER.PREV')}
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('LOG_VIEWER.NEXT')}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function buildMarkdown(scan: ScanDetail, scannerType: string): string {
  const metrics = scan.metrics;
  const value = (input: unknown) => (input === null || input === undefined ? '-' : String(input));
  const qualityGate =
    scan.qualityGate === 'OK'
      ? 'Passed'
      : scan.qualityGate === 'ERROR'
        ? 'Failed'
        : (scan.qualityGate ?? '-');
  const durationSeconds =
    scan.startedAt && scan.completedAt
      ? (
          (new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) /
          1000
        ).toFixed(2)
      : '-';
  const details =
    scan.analysisLogs.length > 0
      ? scan.analysisLogs
          .map((log) => `- ${log.message} (${log.timestamp ? formatDateTime(log.timestamp) : ''})`)
          .join('\n')
      : 'No analysis logs available.';

  return `# Scan Report: ${scan.projectName || '-'}
## Date: ${formatDateTime(scan.startedAt)}

### Execution Summary
- **Status**: ${scan.status ?? '-'}
- **Duration**: ${durationSeconds} seconds
- **Scanner Type**: ${scannerType}

### SonarQube Results
- **Quality Gate**: ${qualityGate}
- **Coverage**: ${value(metrics?.coverage)}%
- **Bugs**: ${value(metrics?.bugs)}
- **Vulnerabilities**: ${value(metrics?.vulnerabilities)}
- **Security Hotspots**: ${value(metrics?.securityHotspots)} (Rating: ${hotspotReviewRating(scan)})
- **Code Smells**: ${value(metrics?.codeSmells)}

### Details Analysis
${details}
`;
}

function wrapAsPre(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return `<pre style="white-space: pre-wrap; font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace;">\n${escaped}\n</pre>`;
}

export function LogViewerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const scanQuery = useScan(scanId);
  const configQuery = useSonarQubeConfig();
  const sendEmail = useSendScanReportEmail();

  const scan = scanQuery.data;
  const metrics = scan?.metrics;
  const isPending = scan?.status === 'PENDING';

  const scannerType = resolveScannerType(scan?.projectType, configQuery.data?.springBuildTool);

  const grouped = useMemo(() => {
    const major: Issue[] = [];
    const critical: Issue[] = [];
    for (const issue of scan?.issues ?? []) {
      if (issue.type === 'CODE_SMELL') {
        continue;
      }
      if (issue.severity === 'MAJOR') major.push(issue);
      if (issue.severity === 'CRITICAL') critical.push(issue);
    }
    return { major, critical };
  }, [scan]);

  const gates = useMemo(() => {
    const hotspot = hotspotReviewRating(scan);
    return [
      {
        labelKey: 'LOG_VIEWER.RELIABILITY_RATING',
        grade: metrics?.reliabilityRating ?? '-',
        tone: ratingTone(metrics?.reliabilityRating, isPending),
      },
      {
        labelKey: 'LOG_VIEWER.SECURITY_RATING',
        grade: metrics?.securityRating ?? '-',
        tone: ratingTone(metrics?.securityRating, isPending),
      },
      {
        labelKey: 'LOG_VIEWER.MAINTAINABILITY_RATING',
        grade: metrics?.maintainabilityRating ?? '-',
        tone: ratingTone(metrics?.maintainabilityRating, isPending),
      },
      {
        labelKey: 'LOG_VIEWER.SECURITY_HOTSPOT_RATING',
        grade: hotspot,
        tone: ratingTone(hotspot, isPending),
      },
    ];
  }, [metrics, scan, isPending]);

  function handleDownload() {
    if (!scan) {
      return;
    }
    const blob = new Blob([buildMarkdown(scan, scannerType)], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = scan.startedAt ? new Date(scan.startedAt) : new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    link.href = url;
    link.download = `Log_${(scan.projectName || 'scan').replace(/\s+/g, '_')}_${stamp}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleEmail() {
    if (!scan) {
      return;
    }
    if (!user?.email) {
      showToast({ tone: 'warning', title: t('SCAN_RESULT.EMAIL_NO_ADDRESS') });
      return;
    }
    const applicationName = scan.projectName || t('SCAN_RESULT.UNKNOWN_PROJECT');
    try {
      await sendEmail.mutateAsync({
        type: 'ScanReport',
        email: user.email,
        applicationName,
        subject: `Scan Report: ${applicationName}`,
        html: wrapAsPre(buildMarkdown(scan, scannerType)),
      });
      showToast({
        tone: 'success',
        title: t('SCAN_RESULT.EMAIL_SENT'),
        description: user.email,
      });
    } catch {
      showToast({ tone: 'error', title: t('SCAN_RESULT.EMAIL_FAILED') });
    }
  }

  if (scanQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        {t('COMMON.LOADING')}
      </div>
    );
  }

  if (scanQuery.isError || !scan) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
        <TriangleAlert size={16} className="mt-0.5 shrink-0" />
        <p>{t('COMMON.ERROR')}</p>
      </div>
    );
  }

  const duration = formatDuration(scan.startedAt, scan.completedAt);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft size={14} />
            {t('LOG_VIEWER.BACK_TOOLTIP')}
          </button>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-fg">
            {t('LOG_VIEWER.REPORT_TITLE', { name: scan.projectName || '—' })}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('LOG_VIEWER.EXECUTED_ON', {
              date: formatDateTime(scan.startedAt),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <Download size={15} />
            {t('LOG_VIEWER.DOWNLOAD')}
          </button>
          <button
            type="button"
            onClick={() => void handleEmail()}
            disabled={sendEmail.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendEmail.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Mail size={15} />
            )}
            {t('LOG_VIEWER.EMAIL')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <Printer size={15} />
            {t('LOG_VIEWER.PRINT')}
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            {t('LOG_VIEWER.STATUS')}
          </p>
          <p className="mt-1 text-sm font-medium text-fg">
            {t(STATUS_LABEL[scan.status] ?? 'LOG_VIEWER.SCANNING')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            {t('LOG_VIEWER.DURATION')}
          </p>
          <p className="mt-1 text-sm font-medium text-fg">{duration ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            {t('LOG_VIEWER.SCANNER_TYPE')}
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-fg">{scannerType}</p>
        </div>
      </div>

      <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
        {t('LOG_VIEWER.METRICS_OVERVIEW')}
      </p>
      {isPending ? (
        <div className="mb-5 flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-5 py-12 text-center">
          <Loader2 size={20} className="animate-spin text-primary" />
          <p className="text-sm font-medium text-fg">{t('LOG_VIEWER.SCANNING_IN_PROGRESS')}</p>
          <p className="text-xs text-muted">{t('LOG_VIEWER.METRICS_WILL_APPEAR')}</p>
        </div>
      ) : !metrics ? (
        <div className="mb-5 rounded-xl border border-border bg-surface px-5 py-12 text-center text-sm text-muted">
          {t('LOG_VIEWER.NO_SONAR_RESULT')}
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile
            icon={Bug}
            label={t('LOG_VIEWER.BUGS')}
            value={String(metrics.bugs ?? 0)}
            tone="bg-blocker/12 text-blocker"
          />
          <MetricTile
            icon={ShieldAlert}
            label={t('LOG_VIEWER.SECURITY')}
            value={String(metrics.vulnerabilities ?? 0)}
            tone="bg-major/12 text-major"
          />
          <MetricTile
            icon={Sparkles}
            label={t('LOG_VIEWER.CODE_SMELLS')}
            value={String(metrics.codeSmells ?? 0)}
            tone="bg-primary-subtle text-primary"
          />
          <MetricTile
            icon={Gauge}
            label={t('LOG_VIEWER.COVERAGE')}
            value={metrics.coverage != null ? `${metrics.coverage}%` : '—'}
            tone="bg-success/12 text-success"
          />
        </div>
      )}

      <section className="mb-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('LOG_VIEWER.OVERALL_GATES')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">{t('LOG_VIEWER.TABLE_CAPTION')}</caption>
            <thead>
              <tr className="border-b border-border">
                {[
                  'LOG_VIEWER.COL_METRIC_GATE',
                  'LOG_VIEWER.COL_GRADE',
                  'LOG_VIEWER.COL_STATUS',
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
              {gates.map((gate) => (
                <tr key={gate.labelKey} className="transition-colors hover:bg-surface-2/50">
                  <td className="px-5 py-3 text-fg">{t(gate.labelKey)}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 font-mono text-xs font-semibold text-fg">
                      {gate.grade}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <GateStatus tone={gate.tone} namespace="LOG_VIEWER" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <IssueTable
          title={t('LOG_VIEWER.WARNINGS_WITH_COUNT', {
            count: grouped.major.length,
          })}
          issues={grouped.major}
          tone="bg-major"
        />
        <IssueTable
          title={t('LOG_VIEWER.ERRORS_WITH_COUNT', {
            count: grouped.critical.length,
          })}
          issues={grouped.critical}
          tone="bg-critical"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Terminal size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-fg">
            {t('LOG_VIEWER.DETAILED_ANALYSIS_LOGS')}
          </h2>
        </div>
        {scan.analysisLogs.length > 0 ? (
          <ol className="max-h-96 divide-y divide-border overflow-y-auto">
            {scan.analysisLogs.map((log, index) => (
              <li key={index} className="flex gap-4 px-5 py-2.5 font-mono text-xs">
                <span className="shrink-0 text-faint">{String(index + 1).padStart(3, '0')}</span>
                <span className="min-w-0 flex-1 break-words text-fg">{log.message}</span>
                {log.timestamp ? (
                  <span className="shrink-0 text-faint">{formatDateTime(log.timestamp)}</span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : isPending ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Loader2 size={18} className="animate-spin text-primary" />
            <p className="text-sm font-medium text-fg">{t('LOG_VIEWER.WAITING_FOR_LOGS')}</p>
            <p className="text-xs text-muted">{t('LOG_VIEWER.LOG_ENTRIES_STREAM')}</p>
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {t('LOG_VIEWER.NO_DETAILED_LOGS')}
          </p>
        )}
      </section>
    </div>
  );
}
