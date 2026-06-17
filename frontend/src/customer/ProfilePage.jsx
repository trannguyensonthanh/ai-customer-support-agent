import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import Header from '../components/Header.jsx';

export default function ProfilePage() {
  const { customer, editProfile } = useCustomerAuth();
  const [form, setForm] = useState({ name: customer?.name || '', phone: customer?.phone || '', address: customer?.address || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!customer) return <Navigate to="/login" replace />;

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSaved(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await editProfile(form); setSaved(true); } catch {}
    setSaving(false);
  };

  return (
    <div className="min-h-screen"><Header />
      <div className="mx-auto max-w-lg px-5 py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Tài khoản</h1>
        <p className="mt-1 text-sm text-muted">Quản lý thông tin cá nhân của bạn</p>

        <form onSubmit={handleSave} className="mt-6 space-y-5 rounded-2xl border border-line bg-surface p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
              {customer.name?.charAt(0)?.toUpperCase() || 'K'}
            </div>
            <div>
              <div className="font-display font-semibold text-ink">{customer.name}</div>
              <div className="text-sm text-muted">{customer.email}</div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Họ tên</label>
            <input type="text" value={form.name} onChange={set('name')}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Số điện thoại</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="0901234567"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Địa chỉ giao hàng</label>
            <textarea value={form.address} onChange={set('address')} rows={2} placeholder="Nhập địa chỉ mặc định…"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-brand" />
          </div>
          <button type="submit" disabled={saving}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
              saved ? 'bg-success-50 text-success' : 'bg-brand text-white hover:bg-brand-600'
            } disabled:opacity-50`}>
            {saving ? 'Đang lưu…' : saved ? '✓ Đã lưu thành công' : 'Cập nhật thông tin'}
          </button>
        </form>
      </div>
    </div>
  );
}
