import { Outlet } from 'react-router';
import { AuthProvider } from '@/lib/auth/AuthProvider';

export function AuthBoundary() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
