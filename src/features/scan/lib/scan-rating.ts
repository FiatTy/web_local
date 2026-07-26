import type { Scan, ScanMetrics } from '@/features/scan/types';
import type { GateTone } from '@/types/gate';

export type { GateTone };

const RATING_TO_NUMBER: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
};

export function ratingTone(rating: string | undefined, isPending: boolean): GateTone {
  if (isPending) {
    return 'pending';
  }
  const grade = (rating ?? '').toUpperCase();
  if (grade === 'A') return 'pass';
  if (grade === 'B') return 'warning';
  if (grade === 'C' || grade === 'D' || grade === 'E') return 'fail';
  return 'none';
}

export function hotspotReviewRating(scan?: Scan | null): string {
  if (!scan || scan.status === 'PENDING' || !scan.metrics) {
    return '-';
  }
  return scan.metrics.securityHotspots === 0 ? 'A' : 'E';
}

export function averageRating(metrics?: ScanMetrics | null): string {
  if (!metrics) {
    return '-';
  }
  const ratings = [metrics.reliabilityRating, metrics.securityRating, metrics.maintainabilityRating]
    .map((rating) => RATING_TO_NUMBER[(rating ?? '').toUpperCase()])
    .filter((value): value is number => typeof value === 'number');

  if (ratings.length === 0) {
    return '-';
  }

  const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  if (average <= 1.5) return 'A';
  if (average <= 2.5) return 'B';
  if (average <= 3.5) return 'C';
  if (average <= 4.5) return 'D';
  return 'E';
}

export function formatDuration(startedAt?: string, completedAt?: string): string | null {
  if (!startedAt || !completedAt) {
    return null;
  }
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  const totalSeconds = Math.floor(Math.abs(end - start) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatDateTime(value?: string | null): string {
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
