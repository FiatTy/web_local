import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDailyTrend,
  buildMonthlyTrend,
  buildRecentScanTrend,
} from '@/features/scan/lib/scan-trends';
import type { Scan } from '@/features/scan/types';

// Day/month bucketing reads the local calendar day, which is correct for a
// viewer in the browser but makes these tests depend on the runner's
// timezone unless it's pinned to match the +07:00 fixtures below.
process.env.TZ = 'Asia/Bangkok';

const NOW = new Date('2026-07-26T09:00:00+07:00');

function scan(startedAt: string, coverage?: number, projectName = 'demo'): Scan {
  return {
    id: startedAt,
    projectId: 'p1',
    projectName,
    status: 'SUCCESS',
    startedAt,
    metrics: coverage === undefined ? null : { coverage },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('buildDailyTrend', () => {
  it('returns nothing when no scan supplied the metric, so the chart can show its empty state', () => {
    expect(buildDailyTrend([], (item) => item.metrics?.coverage, 30)).toEqual([]);
    expect(
      buildDailyTrend([scan('2026-07-20T10:00:00+07:00')], (i) => i.metrics?.coverage),
    ).toEqual([]);
  });

  it('keeps a genuine zero measurement instead of treating it as missing data', () => {
    const points = buildDailyTrend(
      [scan('2026-07-26T08:00:00+07:00', 0)],
      (i) => i.metrics?.coverage,
      3,
    );
    expect(points).toHaveLength(3);
    expect(points.at(-1)).toEqual({ label: '26/7', value: 0 });
  });

  it('averages several scans landing on the same day', () => {
    const points = buildDailyTrend(
      [scan('2026-07-26T02:00:00+07:00', 40), scan('2026-07-26T20:00:00+07:00', 60)],
      (i) => i.metrics?.coverage,
      1,
    );
    expect(points).toEqual([{ label: '26/7', value: 50 }]);
  });

  it('carries the last known value forward across days without a scan', () => {
    const points = buildDailyTrend(
      [scan('2026-07-24T10:00:00+07:00', 80)],
      (i) => i.metrics?.coverage,
      3,
    );
    expect(points.map((p) => p.value)).toEqual([80, 80, 80]);
  });

  it('leaves days before the first measurement at zero', () => {
    const points = buildDailyTrend(
      [scan('2026-07-26T10:00:00+07:00', 80)],
      (i) => i.metrics?.coverage,
      3,
    );
    expect(points.map((p) => p.value)).toEqual([0, 0, 80]);
  });
});

describe('buildMonthlyTrend', () => {
  it('buckets by calendar month and labels with the short month name', () => {
    const points = buildMonthlyTrend(
      [scan('2026-06-10T10:00:00+07:00', 10), scan('2026-07-02T10:00:00+07:00', 30)],
      (i) => i.metrics?.coverage,
      2,
    );
    expect(points).toEqual([
      { label: 'Jun', value: 10 },
      { label: 'Jul', value: 30 },
    ]);
  });

  it('returns nothing when no scan supplied the metric', () => {
    expect(buildMonthlyTrend([], (i) => i.metrics?.coverage)).toEqual([]);
  });
});

describe('buildRecentScanTrend', () => {
  it('orders oldest to newest and keeps only the requested tail', () => {
    const points = buildRecentScanTrend(
      [
        scan('2026-07-03T10:00:00+07:00', 3),
        scan('2026-07-01T10:00:00+07:00', 1),
        scan('2026-07-02T10:00:00+07:00', 2),
      ],
      (i) => i.metrics?.coverage,
      2,
    );
    expect(points.map((p) => p.value)).toEqual([2, 3]);
  });

  it('drops scans whose metric is missing', () => {
    const points = buildRecentScanTrend(
      [scan('2026-07-01T10:00:00+07:00'), scan('2026-07-02T10:00:00+07:00', 5)],
      (i) => i.metrics?.coverage,
    );
    expect(points).toHaveLength(1);
  });
});
