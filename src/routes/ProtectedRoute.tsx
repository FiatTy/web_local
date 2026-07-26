import { Navigate, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/auth-context';

export function ProtectedRoute() {
  const { t } = useTranslation();
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">{t('COMMON.LOADING')}</span>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
