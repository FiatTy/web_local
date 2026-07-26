import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight, Minus, X } from 'lucide-react';
import type { Scan } from '@/features/scan/types';

interface ScanCompareModalProps {
  scans: Scan[];
  onClose: () => void;
}

type MetricKey = 'grade' | 'bugs' | 'codeSmells' | 'coverage' | 'duplications';

interface MetricConfig {
  key: MetricKey;
  labelKey: string;
  suffix?: string;
  lowerIsBetter: boolean;
  valueOf: (scan: Scan) => number | null;
  displayOf?: (scan: Scan) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'grade',
    labelKey: 'SCAN.COMPARE_GRADE',
    lowerIsBetter: false,
    valueOf: (scan) => (String(scan.qualityGate ?? '').toUpperCase() === 'OK' ? 1 : 0),
    displayOf: (scan) => (String(scan.qualityGate ?? '').toUpperCase() === 'OK' ? 'OK' : 'FAILED'),
  },
  {
    key: 'bugs',
    labelKey: 'SCAN.COMPARE_BUGS',
    lowerIsBetter: true,
    valueOf: (scan) => scan.metrics?.bugs ?? null,
  },
  {
    key: 'codeSmells',
    labelKey: 'SCAN.COMPARE_CODE_SMELLS',
    lowerIsBetter: true,
    valueOf: (scan) => scan.metrics?.codeSmells ?? null,
  },
  {
    key: 'coverage',
    labelKey: 'SCAN.COMPARE_COVERAGE',
    suffix: '%',
    lowerIsBetter: false,
    valueOf: (scan) => scan.metrics?.coverage ?? null,
  },
  {
    key: 'duplications',
    labelKey: 'SCAN.COMPARE_DUPLICATIONS',
    suffix: '%',
    lowerIsBetter: true,
    valueOf: (scan) => scan.metrics?.duplicatedLinesDensity ?? null,
  },
];

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10);
}

function ChangeCell({ metric, scans }: { metric: MetricConfig; scans: Scan[] }) {
  const first = metric.valueOf(scans[0]);
  const last = metric.valueOf(scans[scans.length - 1]);

  if (first == null || last == null) {
    return <span className="text-faint">—</span>;
  }

  const delta = Math.round((last - first) * 10) / 10;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted">
        <Minus size={13} />0{metric.suffix ?? ''}
      </span>
    );
  }

  const improved = metric.lowerIsBetter ? delta < 0 : delta > 0;
  const Icon = delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        improved ? 'text-success' : 'text-danger'
      }`}
    >
      <Icon size={13} />
      {delta > 0 ? '+' : ''}
      {delta}
      {metric.suffix ?? ''}
    </span>
  );
}

export function ScanCompareModal({ scans, onClose }: ScanCompareModalProps) {
  const { t } = useTranslation();
  const ordered = scans
    .slice()
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  const [enabled, setEnabled] = useState<Record<MetricKey, boolean>>({
    grade: true,
    bugs: true,
    codeSmells: true,
    coverage: true,
    duplications: true,
  });

  const visible = METRICS.filter((metric) => enabled[metric.key]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('COMMON.CLOSE')}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('SCAN.COMPARE_MODAL_TITLE')}</h2>
          <button
            type="button"
            aria-label={t('COMMON.CLOSE')}
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-border px-5 py-4">
          <p className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            {t('SCAN.COMPARE_MODAL_DESC')}
          </p>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((metric) => (
              <button
                key={metric.key}
                type="button"
                aria-pressed={enabled[metric.key]}
                onClick={() =>
                  setEnabled((current) => ({
                    ...current,
                    [metric.key]: !current[metric.key],
                  }))
                }
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  enabled[metric.key]
                    ? 'bg-primary-subtle text-primary'
                    : 'border border-border text-muted hover:bg-surface-2 hover:text-fg'
                }`}
              >
                {t(metric.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[24rem] overflow-auto px-5 py-4">
          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">{t('SCAN.COMPARE_NO_METRIC')}</p>
          ) : (
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">{t('SCAN.COMPARE_TABLE_CAPTION')}</caption>
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_METRIC')}
                  </th>
                  {ordered.map((scan) => (
                    <th key={scan.id} className="py-2 text-center">
                      <span className="block text-xs font-medium text-fg">
                        {scan.projectName || '—'}
                      </span>
                      <span className="block font-mono text-[10px] text-faint">
                        {formatDate(scan.startedAt)}
                      </span>
                    </th>
                  ))}
                  <th className="py-2 text-right font-mono text-[10px] font-semibold uppercase tracking-wide text-faint">
                    {t('SCAN.COL_CHANGE')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((metric) => (
                  <tr key={metric.key}>
                    <td className="py-2.5 text-muted">{t(metric.labelKey)}</td>
                    {ordered.map((scan) => {
                      const value = metric.valueOf(scan);
                      return (
                        <td
                          key={scan.id}
                          className="py-2.5 text-center font-mono text-xs font-medium text-fg"
                        >
                          {metric.displayOf
                            ? metric.displayOf(scan)
                            : value == null
                              ? '—'
                              : `${value}${metric.suffix ?? ''}`}
                        </td>
                      );
                    })}
                    <td className="py-2.5 text-right font-mono text-xs">
                      <ChangeCell metric={metric} scans={ordered} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
