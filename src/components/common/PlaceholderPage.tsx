interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl py-20 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">Code Review</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      <p className="mt-2 text-sm text-muted">
        {description ?? 'This screen is being rebuilt on the new stack.'}
      </p>
    </div>
  );
}
