import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { listUsers, banUser, unbanUser } from '@/services/userApi';
import type { AdminUserRow } from '@/services/userApi';
import type { UserRole } from '@/services/authApi';

const ROLE_FILTERS: { label: string; value: UserRole | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Customers', value: 'customer' },
  { label: 'Owners', value: 'owner' },
  { label: 'Admins', value: 'admin' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const refresh = () => {
    setIsLoading(true);
    listUsers({ role: roleFilter })
      .then((res) => setUsers(res.data.users))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const onToggleBan = async (user: AdminUserRow) => {
    setActingOn(user._id);
    try {
      if (user.isBanned) {
        await unbanUser(user._id);
      } else {
        const reason = window.prompt('Reason for banning this user:') || undefined;
        await banUser(user._id, reason);
      }
      refresh();
    } finally {
      setActingOn(null);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Users</h1>
      <p className="mt-1 text-sm text-slate">Manage accounts across the platform.</p>

      <div className="mt-4 flex gap-2">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setRoleFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              roleFilter === f.value ? 'border-route bg-route/10 text-ink' : 'border-paper-line text-slate'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-paper-line bg-paper-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-paper-line bg-ink/5 text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-paper-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{u.name}</p>
                    <p className="text-xs text-slate">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate">{u.role}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isBanned ? 'danger' : 'success'}>{u.isBanned ? 'Banned' : 'Active'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant={u.isBanned ? 'secondary' : 'danger'}
                        onClick={() => onToggleBan(u)}
                        isLoading={actingOn === u._id}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
