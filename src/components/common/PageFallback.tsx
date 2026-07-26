import { Loader2 } from 'lucide-react';

export function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 size={20} className="animate-spin text-primary" />
    </div>
  );
}
