import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Bug,
  ClipboardList,
  FileClock,
  FileText,
  FolderGit2,
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  Menu,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { BrandMark } from '@/components/common/BrandMark';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { ProfileMenu } from '@/features/user/components/ProfileMenu';

interface NavItemConfig {
  to: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

interface NavSection {
  headingKey: string;
  items: NavItemConfig[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    headingKey: 'NAV.SECTION_OVERVIEW',
    items: [
      {
        to: '/dashboard',
        labelKey: 'NAV.DASHBOARD',
        fallback: 'Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    headingKey: 'NAV.SECTION_CODE',
    items: [
      {
        to: '/repositories',
        labelKey: 'NAV.REPOSITORIES',
        fallback: 'Repositories',
        icon: FolderGit2,
      },
      {
        to: '/scanhistory',
        labelKey: 'NAV.SCAN_HISTORY',
        fallback: 'Scan History',
        icon: ScanLine,
      },
      { to: '/issue', labelKey: 'NAV.ISSUE', fallback: 'Issues', icon: Bug },
      {
        to: '/assignment',
        labelKey: 'NAV.ASSIGNMENT',
        fallback: 'Assignments',
        icon: ClipboardList,
      },
    ],
  },
  {
    headingKey: 'NAV.SECTION_ANALYTICS',
    items: [
      {
        to: '/analysis',
        labelKey: 'NAV.ANALYSIS',
        fallback: 'Analysis',
        icon: LineChart,
      },
      {
        to: '/security-dashboard',
        labelKey: 'NAV.SECURITY',
        fallback: 'Security',
        icon: ShieldCheck,
      },
      {
        to: '/technical-debt',
        labelKey: 'NAV.TECHNICAL_DEBT',
        fallback: 'Technical Debt',
        icon: TrendingDown,
      },
    ],
  },
  {
    headingKey: 'NAV.SECTION_REPORTS',
    items: [
      {
        to: '/generatereport',
        labelKey: 'NAV.GENERATE_REPORT',
        fallback: 'Generate Report',
        icon: FileText,
      },
      {
        to: '/reporthistory',
        labelKey: 'NAV.REPORT_HISTORY',
        fallback: 'Report History',
        icon: FileClock,
      },
    ],
  },
  {
    headingKey: 'NAV.SECTION_SETTINGS',
    items: [
      {
        to: '/sonarqubeconfig',
        labelKey: 'NAV.SONARQUBE_CONFIG',
        fallback: 'SonarQube',
        icon: SlidersHorizontal,
      },
      {
        to: '/notificationsetting',
        labelKey: 'NAV.NOTIFICATION_SETTING',
        fallback: 'Notifications',
        icon: Bell,
      },
      {
        to: '/usermanagement',
        labelKey: 'NAV.USER_MANAGEMENT',
        fallback: 'User Management',
        icon: Users,
        adminOnly: true,
      },
    ],
  },
];

export function RootLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {mobileOpen ? (
        <button
          type="button"
          aria-label={t('NAV.CLOSE_MENU')}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <BrandMark size={28} />
          <button
            type="button"
            aria-label={t('NAV.CLOSE_MENU')}
            className="text-muted hover:text-fg lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => !item.adminOnly || isAdmin);
            if (items.length === 0) {
              return null;
            }
            return (
              <div key={section.headingKey}>
                <p className="px-3 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                  {t(section.headingKey)}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-primary-subtle font-medium text-primary'
                              : 'text-muted hover:bg-surface-2 hover:text-fg'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity ${
                                isActive ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            <Icon size={17} />
                            <span>{t(item.labelKey, item.fallback)}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur">
          <button
            type="button"
            aria-label={t('NAV.OPEN_MENU')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-fg lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationBell />

          <ProfileMenu />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
