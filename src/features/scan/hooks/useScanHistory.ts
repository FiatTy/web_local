import { useQuery } from '@tanstack/react-query';
import { getScanHistory } from '@/features/scan/api/scan.api';

export const scanHistoryQueryKey = ['scan-history'] as const;

export function useScanHistory() {
  return useQuery({
    queryKey: scanHistoryQueryKey,
    queryFn: getScanHistory,
  });
}
