import { useMutation } from '@tanstack/react-query';
import { resetPassword, type ResetPasswordPayload } from '@/features/auth/api/auth.api';

export function useResetPassword() {
  return useMutation<void, unknown, ResetPasswordPayload>({
    mutationFn: (payload) => resetPassword(payload),
  });
}
