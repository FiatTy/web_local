import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { PageFallback } from '@/components/common/PageFallback';

export function AuthBoundary() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}
