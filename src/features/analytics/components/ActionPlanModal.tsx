import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Download, X } from 'lucide-react';
import { useToast } from '@/lib/toast/toast-context';

interface ActionPlanModalProps {
  plan: string;
  onClose: () => void;
}

export function ActionPlanModal({ plan, onClose }: ActionPlanModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plan);
      setCopied(true);
      showToast({ tone: 'success', title: t('TECHNICAL_DEBT.PLAN_COPIED') });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast({ tone: 'error', title: t('COMMON.ERROR') });
    }
  }

  function handleDownload() {
    const blob = new Blob([plan], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'technical-debt-action-plan.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('COMMON.CLOSE')}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">{t('TECHNICAL_DEBT.ACTION_PLAN_DRAFT')}</h2>
          <button
            type="button"
            aria-label={t('COMMON.CLOSE')}
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          {plan ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-surface-2/40 px-4 py-3 font-mono text-xs leading-relaxed text-fg">
              {plan}
            </pre>
          ) : (
            <p className="py-10 text-center text-sm text-muted">{t('TECHNICAL_DEBT.PLAN_EMPTY')}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!plan}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            {t('TECHNICAL_DEBT.COPY_PLAN')}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!plan}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} />
            {t('TECHNICAL_DEBT.DOWNLOAD_PLAN')}
          </button>
        </div>
      </div>
    </div>
  );
}
