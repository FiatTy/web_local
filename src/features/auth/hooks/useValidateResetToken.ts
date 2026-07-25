import { useQuery } from '@tanstack/react-query';
import { validateResetToken } from '@/features/auth/api/auth.api';

export function useValidateResetToken(token: string | null) {
  return useQuery({
    queryKey: ['reset-token', token],
    queryFn: () => validateResetToken(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}
