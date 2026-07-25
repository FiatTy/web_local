import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSonarQubeConfig, updateSonarQubeConfig } from '@/features/setting/api/setting.api';
import { useAuth } from '@/lib/auth/auth-context';
import type { SonarQubeConfig, SonarQubeConfigPayload } from '@/features/setting/types';

export function sonarQubeConfigQueryKey(userId: string) {
  return ['sonarqube-config', userId] as const;
}

export function useSonarQubeConfig() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery<SonarQubeConfig>({
    queryKey: sonarQubeConfigQueryKey(userId),
    queryFn: () => getSonarQubeConfig(userId),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useUpdateSonarQubeConfig() {
  const queryClient = useQueryClient();

  return useMutation<SonarQubeConfig, unknown, SonarQubeConfigPayload>({
    mutationFn: updateSonarQubeConfig,
    onSuccess: (config, payload) => {
      queryClient.setQueryData(sonarQubeConfigQueryKey(payload.userId), config);
    },
  });
}
