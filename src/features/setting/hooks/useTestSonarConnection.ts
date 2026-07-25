import { useMutation } from '@tanstack/react-query';
import { testSonarConnection } from '@/features/setting/api/setting.api';
import type { TestConnectionRequest, TestConnectionResponse } from '@/features/setting/types';

export function useTestSonarConnection() {
  return useMutation<TestConnectionResponse, unknown, TestConnectionRequest>({
    mutationFn: testSonarConnection,
  });
}
