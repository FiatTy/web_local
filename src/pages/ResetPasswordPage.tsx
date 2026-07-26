import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { AuthField } from '@/features/auth/components/AuthField';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import { useValidateResetToken } from '@/features/auth/hooks/useValidateResetToken';

const RESET_TOKEN_KEY = 'reset_token';

type TokenState = 'checking' | 'valid' | 'expired' | 'used' | 'invalid';

function readInitialToken(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('token');
  if (fromUrl) {
    sessionStorage.setItem(RESET_TOKEN_KEY, fromUrl);
    return fromUrl;
  }
  return sessionStorage.getItem(RESET_TOKEN_KEY);
}

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [token] = useState<string | null>(readInitialToken);
  const validation = useValidateResetToken(token);
  const resetPasswordMutation = useResetPassword();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (searchParams.get('token')) {
      const next = new URLSearchParams(searchParams);
      next.delete('token');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  let tokenState: TokenState;
  if (!token) {
    tokenState = 'invalid';
  } else if (validation.isPending) {
    tokenState = 'checking';
  } else if (validation.isError) {
    tokenState = 'invalid';
  } else {
    const status = validation.data?.status;
    tokenState =
      status === 'VALID'
        ? 'valid'
        : status === 'EXPIRED'
          ? 'expired'
          : status === 'USED'
            ? 'used'
            : 'invalid';
  }

  const passwordErrorKey = !newPassword
    ? 'RESET_PASSWORD.PASSWORD_REQUIRED'
    : newPassword.length < 8
      ? 'RESET_PASSWORD.PASSWORD_MIN'
      : null;
  const confirmErrorKey = !confirmPassword
    ? 'RESET_PASSWORD.CONFIRM_REQUIRED'
    : newPassword !== confirmPassword
      ? 'RESET_PASSWORD.MISMATCH'
      : null;

  function goBack() {
    sessionStorage.removeItem(RESET_TOKEN_KEY);
    navigate('/forgot-password', { replace: true });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!token || passwordErrorKey || confirmErrorKey) {
      return;
    }
    resetPasswordMutation.mutate(
      { token, newPassword },
      {
        onSuccess: () => {
          sessionStorage.removeItem(RESET_TOKEN_KEY);
          window.setTimeout(() => navigate('/login', { replace: true }), 1200);
        },
      },
    );
  }

  const stateMeta: Record<TokenState, { titleKey: string; textKey: string }> = {
    checking: {
      titleKey: 'RESET_PASSWORD.CHECKING_TITLE',
      textKey: 'RESET_PASSWORD.CHECKING_TEXT',
    },
    valid: { titleKey: 'RESET_PASSWORD.FORM_TITLE', textKey: '' },
    expired: {
      titleKey: 'RESET_PASSWORD.EXPIRED_TITLE',
      textKey: 'RESET_PASSWORD.EXPIRED_TEXT',
    },
    used: {
      titleKey: 'RESET_PASSWORD.USED_TITLE',
      textKey: 'RESET_PASSWORD.USED_TEXT',
    },
    invalid: {
      titleKey: 'RESET_PASSWORD.INVALID_TITLE',
      textKey: 'RESET_PASSWORD.INVALID_TEXT',
    },
  };

  const isSuccess = resetPasswordMutation.isSuccess;
  const formTitle = isSuccess
    ? t('RESET_PASSWORD.SUCCESS_TITLE')
    : t(stateMeta[tokenState].titleKey);
  const formSubtitle = isSuccess
    ? t('RESET_PASSWORD.SUCCESS_TEXT')
    : stateMeta[tokenState].textKey
      ? t(stateMeta[tokenState].textKey)
      : undefined;

  let body: ReactNode;
  if (isSuccess) {
    body = (
      <div className="flex items-center justify-center py-4 text-primary">
        <ShieldCheck size={40} />
      </div>
    );
  } else if (tokenState === 'checking') {
    body = (
      <div className="flex items-center justify-center py-6 text-muted">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  } else if (tokenState === 'valid') {
    body = (
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {resetPasswordMutation.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          >
            {t('RESET_PASSWORD.ERROR_GENERIC')}
          </div>
        ) : null}

        <AuthField
          id="newPassword"
          label={t('RESET_PASSWORD.NEW_PASSWORD')}
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder={t('RESET_PASSWORD.NEW_PASSWORD_PLACEHOLDER')}
          error={submitted && passwordErrorKey ? t(passwordErrorKey) : null}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? t('SONARQUBE_CONFIG.HIDE') : t('SONARQUBE_CONFIG.SHOW')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:text-fg"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <AuthField
          id="confirmPassword"
          label={t('RESET_PASSWORD.CONFIRM_PASSWORD')}
          icon={Lock}
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder={t('RESET_PASSWORD.CONFIRM_PASSWORD_PLACEHOLDER')}
          error={submitted && confirmErrorKey ? t(confirmErrorKey) : null}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              aria-label={showConfirm ? t('SONARQUBE_CONFIG.HIDE') : t('SONARQUBE_CONFIG.SHOW')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:text-fg"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {resetPasswordMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            t('RESET_PASSWORD.CONFIRM_BUTTON')
          )}
        </button>
      </form>
    );
  } else {
    body = (
      <div className="space-y-5">
        <div className="flex items-center justify-center py-2 text-warning">
          <AlertTriangle size={36} />
        </div>
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99]"
        >
          {t('RESET_PASSWORD.REQUEST_NEW_LINK')}
        </button>
      </div>
    );
  }

  return (
    <AuthShell
      asideEyebrow={t('AUTH.ASIDE_EYEBROW')}
      asideTitleHtml={t('RESET_PASSWORD.ASIDE_TITLE')}
      asideText={t('RESET_PASSWORD.ASIDE_TEXT')}
      formTitle={formTitle}
      formSubtitle={formSubtitle}
      footer={
        <div className="border-t border-border pt-6 text-sm">
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('AUTH.LOGIN')}
          </Link>
        </div>
      }
    >
      {body}
    </AuthShell>
  );
}
