import type { LucideIcon } from 'lucide-react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  align?: 'start' | 'between';
}

export function Switch({
  id,
  checked,
  onChange,
  label,
  description,
  disabled,
  icon: Icon,
  align = 'start',
}: SwitchProps) {
  const control = (
    <span
      className={`relative inline-flex h-5 w-9 shrink-0 items-center ${align === 'start' ? 'mt-0.5' : ''}`}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="absolute inset-0 rounded-full bg-border-strong transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface" />
      <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 peer-checked:translate-x-4" />
    </span>
  );

  const content = (
    <span className="flex min-w-0 items-start gap-3">
      {Icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
          <Icon size={16} />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm text-fg">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-faint">{description}</span>
        ) : null}
      </span>
    </span>
  );

  return (
    <label
      htmlFor={id}
      className={`flex ${align === 'between' ? 'w-full items-center justify-between gap-4' : 'items-start gap-3'} ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      {align === 'between' ? (
        <>
          {content}
          {control}
        </>
      ) : (
        <>
          {control}
          {content}
        </>
      )}
    </label>
  );
}
