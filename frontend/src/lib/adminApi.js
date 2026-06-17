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
    // FAQ
    getFaqs: () => f('/faqs'),
    createFaq: (data) => f('/faqs', { method: 'POST', body: JSON.stringify(data) }),
    updateFaq: (id, data) => f(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteFaq: (id) => f(`/faqs/${id}`, { method: 'DELETE' }),
    deleteFaqCategory: (categoryName) => f(`/faqs/category/${encodeURIComponent(categoryName)}`, { method: 'DELETE' }),
    bulkDeleteFaqs: (ids) => f('/faqs/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    uploadPdf: async (file, category) => {
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category + ' (PDF)');
      const res = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Bỏ Content-Type để trình duyệt tự set multipart/form-data kèm boundary
        body: formData,
      });
      if (!res.ok) throw new Error(await res.json().then(e => e.error).catch(() => 'Lỗi upload PDF'));
      return res.json();
    },
    // Conversations
    getConversations: () => f('/conversations'),
    getConversation: (id) => f(`/conversations/${id}`),
    // Tickets
    getTickets: () => f('/tickets'),
    updateTicket: (id, status) => f(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    // Analytics
    getAnalytics: () => f('/analytics'),
    // Users
    getUsers: () => f('/users'),
    createUser: (data) => f('/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id, data) => f(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id) => f(`/users/${id}`, { method: 'DELETE' }),
    // Products
    getProducts: () => f('/products'),
    createProduct: (data) => f('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => f(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id) => f(`/products/${id}`, { method: 'DELETE' }),
    // Settings
    getSettings: () => f('/llm-settings'),
    updateSettings: (data) => f('/llm-settings', { method: 'PUT', body: JSON.stringify(data) }),
  };
}
