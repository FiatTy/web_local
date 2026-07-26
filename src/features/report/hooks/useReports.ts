import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateReportPdf, getReportHistory } from '@/features/report/api/report.api';
import { useAuth } from '@/lib/auth/auth-context';
import type {
  ReportGenerateRequest,
  ReportGenerateResponse,
  ReportHistoryEntry,
} from '@/features/report/types';

export function reportHistoryQueryKey(userId: string) {
  return ['report-history', userId] as const;
}

export function useReportHistory() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery<ReportHistoryEntry[]>({
    queryKey: reportHistoryQueryKey(userId),
    queryFn: () => getReportHistory(userId),
    enabled: Boolean(userId),
  });
}

export function useGenerateReportPdf() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<ReportGenerateResponse, unknown, ReportGenerateRequest>({
    mutationFn: generateReportPdf,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reportHistoryQueryKey(user?.id ?? '') }),
  });
}
