import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Gauge,
  Layers,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  RotateCw,
  ScanLine,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SkeletonCard } from '@/components/common/Skeleton';
import { useToast } from '@/lib/toast/toast-context';
import { useDeleteRepository, useRepositories } from '@/features/repository/hooks/useRepositories';
import { useStartScan } from '@/features/repository/hooks/useRepository';
import { useSonarQubeConfig } from '@/features/setting/hooks/useSonarQubeConfig';
import type { ProjectType, RepoStatus, Repository } from '@/features/repository/types';

const SCAN_BRANCH = 'dev';

type TypeTab = 'all' | ProjectType;
type StatusFilter = 'all' | RepoStatus;

function formatDateTime(value?: string): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_BADGE: Record<RepoStatus, string> = {
  Active: 'bg-success/12 text-success',
  Scanning: 'bg-primary-subtle text-primary',
  Error: 'bg-danger/12 text-danger',
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bug;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          {label}
        </span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tone}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</p>
    </div>
  );
}

function formatMetric(value?: number): string {
  return value == null ? '—' : String(value);
}

function Metric({
  icon: Icon,
  value,
  tone,
}: {
  icon: typeof Bug;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={tone} />
      <span className="text-sm font-medium text-fg">{value}</span>
    </div>
  );
}

function RepoCard({
  repo,
  onDelete,
  onScan,
  isScanPending,
}: {
  repo: Repository;
  onDelete: (repo: Repository) => void;
  onScan: (repo: Repository) => void;
  isScanPending: boolean;
}) {
  const { t } = useTranslation();
  const lastScan = formatDateTime(repo.lastScan);
  const coverage = repo.metrics?.coverage;
  const qualityPassed = repo.qualityGate === 'Passed';
  const isScanning = repo.status === 'Scanning';

  return (
    <div
      className={`group flex flex-col rounded-xl border bg-surface p-5 transition-colors ${
        isScanning ? 'scan-card border-primary/40' : 'border-border hover:border-border-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{repo.name}</h3>
          <a
            href={repo.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-muted hover:text-primary"
          >
            <span className="truncate">{repo.repositoryUrl}</span>
            <ExternalLink size={11} className="shrink-0" />
          </a>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_BADGE[repo.status]}`}
        >
          {isScanning ? <Loader2 size={11} className="animate-spin" /> : null}
          {isScanning
            ? t('REPOSITORY.ANALYZING')
            : t(`REPOSITORY.STATUS_${repo.status.toUpperCase()}`)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {repo.projectTypeLabel ? (
          <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
            {repo.projectTypeLabel}
          </span>
        ) : null}
        <span className="text-xs text-faint">
          {lastScan ? `${t('REPOSITORY.LAST_SCAN')}: ${lastScan}` : t('REPOSITORY.NEVER_SCANNED')}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
        <Metric icon={Bug} value={formatMetric(repo.metrics?.bugs)} tone="text-blocker" />
        <Metric
          icon={ShieldAlert}
          value={formatMetric(repo.metrics?.vulnerabilities)}
          tone="text-major"
        />
        <Metric icon={Gauge} value={coverage != null ? `${coverage}%` : '—'} tone="text-primary" />
        <div className="ml-auto flex items-center gap-1.5">
          {repo.qualityGate ? (
            qualityPassed ? (
              <CheckCircle2 size={14} className="text-success" />
            ) : (
              <XCircle size={14} className="text-danger" />
            )
          ) : null}
          <span
            className={`text-xs font-medium ${
              repo.qualityGate ? (qualityPassed ? 'text-success' : 'text-danger') : 'text-faint'
            }`}
          >
            {repo.qualityGate ? t(`REPOSITORY.${qualityPassed ? 'PASSED' : 'FAILED'}`) : '—'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1">
        {repo.status === 'Active' ? (
          <button
            type="button"
            onClick={() => onScan(repo)}
            disabled={isScanPending}
            title={t('REPOSITORY.TOOLTIP_RUN')}
            aria-label={t('REPOSITORY.TOOLTIP_RUN')}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary-subtle px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-fg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScanPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {t('REPOSITORY.START_SCAN')}
          </button>
        ) : null}
        {repo.status === 'Error' ? (
          <button
            type="button"
            onClick={() => onScan(repo)}
            disabled={isScanPending}
            title={t('REPOSITORY.TOOLTIP_RETRY')}
            aria-label={t('REPOSITORY.TOOLTIP_RETRY')}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-warning/12 px-2.5 text-xs font-medium text-warning transition-colors hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScanPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RotateCw size={14} />
            )}
            {t('REPOSITORY.TOOLTIP_RETRY')}
          </button>
        ) : null}

        {isScanning ? (
          <span className="mr-auto inline-flex items-center gap-2 text-xs text-primary">
            <ScanLine size={14} className="shrink-0" />
            {t('REPOSITORY.SCAN_IN_PROGRESS')}
          </span>
        ) : (
          <>
            <Link
              to={`/detailrepo/${repo.projectId}`}
              title={t('REPOSITORY.TOOLTIP_VIEW')}
              aria-label={t('REPOSITORY.TOOLTIP_VIEW')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <ExternalLink size={15} />
            </Link>
            <Link
              to={`/settingrepo/${repo.projectId}`}
              title={t('REPOSITORY.TOOLTIP_SETTINGS')}
              aria-label={t('REPOSITORY.TOOLTIP_SETTINGS')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Settings2 size={15} />
            </Link>
            <button
              type="button"
              onClick={() => onDelete(repo)}
              title={t('REPOSITORY.TOOLTIP_DELETE')}
              aria-label={t('REPOSITORY.TOOLTIP_DELETE')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function RepositoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: repositories, isPending, isError, refetch, isFetching } = useRepositories();
  const deleteRepository = useDeleteRepository();
  const configQuery = useSonarQubeConfig();
  const startScan = useStartScan();

  const [typeTab, setTypeTab] = useState<TypeTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Repository | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [missingConfigKey, setMissingConfigKey] = useState<'SONAR' | 'GIT' | null>(null);

  const config = configQuery.data;

  async function handleScan(repo: Repository) {
    if (!config?.authToken?.trim() || !config?.serverUrl?.trim()) {
      setMissingConfigKey('SONAR');
      return;
    }
    const gitToken = config.gitAccessToken?.trim() || null;
    if (!gitToken) {
      setMissingConfigKey('GIT');
      return;
    }

    setScanningId(repo.projectId);
    try {
      await startScan.mutateAsync({
        projectId: repo.projectId,
        branch: SCAN_BRANCH,
        config,
        gitToken,
        serverUrl: config.serverUrl,
      });
      showToast({
        tone: 'success',
        title: t('REPOSITORY.SCAN_STARTED'),
        description: repo.name,
      });
    } catch {
      showToast({
        tone: 'error',
        title: t('REPOSITORY.SCAN_START_FAILED'),
        description: repo.name,
      });
    } finally {
      setScanningId(null);
    }
  }

  const list = useMemo(() => repositories ?? [], [repositories]);

  const stats = useMemo(
    () => ({
      total: list.length,
      active: list.filter((repo) => repo.status === 'Active').length,
      scanning: list.filter((repo) => repo.status === 'Scanning').length,
      error: list.filter((repo) => repo.status === 'Error').length,
    }),
    [list],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return list.filter((repo) => {
      if (typeTab !== 'all' && repo.projectType !== typeTab) {
        return false;
      }
      if (statusFilter !== 'all' && repo.status !== statusFilter) {
        return false;
      }
      if (query && !`${repo.name} ${repo.repositoryUrl}`.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [list, typeTab, statusFilter, search]);

  const typeTabs: { key: TypeTab; label: string }[] = [
    { key: 'all', label: t('REPOSITORY.TAB_ALL') },
    { key: 'ANGULAR', label: t('REPOSITORY.TAB_ANGULAR') },
    { key: 'SPRING_BOOT', label: t('REPOSITORY.TAB_SPRING') },
  ];

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    await deleteRepository.mutateAsync(pendingDelete.projectId).catch(() => undefined);
    setPendingDelete(null);
  }

  return (
    <div>
      <PageHeader
        title={t('REPOSITORY.TITLE')}
        subtitle={t('REPOSITORY.SUBTITLE')}
        actions={
          <button
            type="button"
            onClick={() => navigate('/addrepository')}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99]"
          >
            <Plus size={16} />
            {t('REPOSITORY.NEW_REPOSITORY')}
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Layers}
          label={t('REPOSITORY.STATS_TOTAL')}
          value={stats.total}
          tone="bg-surface-2 text-fg"
        />
        <StatCard
          icon={CheckCircle2}
          label={t('REPOSITORY.STATS_ACTIVE')}
          value={stats.active}
          tone="bg-success/12 text-success"
        />
        <StatCard
          icon={Loader2}
          label={t('REPOSITORY.STATS_SCANNING')}
          value={stats.scanning}
          tone="bg-primary-subtle text-primary"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('REPOSITORY.STATS_ERROR')}
          value={stats.error}
          tone="bg-danger/12 text-danger"
        />
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          {typeTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeTab(tab.key)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                typeTab === tab.key ? 'bg-primary-subtle text-primary' : 'text-muted hover:text-fg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('REPOSITORY.SEARCH_PLACEHOLDER')}
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-fg outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          >
            <option value="all">{t('REPOSITORY.STATUS_ALL')}</option>
            <option value="Active">{t('REPOSITORY.STATUS_ACTIVE')}</option>
            <option value="Scanning">{t('REPOSITORY.STATUS_SCANNING')}</option>
            <option value="Error">{t('REPOSITORY.STATUS_ERROR')}</option>
          </select>
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
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
          <FolderGit2 size={30} className="text-faint" />
          <h3 className="mt-4 text-sm font-semibold text-fg">{t('REPOSITORY.NO_REPOS_FOUND')}</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">{t('REPOSITORY.NO_REPOS_FOUND_DESC')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((repo) => (
            <RepoCard
              key={repo.projectId}
              repo={repo}
              onDelete={setPendingDelete}
              onScan={(target) => void handleScan(target)}
              isScanPending={scanningId === repo.projectId}
            />
          ))}
        </div>
      )}

      {missingConfigKey ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('REPOSITORY.CANCEL')}
            className="absolute inset-0 bg-black/50"
            onClick={() => setMissingConfigKey(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/12 text-warning">
              <AlertTriangle size={20} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-fg">
              {t(
                missingConfigKey === 'GIT'
                  ? 'REPOSITORY.MISSING_GIT_TOKEN_TITLE'
                  : 'REPOSITORY.MISSING_SONAR_TITLE',
              )}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {t(
                missingConfigKey === 'GIT'
                  ? 'REPOSITORY.MISSING_GIT_TOKEN_TEXT'
                  : 'REPOSITORY.MISSING_SONAR_TEXT',
              )}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMissingConfigKey(null)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
              >
                {t('REPOSITORY.CANCEL')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/sonarqubeconfig')}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99]"
              >
                <SlidersHorizontal size={15} />
                {t('REPOSITORY.GO_TO_SETTINGS')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('COMMON.CANCEL')}
            className="absolute inset-0 bg-black/50"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/12 text-danger">
              <Trash2 size={20} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-fg">
              {t('REPOSITORY.DELETE_CONFIRM.TITLE')}
            </h2>
            <p className="mt-1.5 text-sm text-muted">{t('REPOSITORY.DELETE_CONFIRM.TEXT')}</p>
            <p className="mt-2 truncate text-sm font-medium text-fg">{pendingDelete.name}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
              >
                {t('REPOSITORY.DELETE_CONFIRM.CANCEL')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteRepository.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-70"
              >
                {deleteRepository.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  t('REPOSITORY.DELETE_CONFIRM.CONFIRM')
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
