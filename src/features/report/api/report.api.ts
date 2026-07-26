import { apiClient } from '@/lib/api-client';
import type {
  ReportGenerateRequest,
  ReportGenerateResponse,
  ReportHistoryEntry,
} from '@/features/report/types';

export async function generateReportPdf(
  request: ReportGenerateRequest,
): Promise<ReportGenerateResponse> {
  const { data } = await apiClient.post<ReportGenerateResponse>('/api/reports/generate', request);
  return data;
}

export async function getReportHistory(userId: string): Promise<ReportHistoryEntry[]> {
  const { data } = await apiClient.get<ReportHistoryEntry[]>(`/report-history/${userId}`);
  return (data ?? []).sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}

export function downloadBase64(base64: string, fileName: string, mimeType: string): void {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
