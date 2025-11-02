"use client";
import * as React from 'react';

type UserRow = {
  uuid: string;
  username: string;
  systemId?: string;
  display?: string;
  roles: string[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch('/api/admin/users?limit=50', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load users');
      setUsers(data?.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Users</h1>
      <p className="text-sm text-gray-600 mb-4">Manage facility users and roles (read-only list for MVP).</p>

      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">System ID</th>
              <th className="text-left p-3">Display</th>
              <th className="text-left p-3">Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uuid} className="border-b">
                <td className="p-3 font-medium">{u.username}</td>
                <td className="p-3">{u.systemId || '—'}</td>
                <td className="p-3">{u.display || '—'}</td>
                <td className="p-3">{u.roles?.join(', ') || '—'}</td>
              </tr>
            ))}
            {!users.length && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">{loading ? 'Loading…' : 'No users'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

