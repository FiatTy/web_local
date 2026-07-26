import type { ReactNode } from 'react';

export const FIELD_INPUT_CLASS =
  'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25 read-only:bg-surface-2/60 disabled:cursor-not-allowed disabled:bg-surface-2/60 disabled:text-muted';

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
