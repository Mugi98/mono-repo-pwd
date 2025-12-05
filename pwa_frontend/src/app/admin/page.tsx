'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DeleteDialog, ViewDialog, EditDialog } from '@/lib/user-dialogs';

type Role = 'USER' | 'ADMIN' | 'ABMIN'; // adjust to your enum

type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
};

type SortKey = 'firstName' | 'lastName' | 'email' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function AdminPage() {
  const router = useRouter();

  const [me, setMe] = useState<CurrentUser | null>(null);

  // table state
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    firstName: '',
    lastName: '',
    email: '',
    createdAt: '',
  });
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // dialog state
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    isActive: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // -------- load current user (admin check) --------
  useEffect(() => {
    async function loadMe() {
      try {
        const data = await apiFetch('/api/auth/me');
        if (data.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }
        setMe(data.user);
      } catch (err) {
        console.error(err);
        router.push('/auth');
      }
    }
    loadMe();
  }, [router]);

  // -------- load users when filters/sort/page change --------
  useEffect(() => {
    if (!me) return; // wait for admin

    const controller = new AbortController();

    async function loadUsers() {
      setLoadingTable(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));

        if (search.trim()) params.set('search', search.trim());
        if (filters.firstName.trim())
          params.set('firstName', filters.firstName.trim());
        if (filters.lastName.trim())
          params.set('lastName', filters.lastName.trim());
        if (filters.email.trim())
          params.set('email', filters.email.trim());
        if (filters.createdAt.trim())
          params.set('createdAt', filters.createdAt.trim());

        if (sortDirection) {
          params.set('sortKey', sortKey);
          params.set('sortDir', sortDirection);
        }

        const qs = params.toString();
        console.log(qs, 'QS')
        const data = await apiFetch(
          `/api/admin/users${qs ? `?${qs}` : ''}`,
          { signal: controller.signal as any },
        );

        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError(err.message ?? 'Failed to load users');
      } finally {
        setLoadingTable(false);
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [me, page, pageSize, search, filters, sortKey, sortDirection, refreshKey]);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; max-age=0';
    }
    router.push('/auth');
  };

  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else {
      setSortDirection(prev =>
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc',
      );
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key || !sortDirection) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // -------- backend actions --------

  const handleToggleActive = async (user: UserRow) => {
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setRows(prev =>
        prev.map(u => (u.id === user.id ? { ...u, ...res.user } : u)),
      );
      toast.success(
        `User ${res.user.isActive ? 'activated' : 'deactivated'}`,
      );
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(prev =>
          prev ? { ...prev, ...res.user } : prev,
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to change status');
    }
  };

  const handleDelete = async (user: UserRow) => {
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      // reload from first page and trigger refresh even if already on page 1
      setPage(1);
      setRefreshKey(k => k + 1);
      toast.success('User deleted');
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }finally {
      setDeleteOpen(false);
    }
  };

  // -------- dialog openers --------

  const handleView = (user: UserRow) => {
    setSelectedUser(user);
    setViewOpen(true);
  };

  const handleEdit = (user: UserRow) => {
    setSelectedUser(user);
    setEditForm({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setSavingEdit(true);
    try {
      const res = await apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });

      setRows(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, ...res.user } : u)),
      );
      setSelectedUser(prev => (prev ? { ...prev, ...res.user } : prev));
      toast.success('User updated');
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Loading admin…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Admin Panel</h1>
          <p className="text-slate-400 text-sm">
            Logged in as {me.email} ({me.role})
          </p>
        </div>
        <Button
          onClick={logout}
          className="bg-red-600 hover:bg-red-500 text-sm"
        >
          Logout
        </Button>
      </div>

      {/* Search + page size */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">Search:</span>
          <Input
            placeholder="Search by name, email, or date…"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64 h-9 text-sm bg-slate-900/70 border-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 rounded-md bg-slate-900/80 border border-slate-700 px-2 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-slate-400">
            {total} result{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70 shadow-lg">
        <table className="min-w-full text-sm">
          <thead>
            {/* header row */}
            <tr className="bg-slate-900/80 border-b border-slate-800">
              <th className="px-4 py-2 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => toggleSort('firstName')}
                >
                  <span>First Name</span>
                  <span className="text-xs text-slate-400">
                    {sortIndicator('firstName')}
                  </span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => toggleSort('lastName')}
                >
                  <span>Last Name</span>
                  <span className="text-xs text-slate-400">
                    {sortIndicator('lastName')}
                  </span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => toggleSort('email')}
                >
                  <span>Email</span>
                  <span className="text-xs text-slate-400">
                    {sortIndicator('email')}
                  </span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => toggleSort('createdAt')}
                >
                  <span>Created Date</span>
                  <span className="text-xs text-slate-400">
                    {sortIndicator('createdAt')}
                  </span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>

            {/* filter row */}
            <tr className="bg-slate-900/60 border-b border-slate-800">
              <th className="px-4 py-2">
                <Input
                  placeholder="First Name…"
                  value={filters.firstName}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }));
                    setPage(1);
                  }}
                  className="h-8 text-xs bg-slate-950/70 border-slate-700"
                />
              </th>
              <th className="px-4 py-2">
                <Input
                  placeholder="Last Name…"
                  value={filters.lastName}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      lastName: e.target.value,
                    }));
                    setPage(1);
                  }}
                  className="h-8 text-xs bg-slate-950/70 border-slate-700"
                />
              </th>
              <th className="px-4 py-2">
                <Input
                  placeholder="Email…"
                  value={filters.email}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      email: e.target.value,
                    }));
                    setPage(1);
                  }}
                  className="h-8 text-xs bg-slate-950/70 border-slate-700"
                />
              </th>
              <th className="px-4 py-2">
                <Input
                  placeholder="YYYY-MM-DD…"
                  value={filters.createdAt}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      createdAt: e.target.value,
                    }));
                    setPage(1);
                  }}
                  className="h-8 text-xs bg-slate-950/70 border-slate-700"
                />
              </th>
              <th />
              <th />
            </tr>
          </thead>

          <tbody>
            {loadingTable ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading users…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map(user => (
                <tr
                  key={user.id}
                  className="border-b border-slate-800/70 hover:bg-slate-900/50"
                >
                  <td className="px-4 py-2">{user.firstName}</td>
                  <td className="px-4 py-2">{user.lastName}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      className={
                        user.isActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-xs'
                          : 'bg-slate-700 hover:bg-slate-600 text-xs'
                      }
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Button>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-600"
                      onClick={() => handleView(user)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-600"
                      onClick={() => handleEdit(user)}
                    >
                      Update
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-500 text-xs"
                      onClick={() => {
                        setDeleteUser(user);
                        setDeleteOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
      {/* Delegte Dialog */}
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deleteUser={deleteUser}
        onDelete={handleDelete}
      />

      {/* View Dialog */}
      <ViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        selectedUser={selectedUser}
      />

      {/* Edit Dialog */}
      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        selectedUser={selectedUser}
        editForm={editForm}
        onEditFormChange={setEditForm}
        onSave={handleSaveEdit}
        isSaving={savingEdit}
      />
    </div>
  );
}
