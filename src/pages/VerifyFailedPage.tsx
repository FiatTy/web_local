import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { XCircle } from 'lucide-react';
import { AuthStatus } from '@/features/auth/components/AuthStatus';

export function VerifyFailedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expired = searchParams.get('reason') === 'expired';

  return (
    <AuthStatus
      tone="error"
      icon={XCircle}
      title={expired ? t('VERIFY.EXPIRED_TITLE') : t('VERIFY.FAILED_TITLE')}
      description={expired ? t('VERIFY.EXPIRED_TEXT') : t('VERIFY.FAILED_TEXT')}
      action={
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99]"
        >
          {t('VERIFY.GO_TO_WEBSITE')}
        </button>
      }
    />
  );
}
