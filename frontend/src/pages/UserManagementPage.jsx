import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  X,
  UserX,
  Search
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role_id: 2,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      if (res.success) {
        setRoles(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        role_id: parseInt(form.role_id),
      };

      const res = await api.post('/users', payload);
      if (res.success) {
        setModalOpen(false);
        setForm({ username: '', email: '', password: '', full_name: '', role_id: 2 });
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this user account?")) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Deactivation failed');
    }
  };

  const filteredUsers = users.filter((u) => {
    const sLower = search.trim().toLowerCase();
    if (!sLower) return true;
    return (
      (u.full_name || '').toLowerCase().includes(sLower) ||
      (u.username || '').toLowerCase().includes(sLower) ||
      (u.email || '').toLowerCase().includes(sLower) ||
      (u.role?.name || '').toLowerCase().includes(sLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">User & Access Management</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage team members, assign RBAC roles, and control system access.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-tint flex items-center gap-2"
        >
          <UserPlus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search user, username, email, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
            </div>
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : (
          <table className="w-full text-left font-body-md text-body-md">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-[12px] uppercase">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
                          {u.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-on-surface">{u.full_name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-mono text-on-surface">{u.username}</div>
                      <div className="text-on-surface-variant">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-primary uppercase">
                        {u.role?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.username !== 'admin' && u.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          className="p-1 text-on-surface-variant hover:text-error rounded"
                          title="Deactivate User"
                        >
                          <UserX size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ada user yang sesuai dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-display text-headline-md font-bold text-on-surface">Create User Account</h3>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-label-md text-xs font-semibold">Full Name *</label>
                <input type="text" required placeholder="Dina Finance Staff" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="font-label-md text-xs font-semibold">Username *</label>
                <input type="text" required placeholder="dina_staff" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-mono" />
              </div>
              <div>
                <label className="font-label-md text-xs font-semibold">Email *</label>
                <input type="email" required placeholder="dina@fspms.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="font-label-md text-xs font-semibold">Password *</label>
                <input type="password" required placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="font-label-md text-xs font-semibold">Assigned Role *</label>
                <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full border rounded-lg p-2 mt-1">
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} — {r.description}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg">
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
