import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuth } from '@/lib/auth/auth-context';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

const inputBase =
  'h-11 w-full rounded-lg border bg-surface pr-3 text-sm text-fg outline-none transition placeholder:text-faint focus:ring-2';
const inputValid = 'border-border focus:border-primary focus:ring-primary/25';
const inputError = 'border-danger focus:border-danger focus:ring-danger/20';

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

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
          >
            {t('AUTH.EMAIL')}
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearServerError();
              }}
              placeholder={t('LOGIN.EMAIL_PLACEHOLDER')}
              className={`${inputBase} pl-10 ${showEmailError ? inputError : inputValid}`}
              aria-invalid={showEmailError ? true : undefined}
            />
          </div>
          {showEmailError ? <p className="mt-1.5 text-xs text-danger">{t(emailError)}</p> : null}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
          >
            {t('AUTH.PASSWORD')}
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearServerError();
              }}
              placeholder={t('LOGIN.PASSWORD_PLACEHOLDER')}
              className={`${inputBase} pl-10 !pr-10 ${showPasswordError ? inputError : inputValid}`}
              aria-invalid={showPasswordError ? true : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? t('SONARQUBE_CONFIG.HIDE') : t('SONARQUBE_CONFIG.SHOW')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:text-fg"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {showPasswordError ? (
            <p className="mt-1.5 text-xs text-danger">{t(passwordError)}</p>
          ) : null}
        </div>

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
