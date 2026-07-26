import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, deleteUser, getAllUsers, updateUser } from '@/features/user/api/user.api';
import type { UserInfo } from '@/types/user';

export const usersQueryKey = ['users'] as const;

export function useUsers() {
  return useQuery<UserInfo[]>({
    queryKey: usersQueryKey,
    queryFn: getAllUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, UserInfo>({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, UserInfo>({
    mutationFn: updateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  });
}
