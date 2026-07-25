import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset } from '@/features/auth/api/auth.api';

export function useForgotPassword() {
  return useMutation<void, unknown, string>({
    mutationFn: (email) => requestPasswordReset(email),
  });
}
