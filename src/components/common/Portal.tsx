import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

let openCount = 0;
let restoreOverflow = '';

export function Portal({ children }: { children: ReactNode }) {
  const [container] = useState(() => document.createElement('div'));

  useEffect(() => {
    document.body.appendChild(container);

    if (openCount === 0) {
      restoreOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openCount += 1;

    return () => {
      openCount -= 1;
      if (openCount === 0) {
        document.body.style.overflow = restoreOverflow;
      }
      container.remove();
    };
  }, [container]);

  return createPortal(children, container);
}
