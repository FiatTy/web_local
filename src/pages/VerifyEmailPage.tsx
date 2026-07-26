import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { AuthStatus } from '@/features/auth/components/AuthStatus';
import { emailVerificationConfirmUrl } from '@/features/auth/api/auth.api';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    window.location.assign(emailVerificationConfirmUrl(token));
  }, [navigate]);

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
