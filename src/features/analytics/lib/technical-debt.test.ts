import { describe, expect, it } from 'vitest';
import {
  computeProjectDebts,
  computeTopDebtItems,
  computeTotalDebt,
  formatDebtTime,
  latestScanPerProject,
  toDebtDays,
} from '@/features/analytics/lib/technical-debt';
import type { Scan } from '@/features/scan/types';
import type { Repository } from '@/features/repository/types';

function scan(id: string, projectId: string, startedAt: string, debtMinutes?: number): Scan {
  return {
    id,
    projectId,
    projectName: projectId,
    status: 'SUCCESS',
    startedAt,
    completedAt: startedAt,
    metrics: debtMinutes === undefined ? null : { technicalDebtMinutes: debtMinutes },
  };
}

function repo(projectId: string, costPerDay?: number): Repository {
  return {
    projectId,
    name: projectId,
    repositoryUrl: `https://example.test/${projectId}.git`,
    status: 'Active',
    costPerDay,
  };
}

describe('toDebtDays', () => {
  it('treats a working day as 480 minutes', () => {
    expect(toDebtDays(480)).toBe(1);
    expect(toDebtDays(240)).toBe(0.5);
  });
});

describe('latestScanPerProject', () => {
  it('keeps only the newest scan for each project', () => {
    const result = latestScanPerProject([
      scan('a', 'p1', '2026-07-01T00:00:00Z'),
      scan('b', 'p1', '2026-07-05T00:00:00Z'),
      scan('c', 'p2', '2026-07-02T00:00:00Z'),
    ]);
    expect(result.map((s) => s.id).sort()).toEqual(['b', 'c']);
  });

  it('ignores scans with no project attached', () => {
    const orphan = {
      ...scan('x', 'p1', '2026-07-01T00:00:00Z'),
      projectId: undefined,
    };
    expect(latestScanPerProject([orphan])).toEqual([]);
  });
});

describe('computeProjectDebts', () => {
  it('prices debt with the project cost per day and sorts by cost descending', () => {
    const debts = computeProjectDebts(
      [scan('a', 'p1', '2026-07-01T00:00:00Z', 480), scan('b', 'p2', '2026-07-01T00:00:00Z', 960)],
      [repo('p1', 500), repo('p2', 1000)],
    );
    expect(debts.map((d) => [d.projectId, d.cost])).toEqual([
      ['p2', 2000],
      ['p1', 500],
    ]);
  });

  it('falls back to the default day rate when the repository has no cost', () => {
    const [debt] = computeProjectDebts(
      [scan('a', 'p1', '2026-07-01T00:00:00Z', 480)],
      [repo('p1')],
    );
    expect(debt.cost).toBe(1000);
  });

  it('treats a scan with no debt metric as zero rather than dropping it', () => {
    const [debt] = computeProjectDebts(
      [scan('a', 'p1', '2026-07-01T00:00:00Z')],
      [repo('p1', 500)],
    );
    expect(debt).toMatchObject({ minutes: 0, cost: 0 });
  });
});

describe('computeTotalDebt', () => {
  it('splits total minutes into days, hours and minutes', () => {
    const total = computeTotalDebt([
      { projectId: 'p1', name: 'p1', minutes: 500, days: 0, cost: 100 },
      { projectId: 'p2', name: 'p2', minutes: 45, days: 0, cost: 50 },
    ]);
    expect(total).toEqual({ days: 1, hours: 1, minutes: 5, cost: 150 });
  });

  it('returns zeros for an empty portfolio', () => {
    expect(computeTotalDebt([])).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      cost: 0,
    });
  });
});

describe('computeTopDebtItems', () => {
  it('assigns priority relative to the most expensive project', () => {
    const items = computeTopDebtItems([
      { projectId: 'p1', name: 'p1', minutes: 0, days: 0, cost: 900 },
      { projectId: 'p2', name: 'p2', minutes: 0, days: 0, cost: 500 },
      { projectId: 'p3', name: 'p3', minutes: 0, days: 0, cost: 100 },
    ]);
    expect(items.map((i) => i.priority)).toEqual(['High', 'Med', 'Low']);
  });

  it('respects the limit', () => {
    const debts = Array.from({ length: 8 }, (_, i) => ({
      projectId: `p${i}`,
      name: `p${i}`,
      minutes: 0,
      days: 0,
      cost: 100 - i,
    }));
    expect(computeTopDebtItems(debts)).toHaveLength(5);
    expect(computeTopDebtItems(debts, 2)).toHaveLength(2);
  });
});

describe('formatDebtTime', () => {
  it('renders days, hours and minutes', () => {
    expect(formatDebtTime(480 + 90)).toBe('1d 1h 30m');
  });

  it('omits empty units but always keeps at least one', () => {
    expect(formatDebtTime(480)).toBe('1d');
    expect(formatDebtTime(90)).toBe('1h 30m');
    expect(formatDebtTime(0)).toBe('0m');
  });
});
