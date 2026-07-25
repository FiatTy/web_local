import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { AuthStatus } from '@/features/auth/components/AuthStatus';
import { useConfirmVerifyEmail } from '@/features/auth/hooks/useConfirmVerifyEmail';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate } = useConfirmVerifyEmail();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      navigate('/verify-failed', { replace: true });
      return;
    }
    mutate(token, {
      onSuccess: () => navigate('/verify-success', { replace: true }),
      onError: () => navigate('/verify-failed', { replace: true }),
    });
  }, [mutate, navigate]);

  return (
    <AuthStatus
      tone="pending"
      icon={Loader2}
      spinning
      title={t('VERIFY.VERIFYING_TITLE')}
      description={t('VERIFY.VERIFYING_TEXT')}
    />
  );
}
