import { useMutation, useQuery } from '@tanstack/react-query';
import { getScanById, sendScanReportEmail } from '@/features/scan/api/scan.api';
import type { ScanDetail, ScanReportEmailPayload } from '@/features/scan/types';

export function scanQueryKey(scanId: string) {
  return ['scan', scanId] as const;
}

export function useScan(scanId?: string) {
  return useQuery<ScanDetail>({
    queryKey: scanQueryKey(scanId ?? ''),
    queryFn: () => getScanById(scanId as string),
    enabled: Boolean(scanId),
  });
}

export function useSendScanReportEmail() {
  return useMutation<void, unknown, ScanReportEmailPayload>({
    mutationFn: sendScanReportEmail,
  });
}
