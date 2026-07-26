import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buildScanRequest,
  createRepository,
  getRepositoryById,
  getRepositoryDetail,
  startScan,
  updateRepository,
} from '@/features/repository/api/repository.api';
import { repositoriesQueryKey } from '@/features/repository/hooks/useRepositories';
import { markMyTriggeredScan } from '@/features/repository/lib/triggered-scans';
import type { Repository, RepositoryDetail, RepositoryPayload } from '@/features/repository/types';
import type { SonarQubeConfig } from '@/features/setting/types';

export function repositoryQueryKey(projectId: string) {
  return ['repository', projectId] as const;
}

export function useRepository(projectId?: string) {
  return useQuery<Repository>({
    queryKey: repositoryQueryKey(projectId ?? ''),
    queryFn: () => getRepositoryById(projectId as string),
    enabled: Boolean(projectId),
  });
}

export function repositoryDetailQueryKey(projectId: string) {
  return ['repository-detail', projectId] as const;
}

export function useRepositoryDetail(projectId?: string) {
  return useQuery<RepositoryDetail>({
    queryKey: repositoryDetailQueryKey(projectId ?? ''),
    queryFn: () => getRepositoryDetail(projectId as string),
    enabled: Boolean(projectId),
  });
}

interface SaveRepositoryVariables {
  projectId?: string;
  payload: RepositoryPayload;
}

export function useSaveRepository() {
  const queryClient = useQueryClient();

  return useMutation<Repository, unknown, SaveRepositoryVariables>({
    mutationFn: ({ projectId, payload }) =>
      projectId ? updateRepository(projectId, payload) : createRepository(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: repositoriesQueryKey }),
  });
}

interface StartScanVariables {
  projectId: string;
  branch: string;
  config?: SonarQubeConfig;
  gitToken?: string | null;
  serverUrl?: string | null;
}

export function useStartScan() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, StartScanVariables>({
    mutationFn: ({ projectId, branch, config, gitToken, serverUrl }) =>
      startScan(projectId, buildScanRequest(config, branch, gitToken, serverUrl)),
    onSuccess: (_result, variables) => {
      markMyTriggeredScan(variables.projectId);
      return queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });
    },
  });
}
