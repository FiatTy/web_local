import { apiClient } from '@/lib/api-client';
import type {
  SonarQubeConfig,
  SonarQubeConfigPayload,
  TestConnectionRequest,
  TestConnectionResponse,
} from '@/features/setting/types';

export async function getSonarQubeConfig(userId: string): Promise<SonarQubeConfig> {
  const { data } = await apiClient.get<SonarQubeConfig>(`/settings/sonarqube/${userId}`);
  return data;
}

export async function updateSonarQubeConfig(payload: SonarQubeConfigPayload): Promise<SonarQubeConfig> {
  const { data } = await apiClient.put<SonarQubeConfig>('/settings/sonarqube', payload);
  return data;
}

export async function testSonarConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
  const { data } = await apiClient.post<TestConnectionResponse>('/sonar/test-connect', request);
  return data;
}
