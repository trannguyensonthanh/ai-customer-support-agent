import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function Users() {
  const { auth } = useAuth();
  const api = adminApi(auth.token);
  const [data, setData] = useState({ users: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('staff');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', user }
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'agent', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.getUsers()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ name: '', email: '', role: 'agent', password: '' });
    setError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, role: u.role, password: '' });
    setError('');
    setModal({ mode: 'edit', user: u });
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (modal.mode === 'create') {
        if (!form.password) { setError('Vui lòng nhập mật khẩu.'); setSaving(false); return; }
        await api.createUser(form);
      } else {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.updateUser(modal.user.id, payload);
      }
      setModal(null);
      load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = (u) => {
    setConfirm({
      title: 'Xóa tài khoản',
      message: `Bạn có chắc muốn xóa tài khoản "${u.name}" (${u.email})?`,
      onConfirm: async () => {
        try { await api.deleteUser(u.id); load(); } catch {}
        setConfirm(null);
      },
    });
  };

  const roleBadge = (role) => {
    const cls = role === 'admin' ? 'bg-flag-50 text-flag' : role === 'agent' ? 'bg-agent-50 text-agent-600' : 'bg-brand-50 text-brand-600';
    const label = role === 'admin' ? 'Admin' : role === 'agent' ? 'Nhân viên' : 'Khách hàng';
    return <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase ${cls}`}>{label}</span>;
  };

  const staff = data.users || [];
  const customers = data.customers || [];

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Quản lý người dùng</h1>
          <p className="text-sm text-muted mt-1">{staff.length} nhân viên · {customers.length} khách hàng</p>
        </div>
        {tab === 'staff' && (
          <button onClick={openCreate} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
            + Thêm nhân viên
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl bg-paper p-1 w-fit">
        {[
          { key: 'staff', label: `Nhân viên (${staff.length})` },
          { key: 'customers', label: `Khách hàng (${customers.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.key ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl"/>)}</div>
      ) : tab === 'staff' ? (
        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-left">
                <th className="px-5 py-3 font-semibold text-muted">Tên</th>
                <th className="px-5 py-3 font-semibold text-muted">Email</th>
                <th className="px-5 py-3 font-semibold text-muted">Vai trò</th>
                <th className="px-5 py-3 font-semibold text-muted text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(u => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-paper/50 transition">
                  <td className="px-5 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-5 py-3 text-muted">{u.email}</td>
                  <td className="px-5 py-3">{roleBadge(u.role)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(u)} className="text-brand font-medium hover:underline mr-3">Sửa</button>
                    <button onClick={() => handleDelete(u)} className="text-danger font-medium hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">Chưa có nhân viên nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-left">
                <th className="px-5 py-3 font-semibold text-muted">Tên</th>
                <th className="px-5 py-3 font-semibold text-muted">Email</th>
                <th className="px-5 py-3 font-semibold text-muted">SĐT</th>
                <th className="px-5 py-3 font-semibold text-muted">Địa chỉ</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper/50 transition">
                  <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-muted">{c.email}</td>
                  <td className="px-5 py-3 text-muted">{c.phone || '—'}</td>
                  <td className="px-5 py-3 text-muted truncate max-w-[200px]">{c.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm anim-fadeup">
          <div className="w-full max-w-md rounded-3xl bg-surface border border-line p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-ink mb-4">
              {modal.mode === 'create' ? 'Thêm nhân viên mới' : 'Sửa thông tin'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Họ tên *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Email *</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Vai trò</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand">
                  <option value="agent">Nhân viên CSKH</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
                  Mật khẩu {modal.mode === 'edit' && <span className="text-muted font-normal">(để trống nếu không đổi)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand" />
              </div>
              {error && <div className="text-sm text-danger bg-danger-50 rounded-xl px-3 py-2">{error}</div>}
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted hover:bg-paper">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
