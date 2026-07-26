import { useEffect, useRef } from 'react';
import { realtimeClient } from '@/lib/realtime/stomp-client';

export function useRealtimeTopic<TPayload>(
  topic: string | null,
  handler: (payload: TPayload) => void,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!topic) {
      return;
    }
    return realtimeClient.subscribe(topic, (payload) => {
      handlerRef.current(payload as TPayload);
    });
  }, [topic]);
}
