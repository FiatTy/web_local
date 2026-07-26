import { useMutation } from '@tanstack/react-query';
import { register } from '@/features/auth/api/auth.api';
import type { RegisterRequest } from '@/types/user';

export function useRegister() {
  return useMutation<void, unknown, RegisterRequest>({
    mutationFn: (payload) => register(payload),
  });
}
