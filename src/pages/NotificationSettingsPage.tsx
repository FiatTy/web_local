import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bug,
  FileText,
  Loader2,
  RotateCcw,
  Save,
  ScanLine,
  ServerCog,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Switch } from '@/components/common/Switch';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/lib/toast/toast-context';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/features/setting/hooks/useNotificationSettings';

interface NotificationFormState {
  scansEnabled: boolean;
  issuesEnabled: boolean;
  systemEnabled: boolean;
  reportsEnabled: boolean;
}

const DEFAULT_FORM: NotificationFormState = {
  scansEnabled: true,
  issuesEnabled: true,
  systemEnabled: true,
  reportsEnabled: true,
};

const NOTIFICATION_TYPES: {
  key: keyof NotificationFormState;
  icon: LucideIcon;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    key: 'scansEnabled',
    icon: ScanLine,
    labelKey: 'NOTIFICATION_SETTINGS.SCANS_COMPLETED',
    descriptionKey: 'NOTIFICATION_SETTINGS.SCANS_DESC',
  },
  {
    key: 'issuesEnabled',
    icon: Bug,
    labelKey: 'NOTIFICATION_SETTINGS.ISSUES',
    descriptionKey: 'NOTIFICATION_SETTINGS.ISSUES_DESC',
  },
  {
    key: 'systemEnabled',
    icon: ServerCog,
    labelKey: 'NOTIFICATION_SETTINGS.SYSTEM_ALERTS',
    descriptionKey: 'NOTIFICATION_SETTINGS.SYSTEM_DESC',
  },
  {
    key: 'reportsEnabled',
    icon: FileText,
    labelKey: 'NOTIFICATION_SETTINGS.REPORTS_EXPORTS',
    descriptionKey: 'NOTIFICATION_SETTINGS.REPORTS_DESC',
  },
];

export function NotificationSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const settingsQuery = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const [form, setForm] = useState<NotificationFormState>(DEFAULT_FORM);
  const [savedForm, setSavedForm] = useState<NotificationFormState>(DEFAULT_FORM);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || !settingsQuery.data) {
      return;
    }
    hydrated.current = true;
    const next: NotificationFormState = {
      scansEnabled: Boolean(settingsQuery.data.scansEnabled),
      issuesEnabled: Boolean(settingsQuery.data.issuesEnabled),
      systemEnabled: Boolean(settingsQuery.data.systemEnabled),
      reportsEnabled: Boolean(settingsQuery.data.reportsEnabled),
    };
    setForm(next);
    setSavedForm(next);
  }, [settingsQuery.data]);

  const enabledCount = NOTIFICATION_TYPES.filter((type) => form[type.key]).length;
  const isDirty = NOTIFICATION_TYPES.some((type) => form[type.key] !== savedForm[type.key]);
  const isSaving = updateSettings.isPending;

  function toggle(key: keyof NotificationFormState, checked: boolean) {
    setForm((current) => ({ ...current, [key]: checked }));
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    showToast({
      tone: 'info',
      title: t('NOTIFICATION_SETTINGS.RESET_TITLE'),
      description: t('NOTIFICATION_SETTINGS.RESET_TEXT'),
    });
  }

  async function handleSave() {
    if (!user?.id) {
      return;
    }
    try {
      await updateSettings.mutateAsync({ ...form, userId: user.id });
      setSavedForm(form);
      showToast({
        tone: 'success',
        title: t('NOTIFICATION_SETTINGS.CONFIRM_SAVE_TITLE'),
        description: t('NOTIFICATION_SETTINGS.CONFIRM_SAVE_TEXT'),
      });
    } catch {
      showToast({
        tone: 'error',
        title: t('NOTIFICATION_SETTINGS.ERROR_TITLE'),
        description: t('NOTIFICATION_SETTINGS.ERROR_TEXT'),
      });
    }
  }

  return (
    <div>
      <PageHeader
        title={t('NOTIFICATION_SETTINGS.TITLE')}
        subtitle={t('NOTIFICATION_SETTINGS.SUBTITLE')}
        actions={
          <>
            {isDirty ? (
              <span className="mr-1 hidden items-center gap-1.5 text-xs text-warning sm:inline-flex">
                <TriangleAlert size={13} />
                {t('NOTIFICATION_SETTINGS.UNSAVED_CHANGES')}
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={15} />
              {t('NOTIFICATION_SETTINGS.RESET')}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {t(isSaving ? 'NOTIFICATION_SETTINGS.SAVING' : 'NOTIFICATION_SETTINGS.SAVE')}
            </button>
          </>
        }
      />

      {settingsQuery.isError ? (
        <div className="mb-4 flex max-w-3xl items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <p>{t('NOTIFICATION_SETTINGS.LOAD_ERROR')}</p>
        </div>
      ) : null}

      <section className="max-w-3xl rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              {t('NOTIFICATION_SETTINGS.TYPES')}
            </p>
            <h2 className="mt-1 text-sm font-semibold text-fg">
              {t('NOTIFICATION_SETTINGS.TYPES_HINT')}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted">
            {t('NOTIFICATION_SETTINGS.ENABLED_SUMMARY', {
              enabled: enabledCount,
              total: NOTIFICATION_TYPES.length,
            })}
          </span>
        </div>

        {settingsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" />
            {t('NOTIFICATION_SETTINGS.LOADING')}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {NOTIFICATION_TYPES.map((type) => (
              <li key={type.key} className="px-5 py-4">
                <Switch
                  id={type.key}
                  align="between"
                  icon={type.icon}
                  checked={form[type.key]}
                  onChange={(checked) => toggle(type.key, checked)}
                  label={t(type.labelKey)}
                  description={t(type.descriptionKey)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
