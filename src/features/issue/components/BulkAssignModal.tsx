import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { useUsers } from '@/features/user/hooks/useUsers';
import { updateIssue } from '@/features/issue/api/issue.api';
import { issuesQueryKey } from '@/features/issue/hooks/useIssues';
import { useToast } from '@/lib/toast/toast-context';
import type { Issue } from '@/features/issue/types';

interface BulkAssignModalProps {
  issues: Issue[];
  onClose: () => void;
  onDone: () => void;
}

export function BulkAssignModal({ issues, onClose, onDone }: BulkAssignModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const usersQuery = useUsers();

  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    if (!assignedTo) {
      setError(t('ISSUE_MODAL.PLEASE_SELECT_USER'));
      return;
    }
    setError('');
    setIsSaving(true);

    const results = await Promise.allSettled(
      issues.map((issue) => updateIssue({ id: issue.id, assignedTo, status: 'IN_PROGRESS' })),
    );
    const succeeded = results.filter((result) => result.status === 'fulfilled').length;

    void queryClient.invalidateQueries({ queryKey: issuesQueryKey });
    setIsSaving(false);

    if (succeeded === 0) {
      setError(t('ISSUE.BULK_ASSIGN_FAILED'));
      return;
    }

    showToast({
      tone: succeeded === issues.length ? 'success' : 'warning',
      title: t('ISSUE.BULK_ASSIGN_DONE', { count: succeeded }),
      description: succeeded === issues.length ? undefined : t('ISSUE.BULK_ASSIGN_FAILED'),
    });
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('ISSUE_MODAL.CANCEL')}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">
            {t('ISSUE.BULK_ASSIGN_TITLE', { count: issues.length })}
          </h2>
          <button
            type="button"
            aria-label={t('COMMON.CLOSE')}
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border bg-surface-2/40 px-3 py-2">
            {issues.map((issue) => (
              <li key={issue.id} className="truncate text-xs text-muted" title={issue.message}>
                {issue.message || issue.issueKey}
              </li>
            ))}
          </ul>

          <FormField id="bulkAssignedTo" label={t('ISSUE_MODAL.ASSIGN_TO')} error={error}>
            <select
              id="bulkAssignedTo"
              className={FIELD_INPUT_CLASS}
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
            >
              <option value="">{t('ISSUE_MODAL.SELECT_USER')}</option>
              {(usersQuery.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
          >
            {t('ISSUE_MODAL.CANCEL')}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
            {t('ISSUE_MODAL.SAVE')}
          </button>
        </div>
      </div>
    </div>
  );
}
