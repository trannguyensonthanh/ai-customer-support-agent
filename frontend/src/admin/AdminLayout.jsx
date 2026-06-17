import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const LINKS = [
  { to: '/admin', label: '📊 Tổng quan', end: true },
  { to: '/admin/orders', label: '📦 Đơn hàng' },
  { to: '/admin/products', label: '🛍️ Sản phẩm' },
  { to: '/admin/users', label: '👥 Người dùng' },
  { to: '/admin/conversations', label: '💬 Hội thoại' },
  { to: '/admin/faqs', label: '❓ Quản lý FAQ' },
  { to: '/admin/tickets', label: '🎫 Ticket' },
  { to: '/admin/settings', label: '⚙️ Cài đặt AI' },
];

export default function AdminLayout() {
  const { auth, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  if (!auth?.token) return <Navigate to="/login" replace />;

  const role = auth.role || auth.user?.role || 'agent';

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-agent text-white text-sm font-black">
              3T
            </div>
            <div>
              <div className="font-display text-lg font-bold text-ink">
                3T<span className="text-brand">Store</span>
              </div>
              <div className="text-[11px] text-muted font-medium">Bảng điều khiển CSKH</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-muted hover:bg-paper hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-agent text-xs font-bold text-white">
              {auth.user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{auth.user?.name}</div>
              <div className="text-[11px] text-muted truncate">{auth.user?.email}</div>
            </div>
            <span className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
              role === 'admin' ? 'bg-flag-50 text-flag' : 'bg-agent-50 text-agent-600'
            }`}>{role}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggle}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs text-muted transition hover:bg-paper hover:text-ink"
            >
              {dark ? '☀️' : '🌙'} {dark ? 'Sáng' : 'Tối'}
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex-1 rounded-lg border border-danger/20 py-2 text-xs text-danger font-medium transition hover:bg-danger-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
