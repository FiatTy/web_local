import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Eye,
  EyeOff,
  Loader2,
  Plug,
  PlugZap,
  RotateCcw,
  Save,
  ShieldCheck,
  TriangleAlert,
  Unplug,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { Switch } from '@/components/common/Switch';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import {
  useSonarQubeConfig,
  useUpdateSonarQubeConfig,
} from '@/features/setting/hooks/useSonarQubeConfig';
import { useTestSonarConnection } from '@/features/setting/hooks/useTestSonarConnection';
import type { BuildTool, SonarQubeConfig, SonarQubeConfigPayload } from '@/features/setting/types';

type ConnectionState = 'unknown' | 'connected' | 'failed';

type GateKey =
  | 'qgCoverageThreshold'
  | 'qgMaxBugs'
  | 'qgMaxVulnerabilities'
  | 'qgMaxCodeSmells'
  | 'qgMaxDuplications'
  | 'qgMaxSecurityHotspots';

interface SonarQubeFormState {
  serverUrl: string;
  authToken: string;
  organization: string;
  gitAccessToken: string;
  angularRunNpm: boolean;
  angularCoverage: boolean;
  angularTsFiles: boolean;
  angularExclusions: string;
  springRunTests: boolean;
  springJacoco: boolean;
  springBuildTool: BuildTool;
  springJdkVersion: number;
  qgFailOnError: boolean;
  qgCoverageThreshold: number;
  qgMaxBugs: number;
  qgMaxVulnerabilities: number;
  qgMaxCodeSmells: number;
  qgMaxDuplications: number;
  qgMaxSecurityHotspots: number;
}

const DEFAULT_EXCLUSIONS = '**/node_modules/**,**/dist/**,**/*.spec.ts';
const JDK_VERSIONS = [8, 11, 17, 21, 25];
const TOKEN_MIN_LENGTH = 10;
const URL_PATTERN = /^https?:\/\/.+/;

const BUILD_TOOLS: { value: BuildTool; labelKey: string }[] = [
  { value: 'maven', labelKey: 'SONARQUBE_CONFIG.MAVEN' },
  { value: 'gradle', labelKey: 'SONARQUBE_CONFIG.GRADLE' },
];

const DEFAULT_FORM: SonarQubeFormState = {
  serverUrl: '',
  authToken: '',
  organization: '',
  gitAccessToken: '',
  angularRunNpm: false,
  angularCoverage: false,
  angularTsFiles: false,
  angularExclusions: DEFAULT_EXCLUSIONS,
  springRunTests: false,
  springJacoco: false,
  springBuildTool: 'maven',
  springJdkVersion: 21,
  qgFailOnError: false,
  qgCoverageThreshold: 0,
  qgMaxBugs: 0,
  qgMaxVulnerabilities: 0,
  qgMaxCodeSmells: 0,
  qgMaxDuplications: 0,
  qgMaxSecurityHotspots: 0,
};

const CONNECTION_META: Record<
  ConnectionState,
  { icon: LucideIcon; chip: string; badge: string; labelKey: string }
> = {
  unknown: {
    icon: Plug,
    chip: 'border-border bg-surface-2 text-muted',
    badge: 'bg-surface-2 text-muted',
    labelKey: 'SONARQUBE_CONFIG.CONNECTION_UNKNOWN',
  },
  connected: {
    icon: PlugZap,
    chip: 'border-success/30 bg-success/12 text-success',
    badge: 'bg-success/12 text-success',
    labelKey: 'SONARQUBE_CONFIG.CONNECTION_OK',
  },
  failed: {
    icon: Unplug,
    chip: 'border-danger/30 bg-danger/12 text-danger',
    badge: 'bg-danger/12 text-danger',
    labelKey: 'SONARQUBE_CONFIG.CONNECTION_FAILED',
  },
};

function toFormState(config: SonarQubeConfig): SonarQubeFormState {
  return {
    serverUrl: config.serverUrl || '',
    authToken: config.authToken || '',
    organization: config.organization || '',
    gitAccessToken: config.gitAccessToken || '',
    angularRunNpm: Boolean(config.angularRunNpm),
    angularCoverage: Boolean(config.angularCoverage),
    angularTsFiles: Boolean(config.angularTsFiles),
    angularExclusions: config.angularExclusions || DEFAULT_EXCLUSIONS,
    springRunTests: Boolean(config.springRunTests),
    springJacoco: Boolean(config.springJacoco),
    springBuildTool: config.springBuildTool === 'gradle' ? 'gradle' : 'maven',
    springJdkVersion: config.springJdkVersion || 21,
    qgFailOnError: Boolean(config.qgFailOnError),
    qgCoverageThreshold: config.qgCoverageThreshold ?? 0,
    qgMaxBugs: config.qgMaxBugs ?? 0,
    qgMaxVulnerabilities: config.qgMaxVulnerabilities ?? 0,
    qgMaxCodeSmells: config.qgMaxCodeSmells ?? 0,
    qgMaxDuplications: config.qgMaxDuplications ?? 0,
    qgMaxSecurityHotspots: config.qgMaxSecurityHotspots ?? 0,
  };
}

function trimForm(form: SonarQubeFormState): SonarQubeFormState {
  return {
    ...form,
    serverUrl: form.serverUrl.trim(),
    authToken: form.authToken.trim(),
    organization: form.organization.trim(),
    gitAccessToken: form.gitAccessToken.trim(),
    angularExclusions: form.angularExclusions.trim(),
  };
}

function toPayload(form: SonarQubeFormState, userId: string): SonarQubeConfigPayload {
  return { ...form, userId };
}

function readNumber(value: string, max?: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  const floored = Math.max(0, Math.round(parsed));
  return max === undefined ? floored : Math.min(max, floored);
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || fallback;
  }
  return fallback;
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-sm font-semibold text-fg">{title}</h2>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function SonarQubeConfigPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const configQuery = useSonarQubeConfig();
  const updateConfig = useUpdateSonarQubeConfig();
  const testConnection = useTestSonarConnection();

  const [form, setForm] = useState<SonarQubeFormState>(DEFAULT_FORM);
  const [savedForm, setSavedForm] = useState<SonarQubeFormState>(DEFAULT_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showToken, setShowToken] = useState(false);
  const [showGitToken, setShowGitToken] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('unknown');
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || !configQuery.data) {
      return;
    }
    hydrated.current = true;
    const next = toFormState(configQuery.data);
    setForm(next);
    setSavedForm(next);
  }, [configQuery.data]);

  const errors = useMemo(() => {
    const serverUrl = form.serverUrl.trim();
    const authToken = form.authToken.trim();
    const gitAccessToken = form.gitAccessToken.trim();
    return {
      serverUrl: !serverUrl
        ? t('SONARQUBE_CONFIG.URL_REQUIRED')
        : !URL_PATTERN.test(serverUrl)
          ? t('SONARQUBE_CONFIG.URL_INVALID')
          : '',
      authToken: !authToken
        ? t('SONARQUBE_CONFIG.AUTH_TOKEN_REQUIRED')
        : authToken.length < TOKEN_MIN_LENGTH
          ? t('SONARQUBE_CONFIG.TOKEN_MIN_LENGTH')
          : '',
      gitAccessToken: !gitAccessToken
        ? t('SONARQUBE_CONFIG.GIT_TOKEN_REQUIRED')
        : gitAccessToken.length < TOKEN_MIN_LENGTH
          ? t('SONARQUBE_CONFIG.TOKEN_MIN_LENGTH')
          : '',
    };
  }, [form.serverUrl, form.authToken, form.gitAccessToken, t]);

  const isValid = !errors.serverUrl && !errors.authToken && !errors.gitAccessToken;
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const isSaving = updateConfig.isPending;
  const isTesting = testConnection.isPending;

  function update(patch: Partial<SonarQubeFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function markTouched(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
    setForm((current) => trimForm(current));
  }

  function updateGate(key: GateKey, value: number) {
    setForm((current) => {
      const next = { ...current };
      next[key] = value;
      return next;
    });
  }

  async function runConnectionTest(values: SonarQubeFormState): Promise<boolean> {
    if (!values.serverUrl) {
      showToast({
        tone: 'warning',
        title: t('SONARQUBE_CONFIG.SWAL.MISSING_URL_TITLE'),
        description: t('SONARQUBE_CONFIG.SWAL.MISSING_URL_TEXT'),
      });
      return false;
    }
    if (!values.authToken) {
      showToast({
        tone: 'warning',
        title: t('SONARQUBE_CONFIG.SWAL.MISSING_TOKEN_TITLE'),
        description: t('SONARQUBE_CONFIG.SWAL.MISSING_TOKEN_TEXT'),
      });
      return false;
    }

    try {
      const response = await testConnection.mutateAsync({
        sonarHostUrl: values.serverUrl,
        sonarToken: values.authToken,
      });
      if (response.connected) {
        setConnectionState('connected');
        showToast({
          tone: 'success',
          title: t('SONARQUBE_CONFIG.SWAL.CONN_SUCCESS_TITLE'),
          description: t('SONARQUBE_CONFIG.SWAL.CONN_SUCCESS_TEXT'),
        });
        return true;
      }
      setConnectionState('failed');
      showToast({
        tone: 'error',
        title: t('SONARQUBE_CONFIG.SWAL.CONN_FAILED_TITLE'),
        description: t('SONARQUBE_CONFIG.SWAL.CONN_FAILED_TEXT'),
      });
      return false;
    } catch (error) {
      setConnectionState('failed');
      showToast({
        tone: 'error',
        title: t('SONARQUBE_CONFIG.SWAL.CONN_FAILED_TITLE'),
        description: readErrorMessage(error, t('SONARQUBE_CONFIG.SWAL.CONN_FAILED_TEXT')),
      });
      return false;
    }
  }

  async function handleTestConnection() {
    const trimmed = trimForm(form);
    setForm(trimmed);
    await runConnectionTest(trimmed);
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setTouched({});
    setConnectionState('unknown');
    showToast({
      tone: 'info',
      title: t('SONARQUBE_CONFIG.SWAL.RESET_TITLE'),
      description: t('SONARQUBE_CONFIG.SWAL.RESET_TEXT'),
    });
  }

  async function handleSave() {
    const trimmed = trimForm(form);
    setForm(trimmed);
    setTouched({ serverUrl: true, authToken: true, gitAccessToken: true });

    const connected = await runConnectionTest(trimmed);
    if (!connected || !user?.id) {
      return;
    }

    try {
      await updateConfig.mutateAsync(toPayload(trimmed, user.id));
      setSavedForm(trimmed);
      showToast({
        tone: 'success',
        title: t('SONARQUBE_CONFIG.SWAL.SAVE_SUCCESS_TITLE'),
        description: t('SONARQUBE_CONFIG.SWAL.SAVE_SUCCESS_TEXT'),
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: t('SONARQUBE_CONFIG.SWAL.SAVE_FAILED_TITLE'),
        description: readErrorMessage(error, t('SONARQUBE_CONFIG.SWAL.SAVE_FAILED_TEXT')),
      });
    }
  }

  const connectionMeta = CONNECTION_META[connectionState];
  const ConnectionIcon = connectionMeta.icon;

  const gateFields: { key: GateKey; labelKey: string; max?: number }[] = [
    {
      key: 'qgCoverageThreshold',
      labelKey: 'SONARQUBE_CONFIG.COVERAGE_THRESHOLD',
      max: 100,
    },
    { key: 'qgMaxBugs', labelKey: 'SONARQUBE_CONFIG.MAX_BUGS' },
    {
      key: 'qgMaxVulnerabilities',
      labelKey: 'SONARQUBE_CONFIG.MAX_VULNERABILITIES',
    },
    { key: 'qgMaxCodeSmells', labelKey: 'SONARQUBE_CONFIG.MAX_CODE_SMELLS' },
    { key: 'qgMaxDuplications', labelKey: 'SONARQUBE_CONFIG.MAX_DUPLICATIONS' },
    {
      key: 'qgMaxSecurityHotspots',
      labelKey: 'SONARQUBE_CONFIG.MAX_SECURITY_HOTSPOTS',
    },
  ];

  if (configQuery.isLoading) {
    return (
      <div>
        <PageHeader title={t('SONARQUBE_CONFIG.TITLE')} subtitle={t('SONARQUBE_CONFIG.SUBTITLE')} />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[220, 260, 200].map((height) => (
              <div
                key={height}
                className="animate-pulse rounded-xl border border-border bg-surface"
                style={{ height }}
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('SONARQUBE_CONFIG.TITLE')}
        subtitle={t('SONARQUBE_CONFIG.SUBTITLE')}
        actions={
          <span
            className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium ${connectionMeta.chip}`}
          >
            <ConnectionIcon size={14} />
            {t(connectionMeta.labelKey)}
          </span>
        }
      />

      {configQuery.isError ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <p>{t('SONARQUBE_CONFIG.LOAD_ERROR')}</p>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            eyebrow="01"
            title={t('SONARQUBE_CONFIG.SERVER_CONFIG')}
            description={t('SONARQUBE_CONFIG.SERVER_CONFIG_HINT')}
          >
            <div className="space-y-4">
              <FormField
                id="serverUrl"
                label={t('SONARQUBE_CONFIG.SERVER_URL')}
                error={touched.serverUrl ? errors.serverUrl : ''}
              >
                <input
                  id="serverUrl"
                  type="url"
                  className={FIELD_INPUT_CLASS}
                  placeholder="https://sonarqube.example.com"
                  value={form.serverUrl}
                  onChange={(event) => update({ serverUrl: event.target.value })}
                  onBlur={() => markTouched('serverUrl')}
                />
              </FormField>

              <FormField
                id="authToken"
                label={t('SONARQUBE_CONFIG.AUTH_TOKEN')}
                error={touched.authToken ? errors.authToken : ''}
              >
                <div className="relative">
                  <input
                    id="authToken"
                    type={showToken ? 'text' : 'password'}
                    className={`${FIELD_INPUT_CLASS} pr-11 font-mono`}
                    value={form.authToken}
                    onChange={(event) => update({ authToken: event.target.value })}
                    onBlur={() => markTouched('authToken')}
                  />
                  <button
                    type="button"
                    aria-label={t(showToken ? 'SONARQUBE_CONFIG.HIDE' : 'SONARQUBE_CONFIG.SHOW')}
                    onClick={() => setShowToken((current) => !current)}
                    className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
                  >
                    {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormField>

              <FormField
                id="gitAccessToken"
                label={t('SONARQUBE_CONFIG.GIT_TOKEN')}
                error={touched.gitAccessToken ? errors.gitAccessToken : ''}
              >
                <div className="relative">
                  <input
                    id="gitAccessToken"
                    type={showGitToken ? 'text' : 'password'}
                    maxLength={255}
                    className={`${FIELD_INPUT_CLASS} pr-11 font-mono`}
                    value={form.gitAccessToken}
                    onChange={(event) => update({ gitAccessToken: event.target.value })}
                    onBlur={() => markTouched('gitAccessToken')}
                  />
                  <button
                    type="button"
                    aria-label={t(showGitToken ? 'SONARQUBE_CONFIG.HIDE' : 'SONARQUBE_CONFIG.SHOW')}
                    onClick={() => setShowGitToken((current) => !current)}
                    className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
                  >
                    {showGitToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormField>

              <FormField id="organization" label={t('SONARQUBE_CONFIG.DEFAULT_ORG')}>
                <input
                  id="organization"
                  type="text"
                  maxLength={50}
                  className={FIELD_INPUT_CLASS}
                  placeholder="PCCTH"
                  value={form.organization}
                  onChange={(event) => update({ organization: event.target.value })}
                  onBlur={() => markTouched('organization')}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="02"
            title={t('SONARQUBE_CONFIG.SCANNER_SETTINGS')}
            description={t('SONARQUBE_CONFIG.SCANNER_SETTINGS_HINT')}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-2/40 p-4">
                <h3 className="text-sm font-semibold text-fg">
                  {t('SONARQUBE_CONFIG.ANGULAR_PROJECTS')}
                </h3>
                <div className="mt-4 space-y-3">
                  <Switch
                    id="angularRunNpm"
                    checked={form.angularRunNpm}
                    onChange={(checked) => update({ angularRunNpm: checked })}
                    label={t('SONARQUBE_CONFIG.RUN_NPM')}
                  />
                  <Switch
                    id="angularCoverage"
                    checked={form.angularCoverage}
                    onChange={(checked) => update({ angularCoverage: checked })}
                    label={t('SONARQUBE_CONFIG.GENERATE_COVERAGE')}
                  />
                  <Switch
                    id="angularTsFiles"
                    checked={form.angularTsFiles}
                    onChange={(checked) => update({ angularTsFiles: checked })}
                    label={t('SONARQUBE_CONFIG.INCLUDE_TS')}
                  />
                </div>
                <div className="mt-4">
                  <FormField
                    id="angularExclusions"
                    label={t('SONARQUBE_CONFIG.EXCLUSIONS')}
                    hint={t('SONARQUBE_CONFIG.COMMA_SEPARATED')}
                  >
                    <input
                      id="angularExclusions"
                      type="text"
                      className={`${FIELD_INPUT_CLASS} font-mono text-xs`}
                      placeholder={DEFAULT_EXCLUSIONS}
                      value={form.angularExclusions}
                      onChange={(event) => update({ angularExclusions: event.target.value })}
                      onBlur={() => markTouched('angularExclusions')}
                    />
                  </FormField>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-2/40 p-4">
                <h3 className="text-sm font-semibold text-fg">
                  {t('SONARQUBE_CONFIG.SPRING_PROJECTS')}
                </h3>
                <div className="mt-4 space-y-3">
                  <Switch
                    id="springRunTests"
                    checked={form.springRunTests}
                    onChange={(checked) => update({ springRunTests: checked })}
                    label={t('SONARQUBE_CONFIG.RUN_TESTS')}
                  />
                  <Switch
                    id="springJacoco"
                    checked={form.springJacoco}
                    onChange={(checked) => update({ springJacoco: checked })}
                    label={t('SONARQUBE_CONFIG.INCLUDE_JACOCO')}
                  />
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                      {t('SONARQUBE_CONFIG.BUILD_TOOL')}
                    </p>
                    <div className="mt-1.5 inline-flex rounded-lg border border-border bg-surface p-0.5">
                      {BUILD_TOOLS.map((tool) => {
                        const active = form.springBuildTool === tool.value;
                        return (
                          <button
                            key={tool.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => update({ springBuildTool: tool.value })}
                            className={`h-8 rounded-md px-5 text-xs font-medium transition ${
                              active ? 'bg-primary-subtle text-primary' : 'text-muted hover:text-fg'
                            }`}
                          >
                            {t(tool.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <FormField id="springJdkVersion" label={t('SONARQUBE_CONFIG.JDK_VERSION')}>
                    <select
                      id="springJdkVersion"
                      className={FIELD_INPUT_CLASS}
                      value={form.springJdkVersion}
                      onChange={(event) => update({ springJdkVersion: Number(event.target.value) })}
                    >
                      {JDK_VERSIONS.map((version) => (
                        <option key={version} value={version}>
                          {version}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="03"
            title={t('SONARQUBE_CONFIG.QUALITY_GATES')}
            description={t('SONARQUBE_CONFIG.QUALITY_GATES_HINT')}
          >
            <div className="rounded-lg border border-border bg-surface-2/40 px-4 py-3.5">
              <Switch
                id="qgFailOnError"
                checked={form.qgFailOnError}
                onChange={(checked) => update({ qgFailOnError: checked })}
                label={t('SONARQUBE_CONFIG.FAIL_ON_ERROR')}
                description={form.qgFailOnError ? undefined : t('SONARQUBE_CONFIG.GATE_HINT')}
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gateFields.map((field) => (
                <FormField key={field.key} id={field.key} label={t(field.labelKey)}>
                  <input
                    id={field.key}
                    type="number"
                    min={0}
                    max={field.max}
                    className={FIELD_INPUT_CLASS}
                    value={form[field.key]}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) =>
                      updateGate(field.key, readNumber(event.target.value, field.max))
                    }
                  />
                </FormField>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('SONARQUBE_CONFIG.CONNECTION_STATUS')}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${connectionMeta.badge}`}
              >
                {isTesting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ConnectionIcon size={18} />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">
                  {isTesting ? t('SONARQUBE_CONFIG.TESTING') : t(connectionMeta.labelKey)}
                </p>
                <p className="truncate text-xs text-faint">
                  {form.serverUrl || t('SONARQUBE_CONFIG.NO_SERVER_URL')}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!isValid || isSaving || isTesting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {t('SONARQUBE_CONFIG.SAVE_SETTINGS')}
              </button>
              <button
                type="button"
                onClick={() => void handleTestConnection()}
                disabled={isTesting || isSaving}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTesting ? <Loader2 size={15} className="animate-spin" /> : <PlugZap size={15} />}
                {t(isTesting ? 'SONARQUBE_CONFIG.TESTING' : 'SONARQUBE_CONFIG.TEST_CONNECTION')}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving || isTesting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={15} />
                {t('SONARQUBE_CONFIG.RESET')}
              </button>
            </div>

            {isDirty ? (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-warning">
                <TriangleAlert size={13} />
                {t('SONARQUBE_CONFIG.UNSAVED_CHANGES')}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-primary" />
              <h3 className="text-sm font-semibold text-fg">
                {t('SONARQUBE_CONFIG.HOW_TO_GET_GIT_TOKEN')}
              </h3>
            </div>
            <ol className="mt-3 space-y-2.5">
              {['STEP_1', 'STEP_2', 'STEP_3', 'STEP_4'].map((step, index) => (
                <li key={step} className="flex gap-2.5 text-xs leading-relaxed text-muted">
                  <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[10px] font-semibold text-faint">
                    {index + 1}
                  </span>
                  {t(`SONARQUBE_CONFIG.${step}`)}
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-lg bg-primary-subtle px-3 py-2 text-xs leading-relaxed text-primary">
              {t('SONARQUBE_CONFIG.TOOLTIP_NOTE')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
