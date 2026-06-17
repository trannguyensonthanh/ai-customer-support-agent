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
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const role = getRole();
  const isStaff = role === 'admin' || role === 'agent';

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll detection for header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navCls = ({ isActive }) =>
    `relative text-sm font-medium transition-colors duration-200 py-1 ${
      isActive 
        ? 'text-brand' 
        : 'text-muted hover:text-ink'
    }`;

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled 
        ? 'glass shadow-sm shadow-black/[0.03]' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white text-[11px] font-black shadow-md shadow-brand/15 transition-transform group-hover:scale-105">
            3T
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            3T<span className="text-brand">Store</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-7 sm:flex">
          <NavLink to="/" end className={navCls}>Trang chủ</NavLink>
          <NavLink to="/products" className={navCls}>Sản phẩm</NavLink>
          {customer && !isStaff && <NavLink to="/orders" className={navCls}>Đơn hàng</NavLink>}
          <NavLink to="/chat" className={navCls}>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Chat AI
            </span>
          </NavLink>
          {isStaff && <NavLink to="/admin" className={navCls}>Quản trị</NavLink>}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Dark mode */}
          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-all hover:bg-brand-50 hover:text-brand active:scale-95"
            aria-label="Đổi giao diện"
          >
            {dark ? (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>

          {customer && !isStaff && <NotificationBell />}
          {customer && !isStaff && <CartDrawer />}

          {/* User */}
          {customer ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="ml-1.5 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:bg-brand-50 active:scale-[0.97]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-600 text-xs font-bold text-white shadow-sm">
                  {customer.name?.charAt(0)?.toUpperCase() || 'K'}
                </span>
                <span className="hidden text-ink sm:inline font-semibold">{customer.name?.split(' ').pop()}</span>
                {isStaff && (
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                    role === 'admin' ? 'bg-flag-50 text-flag' : 'bg-agent-50 text-agent-600'
                  }`}>{role}</span>
                )}
                <svg className={`h-4 w-4 text-muted transition-transform ${userMenu ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {userMenu && (
                <div className="anim-slidedown absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/8">
                  <div className="border-b border-line px-4 py-4">
                    <div className="text-sm font-bold text-ink">{customer.name}</div>
                    <div className="text-xs text-muted truncate mt-0.5">{customer.email}</div>
                    {isStaff && <div className="mt-2 text-[11px] font-bold text-brand uppercase">{role === 'admin' ? 'Quản trị viên' : 'Nhân viên CSKH'}</div>}
                  </div>
                  {!isStaff && (
                    <>
                      <Link to="/profile" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-ink transition hover:bg-paper group">
                        <svg className="h-4 w-4 text-muted group-hover:text-brand transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round"/><circle cx="12" cy="7" r="4"/></svg>
                        Tài khoản
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-ink transition hover:bg-paper group">
                        <svg className="h-4 w-4 text-muted group-hover:text-brand transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17v4"/></svg>
                        Đơn hàng
                      </Link>
                    </>
                  )}
                  {isStaff && (
                    <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-ink transition hover:bg-paper group">
                      <svg className="h-4 w-4 text-muted group-hover:text-brand transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      Bảng điều khiển
                    </Link>
                  )}
                  <div className="border-t border-line">
                    <button
                      onClick={() => { logout(); setUserMenu(false); navigate('/login'); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-danger transition hover:bg-danger-50 group"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/><path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 rounded-xl bg-gradient-to-r from-brand to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/15 transition-all hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
