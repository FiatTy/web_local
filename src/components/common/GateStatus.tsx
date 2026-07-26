import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, TriangleAlert, XCircle } from 'lucide-react';
import type { GateTone } from '@/types/gate';

interface GateStatusProps {
  tone: GateTone;
  namespace: 'SCAN_RESULT' | 'LOG_VIEWER';
}

export function GateStatus({ tone, namespace }: GateStatusProps) {
  const { t } = useTranslation();

  if (tone === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
        <Loader2 size={13} className="animate-spin" />
        {t(namespace === 'SCAN_RESULT' ? 'SCAN_RESULT.SCANNING_DOTS' : 'LOG_VIEWER.SCANNING')}
      </span>
    );
  }
  if (tone === 'pass') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
        <CheckCircle2 size={13} />
        {t(`${namespace}.PASS`)}
      </span>
    );
  }
  if (tone === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
        <TriangleAlert size={13} />
        {t(`${namespace}.WARNING`)}
      </span>
    );
  }
  if (tone === 'fail') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
        <XCircle size={13} />
        {t(`${namespace}.FAIL`)}
      </span>
    );
  }
  return <span className="text-xs text-faint">—</span>;
}
