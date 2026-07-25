import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  trailing?: ReactNode;
  children?: ReactNode;
}

export function AuthField({
  id,
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  maxLength,
  inputMode,
  trailing,
  children,
}: AuthFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          className={`h-11 w-full rounded-lg border bg-surface pl-10 text-sm text-fg outline-none transition placeholder:text-faint focus:ring-2 ${
            trailing ? 'pr-10' : 'pr-3'
          } ${
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-border focus:border-primary focus:ring-primary/25'
          }`}
        />
        {trailing}
      </div>
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
      {children}
    </div>
  );
}
