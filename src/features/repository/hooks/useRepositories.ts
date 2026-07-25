import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteRepository, getAllRepositories } from '@/features/repository/api/repository.api';

export const repositoriesQueryKey = ['repositories'] as const;

export function useRepositories() {
  return useQuery({
    queryKey: repositoriesQueryKey,
    queryFn: getAllRepositories,
  });
}

export function useDeleteRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => deleteRepository(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: repositoriesQueryKey }),
  });
}
