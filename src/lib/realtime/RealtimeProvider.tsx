import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { realtimeClient } from '@/lib/realtime/stomp-client';
import { RealtimeContext, type RealtimeContextValue } from '@/lib/realtime/realtime-context';

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? '';
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    const stopListening = realtimeClient.onConnectionChange(setIsConnected);
    realtimeClient.activate();

    return () => {
      stopListening();
      realtimeClient.deactivate();
      setIsConnected(false);
    };
  }, [isAuthenticated, userId]);

  const value = useMemo<RealtimeContextValue>(() => ({ isConnected }), [isConnected]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
