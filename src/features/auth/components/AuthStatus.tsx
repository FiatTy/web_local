import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { BrandMark } from '@/components/common/BrandMark';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface AuthStatusProps {
  tone: 'success' | 'error' | 'pending';
  icon: LucideIcon;
  spinning?: boolean;
  title: string;
  description: string;
  action?: ReactNode;
}

const TONE_CLASS: Record<AuthStatusProps['tone'], string> = {
  success: 'bg-primary-subtle text-primary',
  error: 'bg-danger/10 text-danger',
  pending: 'bg-surface-2 text-muted',
};

export function AuthStatus({
  tone,
  icon: Icon,
  spinning,
  title,
  description,
  action,
}: AuthStatusProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <div className="flex items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" aria-label="Home">
          <BrandMark size={28} />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${TONE_CLASS[tone]}`}
          >
            <Icon size={30} className={spinning ? 'animate-spin' : undefined} />
          </div>
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-fg">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
          {action ? <div className="mt-7">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
