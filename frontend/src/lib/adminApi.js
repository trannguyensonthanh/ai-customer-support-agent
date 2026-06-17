export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Đăng nhập thất bại.');
  }
  return res.json();
}

function authFetch(token) {
  return async (path, options = {}) => {
    const res = await fetch(`/api/admin${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'Lỗi máy chủ.');
    }
    return res.json();
  };
}

export function adminApi(token) {
  const f = authFetch(token);
  return {
    getFaqs: () => f('/faqs'),
    createFaq: (data) => f('/faqs', { method: 'POST', body: JSON.stringify(data) }),
    updateFaq: (id, data) => f(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteFaq: (id) => f(`/faqs/${id}`, { method: 'DELETE' }),
    getConversations: () => f('/conversations'),
    getConversation: (id) => f(`/conversations/${id}`),
    getTickets: () => f('/tickets'),
    updateTicket: (id, status) => f(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getAnalytics: () => f('/analytics'),
  };
}
