import { useMutation } from '@tanstack/react-query';
import { confirmVerifyEmail } from '@/features/auth/api/auth.api';

export function useConfirmVerifyEmail() {
  return useMutation<void, unknown, string>({
    mutationFn: (token) => confirmVerifyEmail(token),
  });
}
