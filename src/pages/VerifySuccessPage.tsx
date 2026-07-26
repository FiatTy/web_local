import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { AuthStatus } from '@/features/auth/components/AuthStatus';

export function VerifySuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const already = searchParams.get('status') === 'already';

  return (
    <AuthStatus
      tone="success"
      icon={CheckCircle2}
      title={already ? t('VERIFY.ALREADY_TITLE') : t('VERIFY.SUCCESS_TITLE')}
      description={already ? t('VERIFY.ALREADY_TEXT') : t('VERIFY.SUCCESS_TEXT')}
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
