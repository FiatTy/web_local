import { useMutation } from '@tanstack/react-query';
import {
  changePassword,
  sendVerificationEmail,
  type ChangePasswordPayload,
} from '@/features/user/api/user.api';

export function useChangePassword() {
  return useMutation<void, unknown, ChangePasswordPayload>({
    mutationFn: changePassword,
  });
}

export function useSendVerificationEmail() {
  return useMutation<void, unknown, string>({
    mutationFn: sendVerificationEmail,
  });
}
