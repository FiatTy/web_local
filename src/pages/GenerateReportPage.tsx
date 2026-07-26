import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarRange, FileText, FolderGit2, Layers, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { Switch } from '@/components/common/Switch';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import { useRepositories } from '@/features/repository/hooks/useRepositories';
import { useScanHistory } from '@/features/scan/hooks/useScanHistory';
import { useGenerateReportPdf } from '@/features/report/hooks/useReports';
import { downloadBase64 } from '@/features/report/api/report.api';
import { notificationsQueryKey } from '@/features/notification/hooks/useNotifications';
import { generateReportNotification } from '@/features/notification/lib/notification-generator';
import { useNotificationSettings } from '@/features/setting/hooks/useNotificationSettings';
import type { ReportSections } from '@/features/report/types';

const SECTION_FIELDS: { key: keyof ReportSections; labelKey: string }[] = [
  {
    key: 'qualityGate',
    labelKey: 'GENERATE_REPORT.SECTIONS.QualityGateSummary',
  },
  {
    key: 'issueBreakdown',
    labelKey: 'GENERATE_REPORT.SECTIONS.IssueBreakdown',
  },
  {
    key: 'securityAnalysis',
    labelKey: 'GENERATE_REPORT.SECTIONS.SecurityAnalysis',
  },
  { key: 'technicalDebt', labelKey: 'GENERATE_REPORT.SECTIONS.TechnicalDebt' },
  {
    key: 'recommendations',
    labelKey: 'GENERATE_REPORT.SECTIONS.Recommendations',
  },
];

const DEFAULT_SECTIONS: ReportSections = {
  qualityGate: true,
  issueBreakdown: true,
  securityAnalysis: false,
  technicalDebt: false,
  recommendations: false,
};

function SectionCard({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
          <Icon size={15} />
        </span>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            {eyebrow}
          </p>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function GenerateReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const repositoriesQuery = useRepositories();
  const scansQuery = useScanHistory();
  const generatePdf = useGenerateReportPdf();
  const queryClient = useQueryClient();
  const { data: notificationSettings } = useNotificationSettings();

  const [projectId, setProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sections, setSections] = useState<ReportSections>(DEFAULT_SECTIONS);
  const [submitted, setSubmitted] = useState(false);

  const repositories = useMemo(() => repositoriesQuery.data ?? [], [repositoriesQuery.data]);
  const selectedProject = repositories.find((repo) => repo.projectId === projectId);

  const scansInRange = useMemo(() => {
    if (!projectId || !dateFrom || !dateTo) {
      return [];
    }
    const from = new Date(`${dateFrom}T00:00:00`).getTime();
    const to = new Date(`${dateTo}T23:59:59`).getTime();
    return (scansQuery.data ?? []).filter((scan) => {
      if (scan.projectId !== projectId) {
        return false;
      }
      const time = new Date(scan.completedAt ?? scan.startedAt).getTime();
      return time >= from && time <= to;
    });
  }, [scansQuery.data, projectId, dateFrom, dateTo]);

  const dateError = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return t('GENERATE_REPORT.DATE_REQUIRED');
    }
    if (new Date(dateFrom).getTime() > new Date(dateTo).getTime()) {
      return t('GENERATE_REPORT.DATE_INVALID');
    }
    return '';
  }, [dateFrom, dateTo, t]);

  const projectError = projectId ? '' : t('GENERATE_REPORT.PROJECT_REQUIRED');
  const noScanError =
    !projectError && !dateError && scansInRange.length === 0
      ? t('GENERATE_REPORT.NO_SCAN_FOUND')
      : '';

  const isValid = !projectError && !dateError && !noScanError;

  function toggleSection(key: keyof ReportSections, checked: boolean) {
    setSections((current) => ({ ...current, [key]: checked }));
  }

  async function handleGenerate() {
    setSubmitted(true);
    if (!isValid || !selectedProject) {
      return;
    }

    try {
      const response = await generatePdf.mutateAsync({
        projectId: selectedProject.projectId,
        dateFrom,
        dateTo,
        format: 'pdf',
        sections,
        userId: user?.id,
        generatedBy: user?.username || 'Unknown',
      });
      downloadBase64(response.base64, response.fileName, response.mimeType);
      notifyReport(selectedProject.name, true);
      showToast({
        tone: 'success',
        title: t('GENERATE_REPORT.SNACKBAR.SUCCESS'),
        description: selectedProject.name,
      });
    } catch {
      notifyReport(selectedProject.name, false);
      showToast({
        tone: 'error',
        title: t('GENERATE_REPORT.SNACKBAR.FAILED'),
        description: selectedProject.name,
      });
    }
  }

  function notifyReport(projectName: string, succeeded: boolean) {
    if (!user?.id || notificationSettings?.reportsEnabled === false) {
      return;
    }
    void generateReportNotification({ projectId, projectName, succeeded }, user.id).then(
      (created) => {
        if (created) {
          void queryClient.invalidateQueries({
            queryKey: notificationsQueryKey(user.id),
          });
        }
      },
    );
  }

  return (
    <div>
      <PageHeader title={t('GENERATE_REPORT.TITLE')} subtitle={t('GENERATE_REPORT.SUBTITLE')} />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            eyebrow="01"
            title={t('GENERATE_REPORT.PROJECTS_TO_INCLUDE')}
            icon={FolderGit2}
          >
            <FormField
              id="reportProject"
              label={t('GENERATE_REPORT.SELECT_PROJECT')}
              error={submitted ? projectError : ''}
            >
              <select
                id="reportProject"
                className={FIELD_INPUT_CLASS}
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">{t('GENERATE_REPORT.SELECT_PROJECT')}</option>
                {repositories.map((repo) => (
                  <option key={repo.projectId} value={repo.projectId}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </FormField>
          </SectionCard>

          <SectionCard eyebrow="02" title={t('GENERATE_REPORT.DATE_RANGE')} icon={CalendarRange}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="dateFrom" label={t('SCAN.START_DATE')}>
                <input
                  id="dateFrom"
                  type="date"
                  className={FIELD_INPUT_CLASS}
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </FormField>
              <FormField id="dateTo" label={t('SCAN.END_DATE')}>
                <input
                  id="dateTo"
                  type="date"
                  className={FIELD_INPUT_CLASS}
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </FormField>
            </div>
            {submitted && (dateError || noScanError) ? (
              <p role="alert" className="mt-3 text-xs text-danger">
                {dateError || noScanError}
              </p>
            ) : null}
          </SectionCard>

          <SectionCard eyebrow="03" title={t('GENERATE_REPORT.INCLUDE_SECTIONS')} icon={Layers}>
            <div className="space-y-3">
              {SECTION_FIELDS.map((field) => (
                <Switch
                  key={field.key}
                  id={field.key}
                  align="between"
                  checked={sections[field.key]}
                  onChange={(checked) => toggleSection(field.key, checked)}
                  label={t(field.labelKey)}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('GENERATE_REPORT.OUTPUT_FORMAT')}
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary-subtle px-4 py-3">
              <FileText size={18} className="text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">PDF</p>
                <p className="text-xs text-muted">{t('GENERATE_REPORT.PDF_HINT')}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  {t('REPORT_HISTORY.PROJECT')}
                </dt>
                <dd className="min-w-0 truncate text-right text-fg">
                  {selectedProject?.name ?? '—'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  {t('GENERATE_REPORT.SCANS_IN_RANGE')}
                </dt>
                <dd className="text-right font-mono text-xs text-fg">{scansInRange.length}</dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generatePdf.isPending}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatePdf.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <FileText size={15} />
                )}
                {t(
                  generatePdf.isPending ? 'GENERATE_REPORT.GENERATING' : 'GENERATE_REPORT.GENERATE',
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {t('GENERATE_REPORT.CANCEL')}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
