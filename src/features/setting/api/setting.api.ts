import { apiClient } from '@/lib/api-client';
import type {
  NotificationSettings,
  NotificationSettingsPayload,
  SonarQubeConfig,
  SonarQubeConfigPayload,
  TestConnectionRequest,
  TestConnectionResponse,
} from '@/features/setting/types';

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const { data } = await apiClient.get<NotificationSettings>(`/settings/notification/${userId}`);
  return data;
}

export async function updateNotificationSettings(
  payload: NotificationSettingsPayload,
): Promise<NotificationSettings> {
  const { data } = await apiClient.put<NotificationSettings>('/settings/notification', payload);
  return data;
}

export async function getSonarQubeConfig(userId: string): Promise<SonarQubeConfig> {
  const { data } = await apiClient.get<SonarQubeConfig>(`/settings/sonarqube/${userId}`);
  return data;
}

export async function updateSonarQubeConfig(
  payload: SonarQubeConfigPayload,
): Promise<SonarQubeConfig> {
  const { data } = await apiClient.put<SonarQubeConfig>('/settings/sonarqube', payload);
  return data;
}

export async function testSonarConnection(
  request: TestConnectionRequest,
): Promise<TestConnectionResponse> {
  const { data } = await apiClient.post<TestConnectionResponse>('/sonar/test-connect', request);
  return data;
}
