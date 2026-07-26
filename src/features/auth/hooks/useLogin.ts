import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import type { LoginRequest, LoginUser } from '@/types/user';

export function useLogin() {
  const { login } = useAuth();
  return useMutation<LoginUser, unknown, LoginRequest>({
    mutationFn: (payload) => login(payload),
  });
}
