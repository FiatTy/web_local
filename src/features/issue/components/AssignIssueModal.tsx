import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';
import { FIELD_INPUT_CLASS, FormField } from '@/components/common/FormField';
import { UserSelect } from '@/features/user/components/UserSelect';
import { useUpdateIssue } from '@/features/issue/hooks/useIssue';
import type { Issue } from '@/features/issue/types';

const STATUS_OPTIONS = [
  { value: 'OPEN', labelKey: 'ISSUE.OPEN' },
  { value: 'IN_PROGRESS', labelKey: 'ISSUE.IN_PROGRESS' },
  { value: 'CLOSED', labelKey: 'ISSUE.CLOSED' },
];

interface AssignIssueModalProps {
  issue: Issue;
  mode: 'assign' | 'status';
  onClose: () => void;
  onSaved?: () => void;
}

export function AssignIssueModal({ issue, mode, onClose, onSaved }: AssignIssueModalProps) {
  const { t } = useTranslation();
  const updateIssue = useUpdateIssue();

  const [assignedTo, setAssignedTo] = useState(issue.assignedId ?? '');
  const [status, setStatus] = useState(issue.status || 'OPEN');
  const [error, setError] = useState('');
  const [loadedIssueId, setLoadedIssueId] = useState(issue.id);

  if (issue.id !== loadedIssueId) {
    setLoadedIssueId(issue.id);
    setAssignedTo(issue.assignedId ?? '');
    setStatus(issue.status || 'OPEN');
  }

  async function handleSubmit() {
    if (mode === 'status' && !status) {
      setError(t('ISSUE_MODAL.PLEASE_SELECT_STATUS'));
      return;
    }
    setError('');

    const payload =
      mode === 'assign'
        ? {
            id: issue.id,
            assignedTo: assignedTo || null,
            status: assignedTo ? 'IN_PROGRESS' : 'OPEN',
          }
        : { id: issue.id, status, assignedTo: assignedTo || null };

    try {
      await updateIssue.mutateAsync(payload);
      onSaved?.();
      onClose();
    } catch {
      setError(t('COMMON.ERROR'));
    }
  }

  const isEditing = mode === 'assign' ? Boolean(issue.assignedId) : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('ISSUE_MODAL.CANCEL')}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">
            {mode === 'status'
              ? t('ISSUE_MODAL.CHANGE_STATUS')
              : t(isEditing ? 'ISSUE_MODAL.CHANGE_ASSIGNMENT' : 'ISSUE_MODAL.ASSIGN_ISSUE')}
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
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              {t('ISSUE_MODAL.ISSUE_ID')}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-muted">
              {issue.issueKey || issue.id}
            </p>
            <p className="mt-1 truncate text-sm text-fg" title={issue.message}>
              {issue.message}
            </p>
          </div>

          {mode === 'assign' ? (
            <UserSelect id="assignedTo" value={assignedTo} onChange={setAssignedTo} />
          ) : (
            <FormField id="issueStatus" label={t('ISSUE_MODAL.STATUS')} error={error}>
              <select
                id="issueStatus"
                className={FIELD_INPUT_CLASS}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {mode === 'assign' && error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : null}
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
            disabled={updateIssue.isPending}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateIssue.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            {t(isEditing ? 'ISSUE_MODAL.UPDATE' : 'ISSUE_MODAL.SAVE')}
          </button>
        </div>
      </div>
    </div>
  );
}
