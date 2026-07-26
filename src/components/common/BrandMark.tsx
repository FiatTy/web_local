import logoUrl from '@/assets/logo.png';

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
}

export function BrandMark({ size = 28, showWordmark = true }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoUrl}
        alt="PCCTH Automate Code Review"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
      {showWordmark ? (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-fg">Code Review</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">PCCTH</span>
        </div>
      ) : null}
    </div>
  );
}
