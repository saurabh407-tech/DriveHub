import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppRedux';

export function ProtectedRoute() {
  const { user, status, bootstrapped } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!bootstrapped && status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
