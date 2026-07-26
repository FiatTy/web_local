import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const isDark = theme === 'dark';
  const label = isDark ? t('COMMON.SWITCH_LIGHT') : t('COMMON.SWITCH_DARK');

  function toggle() {
    const next: Theme = isDark ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-fg active:scale-95"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
