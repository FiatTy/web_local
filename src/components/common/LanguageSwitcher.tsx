import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = current === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => void i18n.changeLanguage(lang)}
            aria-pressed={active}
            className={`rounded px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              active ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg'
            }`}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}
