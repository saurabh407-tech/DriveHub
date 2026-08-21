import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppRedux';
import type { UserRole } from '@/services/authApi';
import { dashboardPathForRole } from './roleRedirect';

export function RoleRoute({ allow }: { allow: UserRole[] }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return <Outlet />;
}
