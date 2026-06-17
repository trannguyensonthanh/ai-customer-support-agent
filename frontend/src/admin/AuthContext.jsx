import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);
const KEY = 'cskh_auth';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    // Use unified login API
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'Đăng nhập thất bại.');
    }
    const data = await res.json();
    if (data.role !== 'admin' && data.role !== 'agent') {
      throw new Error('Tài khoản không có quyền truy cập quản trị.');
    }
    localStorage.setItem(KEY, JSON.stringify(data));
    setAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem('sv_customer');
    setAuth(null);
  };

  return <Ctx.Provider value={{ auth, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
