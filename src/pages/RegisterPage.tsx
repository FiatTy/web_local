import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AtSign, Check, Circle, Eye, EyeOff, Loader2, Lock, Phone, User } from 'lucide-react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { AuthField } from '@/features/auth/components/AuthField';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { useAuth } from '@/lib/auth/auth-context';
import { getPasswordRules } from '@/lib/password-rules';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^0\d{9}$/;
const ALLOWED_DOMAINS = ['pccth.com', 'wisesoft.co.th'];

interface DuplicateFields {
  username?: boolean;
  email?: boolean;
  phone?: boolean;
}

function isInvalidDomain(email: string): boolean {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) {
    return false;
  }
  return !ALLOWED_DOMAINS.includes(parts[1]);
}

function extractDuplicateFields(error: unknown): DuplicateFields {
  if (!axios.isAxiosError(error)) {
    return {};
  }
  const status = error.response?.status;
  if (status !== 400 && status !== 409) {
    return {};
  }
  const data = error.response?.data as { fields?: string[]; message?: string } | undefined;
  const result: DuplicateFields = {};
  if (Array.isArray(data?.fields)) {
    for (const field of data.fields) {
      if (field === 'username') result.username = true;
      if (field === 'email') result.email = true;
      if (field === 'phoneNumber' || field === 'phone') result.phone = true;
    }
  }
  const message = String(data?.message ?? error.message ?? '').toLowerCase();
  if (message.includes('username')) result.username = true;
  if (message.includes('email')) result.email = true;
  if (message.includes('phone')) result.phone = true;
  return result;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const registerMutation = useRegister();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateFields>({});
  const [genericError, setGenericError] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const rules = getPasswordRules(password);
  const passwordValid =
    rules.minLength && rules.upper && rules.lower && rules.number && rules.special;

  const usernameErrorKey = !username.trim()
    ? 'REGISTER.USERNAME_REQUIRED'
    : username.trim().length < 8
      ? 'REGISTER.USERNAME_MINLENGTH'
      : duplicates.username
        ? 'REGISTER.USERNAME_EXISTS'
        : null;

  const emailErrorKey = !email.trim()
    ? 'REGISTER.EMAIL_REQUIRED'
    : !EMAIL_PATTERN.test(email.trim())
      ? 'REGISTER.EMAIL_PATTERN'
      : isInvalidDomain(email)
        ? 'REGISTER.EMAIL_INVALID_DOMAIN'
        : duplicates.email
          ? 'REGISTER.EMAIL_EXISTS'
          : null;

  const phoneErrorKey = !phone.trim()
    ? 'REGISTER.PHONE_REQUIRED'
    : !PHONE_PATTERN.test(phone.trim())
      ? 'REGISTER.PHONE_PATTERN'
      : duplicates.phone
        ? 'REGISTER.PHONE_EXISTS'
        : null;

  const confirmErrorKey = !confirmPassword
    ? 'REGISTER.CONFIRM_PASSWORD_REQUIRED'
    : password !== confirmPassword
      ? 'REGISTER.PASSWORD_MISMATCH'
      : null;

  const showRules = password.length > 0 || submitted;

  function resetServerErrors() {
    if (genericError) setGenericError(false);
    if (registerMutation.isError) registerMutation.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (usernameErrorKey || emailErrorKey || phoneErrorKey || !passwordValid || confirmErrorKey) {
      return;
    }
    setGenericError(false);
    registerMutation.mutate(
      {
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
      },
      {
        onSuccess: () => navigate('/login', { replace: true }),
        onError: (error) => {
          const found = extractDuplicateFields(error);
          if (found.username || found.email || found.phone) {
            setDuplicates(found);
          } else {
            setGenericError(true);
          }
        },
      },
    );
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((value) => !value)}
      aria-label={showPassword ? t('SONARQUBE_CONFIG.HIDE') : t('SONARQUBE_CONFIG.SHOW')}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:text-fg"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const confirmToggle = (
    <button
      type="button"
      onClick={() => setShowConfirm((value) => !value)}
      aria-label={showConfirm ? t('SONARQUBE_CONFIG.HIDE') : t('SONARQUBE_CONFIG.SHOW')}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:text-fg"
    >
      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const ruleItems = [
    { ok: rules.minLength, labelKey: 'REGISTER.RULE_MINLENGTH' },
    { ok: rules.upper, labelKey: 'REGISTER.RULE_UPPERCASE' },
    { ok: rules.lower, labelKey: 'REGISTER.RULE_LOWERCASE' },
    { ok: rules.number, labelKey: 'REGISTER.RULE_NUMBER' },
    { ok: rules.special, labelKey: 'REGISTER.RULE_SPECIAL' },
  ];

  return (
    <AuthShell
      asideEyebrow={t('AUTH.ASIDE_EYEBROW')}
      asideTitleHtml={t('REGISTER.WELCOME_TITLE')}
      asideText={t('REGISTER.WELCOME_TEXT')}
      formTitle={t('REGISTER.TITLE')}
      formSubtitle={t('REGISTER.SUBTITLE')}
      footer={
        <div className="border-t border-border pt-6 text-sm text-muted">
          {t('REGISTER.ALREADY_HAVE_ACCOUNT')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('AUTH.LOGIN')}
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {genericError ? (
          <div
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          >
            {t('REGISTER.ERROR_GENERIC')}
          </div>
        ) : null}

        <AuthField
          id="username"
          label={t('REGISTER.USERNAME')}
          icon={User}
          value={username}
          onChange={(value) => {
            setUsername(value);
            setDuplicates((current) => ({ ...current, username: false }));
            resetServerErrors();
          }}
          placeholder={t('REGISTER.USERNAME_PLACEHOLDER')}
          autoComplete="username"
          error={submitted && usernameErrorKey ? t(usernameErrorKey) : null}
        />

        <AuthField
          id="email"
          label={t('AUTH.EMAIL')}
          icon={AtSign}
          type="email"
          inputMode="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            setDuplicates((current) => ({ ...current, email: false }));
            resetServerErrors();
          }}
          placeholder={t('REGISTER.EMAIL_PLACEHOLDER')}
          autoComplete="email"
          error={submitted && emailErrorKey ? t(emailErrorKey) : null}
        />

        <AuthField
          id="phone"
          label={t('REGISTER.PHONE_NUMBER')}
          icon={Phone}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={(value) => {
            setPhone(value);
            setDuplicates((current) => ({ ...current, phone: false }));
            resetServerErrors();
          }}
          placeholder={t('REGISTER.PHONE_PLACEHOLDER')}
          autoComplete="tel"
          error={submitted && phoneErrorKey ? t(phoneErrorKey) : null}
        />

        <AuthField
          id="password"
          label={t('AUTH.PASSWORD')}
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(value) => {
            setPassword(value);
            resetServerErrors();
          }}
          placeholder={t('REGISTER.PASSWORD_PLACEHOLDER')}
          autoComplete="new-password"
          trailing={passwordToggle}
        >
          {showRules ? (
            <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ruleItems.map((item) => (
                <li key={item.labelKey} className="flex items-center gap-1.5 text-xs">
                  {item.ok ? (
                    <Check size={13} className="text-success" />
                  ) : (
                    <Circle size={13} className="text-faint" />
                  )}
                  <span className={item.ok ? 'text-fg' : 'text-muted'}>{t(item.labelKey)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </AuthField>

        <AuthField
          id="confirmPassword"
          label={t('AUTH.CONFIRM_PASSWORD')}
          icon={Lock}
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            resetServerErrors();
          }}
          placeholder={t('REGISTER.CONFIRM_PASSWORD_PLACEHOLDER')}
          autoComplete="new-password"
          trailing={confirmToggle}
          error={submitted && confirmErrorKey ? t(confirmErrorKey) : null}
        />

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {registerMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            t('REGISTER.BUTTON')
          )}
        </button>
      </form>
    </AuthShell>
  );
}
