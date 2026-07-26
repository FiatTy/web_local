import type { Scan } from '@/features/scan/types';

export interface TrendPoint {
  label: string;
  value: number;
}

type MetricSelector = (scan: Scan) => number | null | undefined;

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number {
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function bucketBy(
  scans: Scan[],
  select: MetricSelector,
  keyOf: (date: Date) => string,
): Map<string, number[]> {
  const buckets = new Map<string, number[]>();
  for (const scan of scans) {
    const time = new Date(scan.startedAt).getTime();
    if (Number.isNaN(time)) {
      continue;
    }
    const value = select(scan);
    if (value == null || Number.isNaN(value)) {
      continue;
    }
    const key = keyOf(new Date(time));
    const list = buckets.get(key) ?? [];
    list.push(value);
    buckets.set(key, list);
  }
  return buckets;
}

export function buildDailyTrend(scans: Scan[], select: MetricSelector, days = 30): TrendPoint[] {
  const keyOf = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const buckets = bucketBy(scans, select, keyOf);

  if (buckets.size === 0) {
    return [];
  }

  const points: TrendPoint[] = [];
  const today = new Date();
  let carried = 0;

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const values = buckets.get(keyOf(date));
    if (values && values.length > 0) {
      carried = average(values);
    }
    points.push({
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      value: carried,
    });
  }
  return points;
}

export function buildMonthlyTrend(scans: Scan[], select: MetricSelector, months = 6): TrendPoint[] {
  const keyOf = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
  const buckets = bucketBy(scans, select, keyOf);

  if (buckets.size === 0) {
    return [];
  }

  const points: TrendPoint[] = [];
  const today = new Date();
  let carried = 0;

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const values = buckets.get(keyOf(date));
    if (values && values.length > 0) {
      carried = average(values);
    }
    points.push({ label: MONTH_LABELS[date.getMonth()], value: carried });
  }
  return points;
}

export function buildRecentScanTrend(
  scans: Scan[],
  select: MetricSelector,
  count = 12,
): TrendPoint[] {
  return scans
    .filter((scan) => {
      const value = select(scan);
      return value != null && !Number.isNaN(value);
    })
    .slice()
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .slice(-count)
    .map((scan) => {
      const date = new Date(scan.startedAt);
      return {
        label: Number.isNaN(date.getTime()) ? '—' : `${date.getDate()}/${date.getMonth() + 1}`,
        value: select(scan) ?? 0,
      };
    });
}
