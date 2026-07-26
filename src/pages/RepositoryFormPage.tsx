import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  GitBranch,
  Hash,
  Link2,
  Loader2,
  Plus,
  Save,
  Server,
  SlidersHorizontal,
  Tag,
  Trash2,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { useToast } from '@/lib/toast/toast-context';
import { useRepositories, useDeleteRepository } from '@/features/repository/hooks/useRepositories';
import {
  useRepository,
  useSaveRepository,
  useStartScan,
} from '@/features/repository/hooks/useRepository';
import { useSonarQubeConfig } from '@/features/setting/hooks/useSonarQubeConfig';
import type { ProjectType } from '@/features/repository/types';

const MIN_COST_PER_DAY = 1000;
const SCAN_BRANCH = 'dev';

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'ANGULAR', label: 'Angular' },
  { value: 'SPRING_BOOT', label: 'Spring Boot' },
];

interface RepositoryFormState {
  name: string;
  repositoryUrl: string;
  projectType: ProjectType | '';
  costPerDay: number;
}

const DEFAULT_FORM: RepositoryFormState = {
  name: '',
  repositoryUrl: '',
  projectType: '',
  costPerDay: MIN_COST_PER_DAY,
};

function readErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; detail?: string } | string | undefined;
    if (typeof data === 'string' && data) {
      return data;
    }
    if (data && typeof data === 'object') {
      return data.message || data.detail || error.message || fallback;
    }
    return error.message || fallback;
  }
  return fallback;
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-sm font-semibold text-fg">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      <span
        className={`min-w-0 truncate text-right text-sm text-fg ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

export function RepositoryFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { showToast } = useToast();

  const isEditMode = Boolean(projectId);
  const repositoryQuery = useRepository(projectId);
  const repositoriesQuery = useRepositories();
  const configQuery = useSonarQubeConfig();
  const saveRepository = useSaveRepository();
  const startScan = useStartScan();
  const deleteRepository = useDeleteRepository();

  const [form, setForm] = useState<RepositoryFormState>(DEFAULT_FORM);
  const [savedProjectKey, setSavedProjectKey] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showMissingConfig, setShowMissingConfig] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || !repositoryQuery.data) {
      return;
    }
    hydrated.current = true;
    const repo = repositoryQuery.data;
    setForm({
      name: repo.name || '',
      repositoryUrl: repo.repositoryUrl || '',
      projectType: repo.projectType ?? '',
      costPerDay: repo.costPerDay ?? MIN_COST_PER_DAY,
    });
    setSavedProjectKey(repo.sonarProjectKey || '');
  }, [repositoryQuery.data]);

  const config = configQuery.data;
  const serverUrl = config?.serverUrl ?? '';
  const projectKey = isEditMode ? savedProjectKey : form.name;

  const duplicateName = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (!name) {
      return false;
    }
    return (repositoriesQuery.data ?? []).some(
      (repo) => repo.name.trim().toLowerCase() === name && repo.projectId !== projectId,
    );
  }, [form.name, repositoriesQuery.data, projectId]);

  const errors = {
    name: !form.name.trim()
      ? t('REPOSITORY.NAME_REQUIRED')
      : duplicateName
        ? t('REPOSITORY.DUPLICATE_NAME')
        : '',
    projectType: !form.projectType ? t('REPOSITORY.TYPE_REQUIRED') : '',
    costPerDay: form.costPerDay < MIN_COST_PER_DAY ? t('REPOSITORY.COST_MIN') : '',
    repositoryUrl: !form.repositoryUrl.trim() ? t('REPOSITORY.URL_REQUIRED') : '',
  };

  const isValid =
    !errors.name && !errors.projectType && !errors.costPerDay && !errors.repositoryUrl;
  const isSubmitting = saveRepository.isPending || startScan.isPending;

  function update(patch: Partial<RepositoryFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function markTouched(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function handleClear() {
    if (isEditMode) {
      update({ name: '', costPerDay: MIN_COST_PER_DAY });
      return;
    }
    setForm(DEFAULT_FORM);
    setTouched({});
  }

  async function handleSubmit() {
    setTouched({
      name: true,
      projectType: true,
      costPerDay: true,
      repositoryUrl: true,
    });
    if (!isValid) {
      return;
    }

    if (!config?.authToken?.trim() || !config?.serverUrl?.trim()) {
      setShowMissingConfig(true);
      return;
    }

    const payload = {
      name: form.name.trim(),
      url: form.repositoryUrl.trim(),
      type: form.projectType as ProjectType,
      costPerDay: form.costPerDay || MIN_COST_PER_DAY,
    };

    let savedId: string;
    try {
      const saved = await saveRepository.mutateAsync({ projectId, payload });
      savedId = projectId ?? saved.projectId;
      showToast({
        tone: 'success',
        title: t(isEditMode ? 'REPOSITORY.SAVED_UPDATED' : 'REPOSITORY.SAVED_ADDED'),
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: t('REPOSITORY.SAVE_FAILED'),
        description: readErrorMessage(error, t('COMMON.ERROR')),
      });
      return;
    }

    if (!savedId) {
      navigate(-1);
      return;
    }

    try {
      await startScan.mutateAsync({
        projectId: savedId,
        branch: SCAN_BRANCH,
        config,
        gitToken: config.gitAccessToken,
        serverUrl: config.serverUrl,
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: t('REPOSITORY.SCAN_START_FAILED'),
        description: readErrorMessage(error, t('COMMON.ERROR')),
      });
    }
    navigate(-1);
  }

  async function confirmDelete() {
    if (!projectId) {
      return;
    }
    try {
      await deleteRepository.mutateAsync(projectId);
      setShowDeleteConfirm(false);
      showToast({
        tone: 'success',
        title: t('REPOSITORY.DELETE_CONFIRM.SUCCESS_TITLE'),
        description: t('REPOSITORY.DELETE_CONFIRM.SUCCESS_TEXT'),
      });
      navigate('/repositories');
    } catch {
      setShowDeleteConfirm(false);
      showToast({
        tone: 'error',
        title: t('REPOSITORY.DELETE_CONFIRM.FAILED_TITLE'),
        description: t('REPOSITORY.DELETE_CONFIRM.FAILED_TEXT'),
      });
    }
  }

  const typeLabel = PROJECT_TYPES.find((type) => type.value === form.projectType)?.label ?? '—';

  return (
    <div>
      <PageHeader
        title={t(
          isEditMode ? 'REPOSITORY.EDIT_REPOSITORY_TITLE' : 'REPOSITORY.NEW_REPOSITORY_TITLE',
        )}
        subtitle={t('REPOSITORY.CONFIGURE_CONN')}
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard eyebrow="01" title={t('REPOSITORY.PROJECT_DETAILS')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="name"
                label={t('REPOSITORY.REPOSITORY_NAME')}
                error={touched.name ? errors.name : ''}
              >
                <div className="relative">
                  <Tag
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    id="name"
                    type="text"
                    className={`${FIELD_INPUT_CLASS} pl-9`}
                    placeholder="my-service"
                    value={form.name}
                    onChange={(event) => update({ name: event.target.value })}
                    onBlur={() => markTouched('name')}
                  />
                </div>
              </FormField>

              <FormField
                id="projectType"
                label={t('REPOSITORY.PROJECT_TYPE')}
                error={touched.projectType ? errors.projectType : ''}
              >
                <select
                  id="projectType"
                  className={FIELD_INPUT_CLASS}
                  disabled={isEditMode}
                  value={form.projectType}
                  onChange={(event) => update({ projectType: event.target.value as ProjectType })}
                  onBlur={() => markTouched('projectType')}
                >
                  <option value="" disabled>
                    {t('REPOSITORY.SELECT_FRAMEWORK')}
                  </option>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                id="costPerDay"
                label={t('REPOSITORY.COST_PER_DAY')}
                error={touched.costPerDay ? errors.costPerDay : ''}
                hint={t('REPOSITORY.COST_MIN')}
              >
                <div className="relative">
                  <Wallet
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    id="costPerDay"
                    type="number"
                    min={MIN_COST_PER_DAY}
                    className={`${FIELD_INPUT_CLASS} pl-9`}
                    value={form.costPerDay}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) => update({ costPerDay: Number(event.target.value) || 0 })}
                    onBlur={() => markTouched('costPerDay')}
                  />
                </div>
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  id="repositoryUrl"
                  label={t('REPOSITORY.GIT_URL')}
                  error={touched.repositoryUrl ? errors.repositoryUrl : ''}
                >
                  <div className="relative">
                    <Link2
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                      id="repositoryUrl"
                      type="url"
                      className={`${FIELD_INPUT_CLASS} pl-9 font-mono text-xs`}
                      placeholder="https://gitlab.com/team/project.git"
                      disabled={isEditMode}
                      value={form.repositoryUrl}
                      onChange={(event) => update({ repositoryUrl: event.target.value })}
                      onBlur={() => markTouched('repositoryUrl')}
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="02" title={t('REPOSITORY.ANALYSIS_CONFIG')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="sonarServerUrl"
                label={t('REPOSITORY.SONAR_SERVER')}
                hint={t('REPOSITORY.FROM_SETTINGS')}
              >
                <div className="relative">
                  <Server
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    id="sonarServerUrl"
                    type="text"
                    readOnly
                    className={`${FIELD_INPUT_CLASS} pl-9 font-mono text-xs text-muted`}
                    value={serverUrl}
                  />
                </div>
              </FormField>

              <FormField
                id="sonarProjectKey"
                label={t('REPOSITORY.PROJECT_KEY')}
                hint={t('REPOSITORY.PROJECT_KEY_HINT')}
              >
                <div className="relative">
                  <Hash
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    id="sonarProjectKey"
                    type="text"
                    readOnly
                    className={`${FIELD_INPUT_CLASS} pl-9 font-mono text-xs text-muted`}
                    value={projectKey}
                  />
                </div>
              </FormField>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-surface-2/50 px-4 py-3 text-xs leading-relaxed text-muted">
              <GitBranch size={15} className="mt-0.5 shrink-0 text-primary" />
              <p>{t('REPOSITORY.SCAN_ON_SAVE_HINT', { branch: SCAN_BRANCH })}</p>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('REPOSITORY.SUMMARY')}
            </p>
            <div className="mt-3 divide-y divide-border">
              <SummaryRow label={t('REPOSITORY.REPOSITORY_NAME')} value={form.name || '—'} />
              <SummaryRow label={t('REPOSITORY.PROJECT_TYPE')} value={typeLabel} />
              <SummaryRow label={t('REPOSITORY.PROJECT_KEY')} value={projectKey || '—'} mono />
              <SummaryRow
                label={t('REPOSITORY.COST_PER_DAY')}
                value={form.costPerDay ? form.costPerDay.toLocaleString() : '—'}
              />
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : isEditMode ? (
                  <Save size={15} />
                ) : (
                  <Plus size={15} />
                )}
                {t(isEditMode ? 'REPOSITORY.SAVE_CHANGES' : 'REPOSITORY.ADD_REPOSITORY')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('REPOSITORY.CLEAR')}
              </button>
              {isEditMode ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  {t('REPOSITORY.TOOLTIP_DELETE')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {t('REPOSITORY.CANCEL')}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showMissingConfig ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('REPOSITORY.CANCEL')}
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMissingConfig(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/12 text-warning">
              <TriangleAlert size={20} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-fg">
              {t('REPOSITORY.MISSING_SONAR_TITLE')}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {t('REPOSITORY.MISSING_SONAR_TEXT')}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMissingConfig(false)}
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

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('REPOSITORY.DELETE_CONFIRM.CANCEL')}
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/12 text-danger">
              <Trash2 size={20} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-fg">
              {t('REPOSITORY.DELETE_CONFIRM.TITLE')}
            </h2>
            <p className="mt-1.5 text-sm text-muted">{t('REPOSITORY.DELETE_CONFIRM.TEXT')}</p>
            <p className="mt-2 truncate text-sm font-medium text-fg">{form.name}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
              >
                {t('REPOSITORY.DELETE_CONFIRM.CANCEL')}
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
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
