import { jwtDecode } from 'jwt-decode';
import { Navigate, Outlet } from 'react-router';
import { clearSession, getAccessToken } from '@/lib/auth/token-store';

interface RoleRouteProps {
  allowed: string[];
}

interface JwtRoleClaims {
  role?: string;
  roles?: string;
  authority?: string;
}

type RoleAccess = 'allowed' | 'forbidden' | 'login';

function resolveRoleAccess(token: string | null, allowed: string[]): RoleAccess {
  if (!token) {
    return 'login';
  }
  try {
    const decoded = jwtDecode<JwtRoleClaims>(token);
    const userRole = decoded.role || decoded.roles || decoded.authority;
    if (userRole && allowed.includes(userRole)) {
      return 'allowed';
    }
    return 'forbidden';
  } catch {
    clearSession();
    return 'login';
  }
}

export function RoleRoute({ allowed }: RoleRouteProps) {
  const access = resolveRoleAccess(getAccessToken(), allowed);

  if (access === 'login') {
    return <Navigate to="/login" replace />;
  }
  if (access === 'forbidden') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
