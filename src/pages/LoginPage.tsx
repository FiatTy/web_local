import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { AuthField } from '@/features/auth/components/AuthField';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuth } from '@/lib/auth/auth-context';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const trimmedEmail = email.trim();
  const emailError = !trimmedEmail
    ? 'LOGIN.EMAIL_REQUIRED'
    : !EMAIL_PATTERN.test(trimmedEmail)
      ? 'LOGIN.EMAIL_PATTERN'
      : null;
  const passwordError = !password ? 'LOGIN.PASSWORD_REQUIRED' : null;

  const showEmailError = submitted && emailError;
  const showPasswordError = submitted && passwordError;

  function clearServerError() {
    if (login.isError) {
      login.reset();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (emailError || passwordError) {
      return;
    }
    login.mutate(
      { email: trimmedEmail, password },
      { onSuccess: () => navigate('/dashboard', { replace: true }) },
    );
  }

  return (
    <AuthShell
      asideEyebrow={t('AUTH.ASIDE_EYEBROW')}
      asideTitleHtml={t('LOGIN.WELCOME_TITLE')}
      asideText={t('AUTH.ASIDE_TAGLINE')}
      formTitle={t('AUTH.LOGIN')}
      formSubtitle={t('LOGIN.SUBTITLE')}
      footer={
        <div className="space-y-2.5 border-t border-border pt-6 text-sm text-muted">
          <p>
            {t('LOGIN.FORGOT_PASSWORD')}{' '}
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              {t('AUTH.RESET_PASSWORD')}
            </Link>
          </p>
          <p>
            {t('LOGIN.DONT_HAVE_ACCOUNT')}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t('AUTH.REGISTER')}
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {login.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          >
            {t('LOGIN.ERROR_GENERIC')}
          </div>
        ) : null}

        <AuthField
          id="email"
          label={t('AUTH.EMAIL')}
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            clearServerError();
          }}
          placeholder={t('LOGIN.EMAIL_PLACEHOLDER')}
          error={showEmailError ? t(emailError) : null}
        />

        <AuthField
          id="password"
          label={t('AUTH.PASSWORD')}
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            clearServerError();
          }}
          placeholder={t('LOGIN.PASSWORD_PLACEHOLDER')}
          error={showPasswordError ? t(passwordError) : null}
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

        <button
          type="submit"
          disabled={login.isPending}
          className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {login.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {t('AUTH.LOGIN_BUTTON')}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
