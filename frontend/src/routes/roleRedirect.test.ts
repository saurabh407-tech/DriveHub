import { describe, it, expect } from 'vitest';
import { dashboardPathForRole } from '@/routes/roleRedirect';

describe('dashboardPathForRole', () => {
  it('routes customers to /customer', () => {
    expect(dashboardPathForRole('customer')).toBe('/customer');
  });

  it('routes owners to /owner', () => {
    expect(dashboardPathForRole('owner')).toBe('/owner');
  });

  it('routes admins to /admin', () => {
    expect(dashboardPathForRole('admin')).toBe('/admin');
  });
});
