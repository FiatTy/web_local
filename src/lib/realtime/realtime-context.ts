import { createContext, useContext } from 'react';

export interface RealtimeContextValue {
  isConnected: boolean;
}

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
