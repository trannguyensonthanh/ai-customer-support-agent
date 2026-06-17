import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import CartDrawer from './CartDrawer.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { customer, logout, getRole } = useCustomerAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef(null);
  const role = getRole();
  const isStaff = role === 'admin' || role === 'agent';

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navCls = ({ isActive }) =>
    `text-sm font-medium transition ${isActive ? 'text-brand' : 'text-muted hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-agent text-white text-xs font-black">
            3T
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            3T<span className="text-brand">Store</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/" end className={navCls}>Trang chủ</NavLink>
          <NavLink to="/products" className={navCls}>Sản phẩm</NavLink>
          {customer && !isStaff && <NavLink to="/orders" className={navCls}>Đơn hàng</NavLink>}
          <NavLink to="/chat" className={navCls}>Chat AI</NavLink>
          {isStaff && <NavLink to="/admin" className={navCls}>Quản trị</NavLink>}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Dark mode */}
          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-brand"
            aria-label="Đổi giao diện"
          >
            {dark ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>

          {customer && !isStaff && <NotificationBell />}
          {customer && !isStaff && <CartDrawer />}

          {/* User */}
          {customer ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="ml-1 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-agent text-xs font-bold text-white">
                  {customer.name?.charAt(0)?.toUpperCase() || 'K'}
                </span>
                <span className="hidden sm:inline">{customer.name?.split(' ').pop()}</span>
                {isStaff && (
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                    role === 'admin' ? 'bg-flag-50 text-flag' : 'bg-agent-50 text-agent-600'
                  }`}>{role}</span>
                )}
              </button>
              {userMenu && (
                <div className="anim-slidedown absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
                  <div className="border-b border-line px-4 py-3">
                    <div className="text-sm font-semibold text-ink">{customer.name}</div>
                    <div className="text-xs text-muted truncate">{customer.email}</div>
                    {isStaff && <div className="mt-1 text-[11px] font-bold text-brand uppercase">{role === 'admin' ? 'Quản trị viên' : 'Nhân viên CSKH'}</div>}
                  </div>
                  {!isStaff && (
                    <>
                      <Link to="/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-ink transition hover:bg-paper">Tài khoản</Link>
                      <Link to="/orders" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-ink transition hover:bg-paper">Đơn hàng</Link>
                    </>
                  )}
                  {isStaff && (
                    <Link to="/admin" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-ink transition hover:bg-paper">Bảng điều khiển</Link>
                  )}
                  <button
                    onClick={() => { logout(); setUserMenu(false); navigate('/login'); }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-danger transition hover:bg-paper"
                  >Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-1 rounded-xl bg-gradient-to-r from-brand to-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-brand/20"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
