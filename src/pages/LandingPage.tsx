import { Link, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, LayoutDashboard, Search, Timer } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useAuth } from '@/lib/auth/auth-context';

const FEATURES = [
  {
    icon: Timer,
    titleKey: 'LANDING.SAVE_TIME',
    descKey: 'LANDING.SAVE_TIME_DESC',
    tint: 'bg-primary-subtle text-primary',
  },
  {
    icon: Search,
    titleKey: 'LANDING.ISSUE_DETECTION',
    descKey: 'LANDING.ISSUE_DETECTION_DESC',
    tint: 'bg-info/10 text-info',
  },
  {
    icon: LayoutDashboard,
    titleKey: 'LANDING.DASHBOARD',
    descKey: 'LANDING.DASHBOARD_DESC',
    tint: 'bg-major/10 text-major',
  },
];

const NOTIFICATION_LEVELS = [
  { key: 'COMMON.SUCCESS', dot: 'bg-success' },
  { key: 'COMMON.INFO', dot: 'bg-info' },
  { key: 'COMMON.WARNING', dot: 'bg-warning' },
  { key: 'COMMON.ERROR', dot: 'bg-danger' },
];

export function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <BrandMark size={34} />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="rounded-md px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              {t('AUTH.LOGIN')}
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover active:scale-[0.98]"
            >
              {t('AUTH.REGISTER')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="landing-hero-glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:py-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
              Continuous Code Quality
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
              PCCTH Automate Code Review
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {t('LANDING.HERO_SUBTITLE_1')}{' '}
              <span className="font-medium text-fg">{t('LANDING.HERO_SUBTITLE_2')}</span>
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover active:scale-[0.98]"
              >
                {t('LANDING.EXPLORE_FEATURES')}
                <ArrowRight size={16} />
              </a>
              <Link
                to="/login"
                className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2 active:scale-[0.98]"
              >
                {t('AUTH.LOGIN')}
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-fg">
            {t('LANDING.WHY_CHOOSE_US')}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="rounded-xl border border-border bg-surface p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${feature.tint}`}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-fg">{t(feature.titleKey)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(feature.descKey)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border bg-surface-2/50 py-16">
          <div className="mx-auto w-full max-w-6xl px-5 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-fg">
              {t('LANDING.NOTIFICATIONS_4_LEVELS')}
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {NOTIFICATION_LEVELS.map((level) => (
                <span
                  key={level.key}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-fg"
                >
                  <span className={`h-2 w-2 rounded-full ${level.dot}`} />
                  {t(level.key)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="landing-cta relative overflow-hidden rounded-2xl px-8 py-14 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {t('LANDING.CTA_TITLE')}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/85">
              {t('LANDING.CTA_DESC')}
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-primary transition-transform active:scale-[0.98]"
            >
              {t('LANDING.GET_STARTED')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 text-center sm:flex-row sm:text-left">
          <BrandMark size={24} />
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
            PCCTH Automate Code Review
          </p>
        </div>
      </footer>
    </div>
  );
}
