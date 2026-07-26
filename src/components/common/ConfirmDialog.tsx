import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Portal } from '@/components/common/Portal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = 'primary',
  isPending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <button
          type="button"
          aria-label={t('COMMON.CANCEL')}
          className="absolute inset-0 bg-black/50"
          onClick={onCancel}
        />
        <div
          role="alertdialog"
          aria-labelledby="confirm-dialog-title"
          className="dialog-enter relative w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl"
        >
          <div className="flex gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                tone === 'danger' ? 'bg-danger/12 text-danger' : 'bg-primary-subtle text-primary'
              }`}
            >
              <TriangleAlert size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="confirm-dialog-title" className="text-sm font-semibold text-fg">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            >
              {t('COMMON.CANCEL')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                tone === 'danger'
                  ? 'bg-danger text-white hover:brightness-110'
                  : 'bg-primary text-primary-fg hover:bg-primary-hover'
              }`}
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
