import { Outlet } from 'react-router';
import { RealtimeProvider } from '@/lib/realtime/RealtimeProvider';
import { useAppRealtimeSync } from '@/hooks/useAppRealtimeSync';

function RealtimeSyncOutlet() {
  useAppRealtimeSync();
  return <Outlet />;
}

export function RealtimeBoundary() {
  return (
    <RealtimeProvider>
      <RealtimeSyncOutlet />
    </RealtimeProvider>
  );
}
