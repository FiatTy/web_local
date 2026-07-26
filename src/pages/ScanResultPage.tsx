import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  Download,
  Gauge,
  ListChecks,
  Loader2,
  Mail,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import { GateStatus } from '@/components/common/GateStatus';
import { useScan, useSendScanReportEmail } from '@/features/scan/hooks/useScan';
import {
  averageRating,
  formatDateTime,
  formatDuration,
  hotspotReviewRating,
  ratingTone,
} from '@/features/scan/lib/scan-rating';
import type { ScanDetail } from '@/features/scan/types';

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

function buildReportHtml(scan: ScanDetail, passedLabel: string, failedLabel: string): string {
  const metrics = scan.metrics;
  const value = (input: unknown) => (input === null || input === undefined ? '-' : String(input));
  const markdown = `# Scan Results: ${scan.projectName || '-'}

## Scan Info
- **Started At**: ${formatDateTime(scan.startedAt)}
- **Completed At**: ${formatDateTime(scan.completedAt)}
- **Quality Gate**: ${scan.qualityGate === 'OK' ? passedLabel : failedLabel}

## Overall Gates
| Gate | Grade |
| --- | --- |
| Reliability | ${value(metrics?.reliabilityRating)} |
| Security | ${value(metrics?.securityRating)} |
| Maintainability | ${value(metrics?.maintainabilityRating)} |
| Security Review | ${averageRating(metrics)} |

## Metrics Overview
- **Bugs**: ${value(metrics?.bugs)}
- **Vulnerabilities**: ${value(metrics?.vulnerabilities)}
- **Code Smells**: ${value(metrics?.codeSmells)}
- **Coverage**: ${value(metrics?.coverage)}%
`;

  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return `<pre style="white-space: pre-wrap; font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace;">\n${escaped}\n</pre>`;
}

export function ScanResultPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const scanQuery = useScan(scanId);
  const sendEmail = useSendScanReportEmail();

  const scan = scanQuery.data;
  const isPending = scan?.status === 'PENDING';
  const metrics = scan?.metrics;

  const gates = useMemo(() => {
    if (!scan) {
      return [];
    }
    const hotspot = hotspotReviewRating(scan);
    const review = averageRating(metrics);
    return [
      {
        labelKey: 'SCAN_RESULT.RELIABILITY_RATING',
        grade: metrics?.reliabilityRating ?? '-',
        tone: ratingTone(metrics?.reliabilityRating, isPending),
      },
      {
        labelKey: 'SCAN_RESULT.SECURITY_RATING',
        grade: metrics?.securityRating ?? '-',
        tone: ratingTone(metrics?.securityRating, isPending),
      },
      {
        labelKey: 'SCAN_RESULT.MAINTAINABILITY_RATING',
        grade: metrics?.maintainabilityRating ?? '-',
        tone: ratingTone(metrics?.maintainabilityRating, isPending),
      },
      {
        labelKey: 'SCAN_RESULT.SECURITY_HOTSPOT_RATING',
        grade: hotspot,
        tone: ratingTone(hotspot, isPending),
      },
      {
        labelKey: 'SCAN_RESULT.SECURITY_REVIEW_RATING',
        grade: review,
        tone: ratingTone(review, isPending),
      },
    ];
  }, [scan, metrics, isPending]);

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
        html: buildReportHtml(scan, t('SCAN_RESULT.PASSED'), t('SCAN_RESULT.FAILED')),
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
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <Loader2 size={20} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-fg">{t('SCAN_RESULT.LOADING_RESULTS')}</p>
        <p className="text-xs text-muted">{t('SCAN_RESULT.LOADING_DESC')}</p>
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

  const passed =
    String(scan.qualityGate ?? '')
      .trim()
      .toUpperCase() === 'OK';
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
            {t('SCAN_RESULT.BACK_TOOLTIP')}
          </button>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-fg">
            {t('SCAN_RESULT.TITLE', { name: scan.projectName || '—' })}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('SCAN_RESULT.SUBTITLE')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/generatereport"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <Download size={15} />
            {t('SCAN_RESULT.DOWNLOAD')}
          </Link>
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
            {t('SCAN_RESULT.EMAIL')}
          </button>
          <Link
            to="/issue"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99]"
          >
            <ListChecks size={15} />
            {t('SCAN_RESULT.VIEW_ISSUES')}
          </Link>
        </div>
      </div>

      <section className="mb-4 rounded-xl border border-border bg-surface p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
          {t('SCAN_RESULT.QUALITY_GATE_STATUS')}
        </p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                isPending
                  ? 'bg-primary-subtle text-primary'
                  : passed
                    ? 'bg-success/12 text-success'
                    : 'bg-danger/12 text-danger'
              }`}
            >
              {isPending ? (
                <Loader2 size={24} className="animate-spin" />
              ) : passed ? (
                <CheckCircle2 size={24} />
              ) : (
                <XCircle size={24} />
              )}
            </span>
            <div>
              <p
                className={`text-2xl font-semibold tracking-tight ${
                  isPending ? 'text-primary' : passed ? 'text-success' : 'text-danger'
                }`}
              >
                {isPending
                  ? t('SCAN_RESULT.SCANNING')
                  : passed
                    ? t('SCAN_RESULT.PASSED')
                    : t('SCAN_RESULT.FAILED')}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {isPending
                  ? t('SCAN_RESULT.ANALYSIS_IN_PROGRESS')
                  : passed
                    ? t('SCAN_RESULT.CODE_CLEAN')
                    : t('SCAN_RESULT.ISSUES_FOUND')}
              </p>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-3 lg:text-right">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                {t('SCAN_RESULT.STARTED')}
              </p>
              <p className="mt-0.5 text-sm text-fg">{formatDateTime(scan.startedAt)}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                {t('SCAN_RESULT.COMPLETED')}
              </p>
              <p className="mt-0.5 text-sm text-fg">{formatDateTime(scan.completedAt)}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                {t('SCAN_RESULT.SCAN_DURATION')}
              </p>
              <p className="mt-0.5 text-sm text-fg">{duration ?? '—'}</p>
            </div>
          </div>
        </div>
      </section>

      <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
        {t('SCAN_RESULT.METRICS_OVERVIEW')}
      </p>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          icon={Bug}
          label={t('SCAN_RESULT.BUGS')}
          value={String(metrics?.bugs ?? 0)}
          tone="bg-blocker/12 text-blocker"
        />
        <MetricTile
          icon={ShieldAlert}
          label={t('SCAN_RESULT.SECURITY')}
          value={String(metrics?.vulnerabilities ?? 0)}
          tone="bg-major/12 text-major"
        />
        <MetricTile
          icon={Sparkles}
          label={t('SCAN_RESULT.CODE_SMELLS')}
          value={String(metrics?.codeSmells ?? 0)}
          tone="bg-primary-subtle text-primary"
        />
        <MetricTile
          icon={Gauge}
          label={t('SCAN_RESULT.COVERAGE')}
          value={metrics?.coverage != null ? `${metrics.coverage}%` : '—'}
          tone="bg-success/12 text-success"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('SCAN_RESULT.OVERALL_GATES')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">{t('SCAN_RESULT.TABLE_CAPTION')}</caption>
            <thead>
              <tr className="border-b border-border">
                {[
                  'SCAN_RESULT.COL_METRIC_GATE',
                  'SCAN_RESULT.COL_GRADE',
                  'SCAN_RESULT.COL_STATUS',
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
                    <GateStatus tone={gate.tone} namespace="SCAN_RESULT" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
