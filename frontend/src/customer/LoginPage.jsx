import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function LoginPage() {
  const { customer, token, login, register } = useCustomerAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect based on role
  if (customer && token) {
    const stored = JSON.parse(localStorage.getItem('sv_customer') || '{}');
    const role = stored.role || 'customer';
    if (role === 'admin' || role === 'agent') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'login') {
        const data = await login(form.email, form.password);
        const role = data.role || 'customer';
        if (role === 'admin' || role === 'agent') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        if (!form.name.trim()) throw new Error('Vui lòng nhập tên.');
        await register(form);
        navigate('/');
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-agent/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="fixed top-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-line text-muted transition hover:bg-brand-50 hover:text-brand"
        aria-label="Đổi giao diện"
      >
        {dark ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
      </button>

      <div className="relative w-full max-w-md px-5 anim-fadeup">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand to-agent text-white text-2xl font-black shadow-lg shadow-brand/20 mb-4">
            3T
          </div>
          <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight">
            3T<span className="text-brand">Store</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {tab === 'login' ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-surface/80 backdrop-blur-xl p-7 shadow-2xl ring-1 ring-black/5">
          {/* Tabs */}
          <div className="mb-6 flex overflow-hidden rounded-2xl bg-paper p-1">
            {[
              { key: 'login', label: 'Đăng nhập' },
              { key: 'register', label: 'Đăng ký' },
            ].map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setError(''); }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  tab === t.key 
                    ? 'bg-brand text-white shadow-md shadow-brand/20' 
                    : 'text-muted hover:text-ink'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Họ tên *</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="Nguyễn Văn An"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Email *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com"
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Mật khẩu *</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••"
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            {tab === 'register' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Số điện thoại</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="0901234567"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
              </div>
            )}
            {error && <div className="rounded-xl bg-danger-50 border border-danger/20 px-4 py-3 text-sm text-danger font-medium">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-600 py-3.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-brand/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
              {loading ? 'Đang xử lý…' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          {tab === 'login' && (
            <div className="mt-5 space-y-2">
              <div className="text-center text-xs font-semibold text-muted uppercase tracking-wider">Tài khoản demo</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-paper p-3 border border-line">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">KHÁCH HÀNG</span>
                    <div className="mt-1 text-muted">an.nguyen@example.com / 123456</div>
                  </div>
                  <button type="button" onClick={() => { setForm({ ...form, email: 'an.nguyen@example.com', password: '123456' }); }}
                    className="text-brand font-bold hover:underline">Dùng</button>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-paper p-3 border border-line">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-agent-50 px-2 py-0.5 text-[11px] font-bold text-agent-600">NHÂN VIÊN</span>
                    <div className="mt-1 text-muted">nv.linh@3tstore.vn / agent123</div>
                  </div>
                  <button type="button" onClick={() => { setForm({ ...form, email: 'nv.linh@3tstore.vn', password: 'agent123' }); }}
                    className="text-brand font-bold hover:underline">Dùng</button>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-paper p-3 border border-line">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-flag-50 px-2 py-0.5 text-[11px] font-bold text-flag">ADMIN</span>
                    <div className="mt-1 text-muted">admin@shopviet.vn / admin123</div>
                  </div>
                  <button type="button" onClick={() => { setForm({ ...form, email: 'admin@shopviet.vn', password: 'admin123' }); }}
                    className="text-brand font-bold hover:underline">Dùng</button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <p className="mt-6 text-center text-xs text-muted">
          © 2026 3TStore · AI-Powered E-Commerce Platform
        </p>
      </div>
    </div>
  );
}
