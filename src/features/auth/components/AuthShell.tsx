import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ScanLogPanel } from '@/features/auth/components/ScanLogPanel';

interface AuthShellProps {
  asideEyebrow: string;
  asideTitleHtml: string;
  asideText: string;
  formTitle: string;
  formSubtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  asideEyebrow,
  asideTitleHtml,
  asideText,
  formTitle,
  formSubtitle,
  children,
  footer,
}: AuthShellProps) {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden overflow-hidden px-12 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16"
        style={{
          background: 'linear-gradient(155deg, #082e2a 0%, #0c4a44 48%, #0d9488 130%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 85% -10%, rgba(45,212,191,0.28), transparent 60%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src={logoUrl}
            alt=""
            width={34}
            height={34}
            className="object-contain"
            style={{ width: 34, height: 34 }}
          />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-white">Code Review</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/55">
              PCCTH
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-white/60">
            {asideEyebrow}
          </p>
          <h2
            className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white"
            dangerouslySetInnerHTML={{ __html: asideTitleHtml }}
          />
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">{asideText}</p>

          <div className="mt-9">
            <ScanLogPanel branch="main" />
          </div>
        </div>

        <div className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
          © {new Date().getFullYear()} PCCTH · Automate Code Review
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg"
          >
            <ChevronLeft size={16} />
            {t('AUTH.BACK_HOME', 'Back to home')}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <img
                src={logoUrl}
                alt=""
                width={30}
                height={30}
                className="object-contain"
                style={{ width: 30, height: 30 }}
              />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-tight text-fg">Code Review</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                  PCCTH
                </span>
              </div>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-fg">{formTitle}</h1>
            {formSubtitle ? <p className="mt-1.5 text-sm text-muted">{formSubtitle}</p> : null}

            <div className="mt-8">{children}</div>

            {footer ? <div className="mt-8">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
