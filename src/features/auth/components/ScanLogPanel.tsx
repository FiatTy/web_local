import { useEffect, useRef, useState } from 'react';

interface ScanLogLine {
  text: string;
  done?: boolean;
}

const LINES: ScanLogLine[] = [
  { text: 'cloning repository' },
  { text: 'detecting project type' },
  { text: 'analyzing 1,284 files' },
  { text: 'running sonar scanner' },
  { text: 'quality gate passed', done: true },
];

const TYPING_MS = 26;
const LINE_PAUSE_MS = 420;
const LOOP_PAUSE_MS = 2600;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function ScanLogPanel({ branch }: { branch: string }) {
  const [reduced] = useState(prefersReducedMotion);
  const [lineIndex, setLineIndex] = useState(reduced ? LINES.length : 0);
  const [charCount, setCharCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      return;
    }

    function schedule(fn: () => void, delay: number) {
      timerRef.current = window.setTimeout(fn, delay);
    }

    if (lineIndex >= LINES.length) {
      schedule(() => {
        setLineIndex(0);
        setCharCount(0);
      }, LOOP_PAUSE_MS);
      return () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      };
    }

    const current = LINES[lineIndex].text;
    if (charCount < current.length) {
      schedule(() => setCharCount((count) => count + 1), TYPING_MS);
    } else {
      schedule(() => {
        setLineIndex((index) => index + 1);
        setCharCount(0);
      }, LINE_PAUSE_MS);
    }

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [charCount, lineIndex, reduced]);

  const settled = reduced ? LINES : LINES.slice(0, lineIndex);
  const typing = !reduced && lineIndex < LINES.length ? LINES[lineIndex] : null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/12 bg-[#04201d]/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
        </span>
        <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          scan · {branch}
        </span>
      </div>

      <div className="min-h-[9.5rem] px-4 py-3.5 font-mono text-[12.5px] leading-[1.85]">
        {settled.map((line) => (
          <p
            key={line.text}
            className={`scan-log-line flex items-baseline gap-2 ${
              line.done ? 'text-teal-300' : 'text-white/60'
            }`}
          >
            <span aria-hidden className="shrink-0">
              {line.done ? '✓' : '→'}
            </span>
            <span>{line.text}</span>
          </p>
        ))}
        {typing ? (
          <p className="flex items-baseline gap-2 text-white/60">
            <span aria-hidden className="shrink-0">
              {typing.done ? '✓' : '→'}
            </span>
            <span className="scan-caret">{typing.text.slice(0, charCount)}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
