import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getProfile, updateProfile } from '../lib/customerApi.js';

const KEY = 'sv_customer';
const Ctx = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khoi phuc session tu localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setToken(data.token);
        setCustomer(data.customer || data.user);
      }
    } catch {}
    setLoading(false);
  }, []);

  const save = (data) => {
    localStorage.setItem(KEY, JSON.stringify(data));
    setToken(data.token);
    setCustomer(data.customer || data.user);
  };

  // Unified login — calls /api/auth/login which checks both users + customers
  const login = useCallback(async (email, password) => {
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
    // Store role for routing decisions
    save({ ...data, role: data.role });
    // Also store in admin auth key if admin/agent
    if (data.role === 'admin' || data.role === 'agent') {
      localStorage.setItem('cskh_auth', JSON.stringify(data));
    }
    return data;
  }, []);

  const register = useCallback(async ({ email, password, name, phone }) => {
    const res = await fetch('/api/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'Đăng ký thất bại.');
    }
    const data = await res.json();
    save({ ...data, role: 'customer' });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    localStorage.removeItem('cskh_auth');
    setToken(null);
    setCustomer(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
      const updated = { ...stored, customer: profile };
      localStorage.setItem(KEY, JSON.stringify(updated));
      setCustomer(profile);
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') logout();
    }
  }, [logout]);

  const editProfile = useCallback(async (data) => {
    const updated = await updateProfile(data);
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    localStorage.setItem(KEY, JSON.stringify({ ...stored, customer: updated }));
    setCustomer(updated);
    return updated;
  }, []);

  // Get current role
  const getRole = useCallback(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw).role || 'customer' : null;
    } catch { return null; }
  }, []);

  return (
    <Ctx.Provider value={{ customer, token, loading, login, register, logout, refreshProfile, editProfile, getRole }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCustomerAuth = () => useContext(Ctx);
