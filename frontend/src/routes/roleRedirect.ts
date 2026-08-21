import type { UserRole } from '@/services/authApi';

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'owner':
      return '/owner';
    case 'customer':
    default:
      return '/customer';
  }
}
