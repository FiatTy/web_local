import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldAlert,
  UserPlus,
  Waves,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useIssues } from '@/features/issue/hooks/useIssues';
import { AssignIssueModal } from '@/features/issue/components/AssignIssueModal';
import { BulkAssignModal } from '@/features/issue/components/BulkAssignModal';
import type { Issue } from '@/features/issue/types';

const PAGE_SIZE = 10;

const TYPE_META: Record<string, { labelKey: string; icon: typeof Bug; tone: string }> = {
  BUG: { labelKey: 'ISSUE.BUG', icon: Bug, tone: 'text-blocker' },
  VULNERABILITY: {
    labelKey: 'ISSUE.SECURITY',
    icon: ShieldAlert,
    tone: 'text-major',
  },
  CODE_SMELL: {
    labelKey: 'ISSUE.CODE_SMELL',
    icon: Waves,
    tone: 'text-primary',
  },
};

const SEVERITY_META: Record<string, { labelKey: string; text: string; dot: string }> = {
  BLOCKER: {
    labelKey: 'ISSUE.BLOCKER',
    text: 'text-blocker',
    dot: 'bg-blocker',
  },
  CRITICAL: {
    labelKey: 'ISSUE.CRITICAL',
    text: 'text-critical',
    dot: 'bg-critical',
  },
  MAJOR: { labelKey: 'ISSUE.MAJOR', text: 'text-major', dot: 'bg-major' },
  MINOR: { labelKey: 'ISSUE.MINOR', text: 'text-minor', dot: 'bg-minor' },
  INFO: { labelKey: 'ISSUE.INFO', text: 'text-faint', dot: 'bg-faint' },
};

function statusMeta(status: string): { labelKey: string; cls: string } {
  switch (status) {
    case 'IN_PROGRESS':
    case 'PENDING':
      return {
        labelKey: 'ISSUE.IN_PROGRESS',
        cls: 'bg-warning/12 text-warning',
      };
    case 'DONE':
    case 'RESOLVED':
      return { labelKey: 'ISSUE.RESOLVED', cls: 'bg-success/12 text-success' };
    case 'REJECT':
    case 'CLOSED':
      return { labelKey: 'ISSUE.CLOSED', cls: 'bg-danger/12 text-danger' };
    default:
      return { labelKey: 'ISSUE.OPEN', cls: 'bg-surface-2 text-muted' };
  }
}

function TypeCell({ issue }: { issue: Issue }) {
  const { t } = useTranslation();
  const meta = TYPE_META[issue.type] ?? {
    labelKey: 'ISSUE.TITLE',
    icon: Bug,
    tone: 'text-muted',
  };
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className={meta.tone} />
      <span className="whitespace-nowrap text-sm text-fg">{t(meta.labelKey)}</span>
    </div>
  );
}

function SeverityCell({ severity }: { severity: string }) {
  const { t } = useTranslation();
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.INFO;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      <span className={`text-sm font-medium ${meta.text}`}>{t(meta.labelKey)}</span>
    </div>
  );
}

export function IssuesPage() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch, isFetching } = useIssues();

  const [type, setType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');
  const [project, setProject] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<Issue | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const issues = useMemo(() => data ?? [], [data]);
  const projects = useMemo(
    () => Array.from(new Set(issues.map((issue) => issue.projectName).filter(Boolean))).sort(),
    [issues],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return issues.filter((issue) => {
      if (type !== 'all' && issue.type !== type) return false;
      if (severity !== 'all' && issue.severity !== severity) return false;
      if (status !== 'all' && statusMeta(issue.status).labelKey !== statusMeta(status).labelKey)
        return false;
      if (project !== 'all' && issue.projectName !== project) return false;
      if (query && !`${issue.component} ${issue.message}`.toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [issues, type, severity, status, project, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectedIssues = useMemo(
    () => issues.filter((issue) => selectedIds.includes(issue.id)),
    [issues, selectedIds],
  );
  const allPageSelected =
    pageRows.length > 0 && pageRows.every((issue) => selectedIds.includes(issue.id));

  function resetFilters() {
    setType('all');
    setSeverity('all');
    setStatus('all');
    setProject('all');
    setSearch('');
    setSelectedIds([]);
    setPage(1);
  }

  function toggleSelected(issueId: string) {
    setSelectedIds((current) =>
      current.includes(issueId) ? current.filter((id) => id !== issueId) : [...current, issueId],
    );
  }

  function toggleSelectPage() {
    const pageIds = pageRows.map((issue) => issue.id);
    setSelectedIds((current) =>
      allPageSelected
        ? current.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...current, ...pageIds])),
    );
  }

  const selectClass =
    'h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25';

  const headCell =
    'px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-faint';

  return (
    <div>
      <PageHeader title={t('ISSUE.TITLE_MGT')} subtitle={t('ISSUE.TABLE_CAPTION')} />

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-4">
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">{t('ISSUE.ALL_TYPES')}</option>
          <option value="BUG">{t('ISSUE.BUG')}</option>
          <option value="VULNERABILITY">{t('ISSUE.SECURITY')}</option>
          <option value="CODE_SMELL">{t('ISSUE.CODE_SMELL')}</option>
        </select>
        <select
          value={severity}
          onChange={(event) => {
            setSeverity(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">{t('ISSUE.ALL_SEVERITY')}</option>
          <option value="BLOCKER">{t('ISSUE.BLOCKER')}</option>
          <option value="CRITICAL">{t('ISSUE.CRITICAL')}</option>
          <option value="MAJOR">{t('ISSUE.MAJOR')}</option>
          <option value="MINOR">{t('ISSUE.MINOR')}</option>
          <option value="INFO">{t('ISSUE.INFO')}</option>
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">{t('ISSUE.ALL_STATUS')}</option>
          <option value="OPEN">{t('ISSUE.OPEN')}</option>
          <option value="IN_PROGRESS">{t('ISSUE.IN_PROGRESS')}</option>
          <option value="DONE">{t('ISSUE.RESOLVED')}</option>
          <option value="REJECT">{t('ISSUE.CLOSED')}</option>
        </select>
        <select
          value={project}
          onChange={(event) => {
            setProject(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">{t('ISSUE.ALL_PROJECTS')}</option>
          {projects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <div className="relative ml-auto w-full sm:w-56">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t('ISSUE.SEARCH_PLACEHOLDER')}
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-fg outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <RefreshCw size={14} />
          {t('ISSUE.CLEAR')}
        </button>
      </div>

      {isPending ? (
        <SkeletonTable rows={8} columns={6} />
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
          <Bug size={30} className="text-faint" />
          <h3 className="mt-4 text-sm font-semibold text-fg">{t('ISSUE.NO_ISSUES_FOUND')}</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">{t('ISSUE.NO_ISSUES_FOUND_DESC')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50 text-left">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={t('ISSUE.SELECT_ALL')}
                      checked={allPageSelected}
                      onChange={toggleSelectPage}
                      className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
                    />
                  </th>
                  <th className={headCell}>{t('ISSUE.COL_TYPE')}</th>
                  <th className={headCell}>{t('ISSUE.COL_SEVERITY')}</th>
                  <th className={headCell}>{t('ISSUE.COL_ISSUE')}</th>
                  <th className={headCell}>{t('ISSUE.COL_COMPONENT')}</th>
                  <th className={headCell}>{t('ISSUE.COL_PROJECT')}</th>
                  <th className={headCell}>{t('ISSUE.COL_ASSIGNED')}</th>
                  <th className={headCell}>{t('ISSUE.COL_STATUS')}</th>
                  <th className={`${headCell} text-center`}>{t('ISSUE.COL_VIEW')}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((issue) => {
                  const badge = statusMeta(issue.status);
                  return (
                    <tr
                      key={issue.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`${t('ISSUE.SELECT_ALL')} ${issue.issueKey}`}
                          checked={selectedIds.includes(issue.id)}
                          onChange={() => toggleSelected(issue.id)}
                          className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <TypeCell issue={issue} />
                      </td>
                      <td className="px-4 py-3">
                        <SeverityCell severity={issue.severity} />
                      </td>
                      <td className="max-w-[280px] px-4 py-3">
                        <p className="truncate text-fg" title={issue.message}>
                          {issue.message || '—'}
                        </p>
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <p
                          className="truncate font-mono text-xs text-muted"
                          title={issue.component}
                        >
                          {issue.component || '—'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {issue.projectName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setAssignTarget(issue)}
                          title={t('ISSUE_MODAL.ASSIGN_ISSUE')}
                          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-surface-2"
                        >
                          {issue.assignedName ? (
                            <span className="text-fg">{issue.assignedName}</span>
                          ) : (
                            <span className="text-faint">{t('ISSUE.UNASSIGNED')}</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.cls}`}
                        >
                          {t(badge.labelKey)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/issuedetail/${issue.id}`}
                          aria-label={t('ISSUE.COL_VIEW')}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary-subtle"
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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

      {selectedIds.length > 0 ? (
        <div className="sticky bottom-4 z-30 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg shadow-black/10">
          <span className="text-sm text-fg">
            {t('ISSUE.SELECTED_ISSUES_LABEL', { count: selectedIds.length })}
          </span>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs font-medium text-muted transition-colors hover:text-fg"
          >
            {t('ISSUE.CLEAR_SELECTION')}
          </button>
          <button
            type="button"
            onClick={() => setShowBulkAssign(true)}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99]"
          >
            <UserPlus size={15} />
            {t('ISSUE.ASSIGN_SELECTED')}
          </button>
        </div>
      ) : null}

      {assignTarget ? (
        <AssignIssueModal
          issue={assignTarget}
          mode="assign"
          onClose={() => setAssignTarget(null)}
        />
      ) : null}

      {showBulkAssign && selectedIssues.length > 0 ? (
        <BulkAssignModal
          issues={selectedIssues}
          onClose={() => setShowBulkAssign(false)}
          onDone={() => setSelectedIds([])}
        />
      ) : null}
    </div>
  );
}
