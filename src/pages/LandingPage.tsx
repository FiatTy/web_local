import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-mono text-sm font-bold text-primary-fg">
        CR
      </div>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
        PCCTH Automate Code Review
      </p>
      <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Ship cleaner code with continuous review
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Connect repositories, run scans, and track issues, security, and technical debt in one place.
      </p>
      <Link
        to="/login"
        className="mt-8 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover active:scale-[0.98]"
      >
        {t('LOGIN.SIGN_IN', 'Sign in')}
      </Link>
    </div>
  );
}
