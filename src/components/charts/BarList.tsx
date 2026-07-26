export interface BarListItem {
  label: string;
  value: number;
  display?: string;
  color?: string;
}

interface BarListProps {
  items: BarListItem[];
  emptyLabel?: string;
}

export function BarList({ items, emptyLabel }: BarListProps) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-fg" title={item.label}>
              {item.label}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted">
              {item.display ?? item.value}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                background: item.color ?? 'var(--color-primary)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
