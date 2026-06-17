const BASE = '/api/customer';

function getToken() {
  try {
    const raw = localStorage.getItem('sv_customer');
    return raw ? JSON.parse(raw).token : null;
  } catch { return null; }
}

async function authFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Lỗi máy chủ.');
  }
  return res.json();
}

// Auth
export const customerRegister = (data) =>
  authFetch('/register', { method: 'POST', body: JSON.stringify(data) });

export const customerLogin = (email, password) =>
  authFetch('/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// Profile
export const getProfile = () => authFetch('/profile');
export const updateProfile = (data) =>
  authFetch('/profile', { method: 'PUT', body: JSON.stringify(data) });

// Cart
export const getCart = () => authFetch('/cart');
export const addToCart = (productId, qty = 1) =>
  authFetch('/cart/add', { method: 'POST', body: JSON.stringify({ productId, qty }) });
export const updateCartItem = (productId, qty) =>
  authFetch('/cart/update', { method: 'PUT', body: JSON.stringify({ productId, qty }) });
export const clearCart = () => authFetch('/cart', { method: 'DELETE' });

// Checkout
export const checkout = (data) =>
  authFetch('/checkout', { method: 'POST', body: JSON.stringify(data) });

// Orders
export const getMyOrders = (status) =>
  authFetch(`/orders${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`);
export const getMyOrder = (code) => authFetch(`/orders/${code}`);
export const cancelMyOrder = (code, reason) =>
  authFetch(`/orders/${code}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });

// Notifications
export const getNotifications = () => authFetch('/notifications');
export const markNotificationRead = (id) =>
  authFetch(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () =>
  authFetch('/notifications/read-all', { method: 'POST' });

// Voucher
export const checkVoucher = (code, orderTotal) =>
  authFetch('/voucher/check', { method: 'POST', body: JSON.stringify({ code, orderTotal }) });

// Products (public, no auth)
export const fetchProducts = async (params = {}) => {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.category) qs.set('category', params.category);
  if (params.sort) qs.set('sort', params.sort);
  if (params.minPrice) qs.set('minPrice', params.minPrice);
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice);
  const res = await fetch(`/api/products?${qs}`);
  return res.ok ? res.json() : [];
};

export const fetchProduct = async (id) => {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Không tìm thấy sản phẩm.');
  return res.json();
};

export const fetchProductReviews = async (id) => {
  const res = await fetch(`/api/products/${id}/reviews`);
  return res.ok ? res.json() : [];
};

export const fetchCategories = async () => {
  const res = await fetch('/api/products/categories');
  return res.ok ? res.json() : [];
};
