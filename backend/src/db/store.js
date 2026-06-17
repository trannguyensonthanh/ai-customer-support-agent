import path from 'path';
import bcrypt from 'bcryptjs';
import { Collection, ensureDir } from './jsondb.js';
import { config } from '../config/env.js';
import { faqs as seedFaqs } from '../data/faqs.js';
import { orders as seedOrders } from '../data/orders.js';
import { products as seedProducts } from '../data/products.js';

const dir = path.resolve(config.dataDir);
ensureDir(dir);

export const db = {
  users: new Collection('users', dir),
  customers: new Collection('customers', dir),
  faqs: new Collection('faqs', dir),
  orders: new Collection('orders', dir),
  products: new Collection('products', dir),
  carts: new Collection('carts', dir),
  conversations: new Collection('conversations', dir),
  messages: new Collection('messages', dir),
  tickets: new Collection('tickets', dir),
  feedback: new Collection('feedback', dir),
  notifications: new Collection('notifications', dir),
  vouchers: new Collection('vouchers', dir),
  cannedResponses: new Collection('cannedResponses', dir),
  reviews: new Collection('reviews', dir),
};

// ====== Seed lan dau ======
export function seed() {
  // Admin + Agents
  if (db.users.count() === 0) {
    db.users.insert({
      email: config.adminEmail,
      name: config.adminName,
      role: 'admin',
      passwordHash: bcrypt.hashSync(config.adminPassword, 10),
    });
    // Seed agents
    const agents = [
      { email: 'nv.linh@3tstore.vn', name: 'Trần Thị Linh', role: 'agent' },
      { email: 'nv.duc@3tstore.vn', name: 'Nguyễn Văn Đức', role: 'agent' },
      { email: 'nv.mai@3tstore.vn', name: 'Lê Thị Mai', role: 'agent' },
    ];
    for (const a of agents) {
      db.users.insert({
        ...a,
        passwordHash: bcrypt.hashSync('agent123', 10),
      });
    }
    console.log(`[seed] Tao admin: ${config.adminEmail} + ${agents.length} agents`);
  }

  // FAQ
  if (db.faqs.count() === 0) {
    for (const f of seedFaqs) {
      db.faqs.insert({ category: f.category, question: f.q, answer: f.a, embedding: null });
    }
    console.log(`[seed] Nap ${seedFaqs.length} FAQ`);
  }

  // Don hang
  if (db.orders.count() === 0) {
    for (const o of seedOrders) db.orders.insert(o);
    console.log(`[seed] Nap ${seedOrders.length} don hang`);
  }

  // San pham
  if (db.products.count() === 0) {
    for (const p of seedProducts) db.products.insert(p);
    console.log(`[seed] Nap ${seedProducts.length} san pham`);
  }

  // Voucher mau
  if (db.vouchers.count() === 0) {
    const vouchers = [
      { code: 'FREESHIP', type: 'shipping', value: 0, minOrder: 0, description: 'Miễn phí vận chuyển', active: true },
      { code: 'GIAM10', type: 'percent', value: 10, minOrder: 200000, description: 'Giảm 10% đơn từ 200k', active: true },
      { code: 'GIAM50K', type: 'fixed', value: 50000, minOrder: 300000, description: 'Giảm 50k đơn từ 300k', active: true },
    ];
    for (const v of vouchers) db.vouchers.insert(v);
    console.log(`[seed] Nap ${vouchers.length} voucher`);
  }

  // Khach hang demo
  if (db.customers.count() === 0) {
    db.customers.insert({
      email: 'an.nguyen@example.com',
      name: 'Nguyễn Văn An',
      phone: '0901234567',
      address: '123 Nguyễn Huệ, Q.1, TP.HCM',
      passwordHash: bcrypt.hashSync('123456', 10),
    });
    db.customers.insert({
      email: 'binh.tran@example.com',
      name: 'Trần Thị Bình',
      phone: '0912345678',
      address: '456 Lê Lợi, Q.3, TP.HCM',
      passwordHash: bcrypt.hashSync('123456', 10),
    });
    console.log('[seed] Tao 2 khach demo (pass: 123456)');
  }
}

// ====== FAQ ======
export const faqStore = {
  list: () => db.faqs.all(),
  create: (data) => db.faqs.insert({ ...data, embedding: null }),
  update: (id, data) => db.faqs.update(id, { ...data, embedding: null }),
  remove: (id) => db.faqs.remove(id),
  setEmbedding: (id, embedding) => db.faqs.update(id, { embedding }),
  incrementHit: (id) => {
    const f = db.faqs.getById(id);
    if (f) db.faqs.update(id, { hits: (f.hits || 0) + 1 });
  },
};

export const normalizeVi = (str) => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export const productStore = {
  all: () => db.products.all(),
  getById: (id) => db.products.getById(id),
  byCode: (code) =>
    db.products.findOne((p) => p.code.toUpperCase() === String(code).trim().toUpperCase()),
  search: ({ query, category, minPrice, maxPrice, inStock } = {}) => {
    let results = db.products.all();
    if (query) {
      const qRaw = query.toLowerCase();
      const qNorm = normalizeVi(query);
      results = results.filter((p) => {
        const nameRaw = (p.name || '').toLowerCase();
        const descRaw = (p.description || '').toLowerCase();
        const tagsRaw = (p.tags || []).map(t => t.toLowerCase());
        
        // Match exact or normalized
        if (nameRaw.includes(qRaw) || descRaw.includes(qRaw) || tagsRaw.some(t => t.includes(qRaw))) return true;
        
        const nameNorm = normalizeVi(p.name);
        const descNorm = normalizeVi(p.description);
        const tagsNorm = (p.tags || []).map(normalizeVi);
        return nameNorm.includes(qNorm) || descNorm.includes(qNorm) || tagsNorm.some(t => t.includes(qNorm));
      });
    }
    if (category) {
      results = results.filter((p) => p.category === category);
    }
    if (minPrice != null) results = results.filter((p) => p.price >= minPrice);
    if (maxPrice != null) results = results.filter((p) => p.price <= maxPrice);
    if (inStock) results = results.filter((p) => p.stock > 0);
    return results;
  },
  updateStock: (id, delta) => {
    const p = db.products.getById(id);
    if (p) {
      const newStock = Math.max(0, (p.stock || 0) + delta);
      db.products.update(id, { stock: newStock });
      return newStock;
    }
    return null;
  },
  update: (id, patch) => db.products.update(id, patch),
  categories: () => [...new Set(db.products.all().map((p) => p.category))],
};

// ====== Don hang ======
export const orderStore = {
  all: () => db.orders.all(),
  getById: (id) => db.orders.getById(id),
  byCode: (code) =>
    db.orders.findOne((o) => o.code.toUpperCase() === String(code).trim().toUpperCase()),
  byContact: (contact) => {
    const c = String(contact).trim().toLowerCase();
    return db.orders.find(
      (o) => (o.email || '').toLowerCase() === c || o.phone === c.replace(/\s/g, '')
    );
  },
  byCustomer: (customerId) =>
    db.orders
      .find((o) => o.customerId === customerId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
  byCustomerEmail: (email) =>
    db.orders
      .find((o) => (o.email || '').toLowerCase() === email.toLowerCase())
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
  create: (data) => db.orders.insert(data),
  update: (id, patch) => db.orders.update(id, patch),
  nextCode: () => {
    const all = db.orders.all();
    const maxNum = all.reduce((max, o) => {
      const m = (o.code || '').match(/DH(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 1000);
    return `DH${maxNum + 1}`;
  },
  cancelOrder: (code, reason) => {
    const order = orderStore.byCode(code);
    if (!order) return { success: false, message: 'Không tìm thấy đơn hàng.' };
    const cancellable = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
    if (!cancellable.includes(order.status)) {
      return { success: false, message: `Đơn đang ở trạng thái "${order.status}", không thể hủy. Bạn có thể từ chối nhận hàng khi shipper giao.` };
    }
    const timeline = (order.timeline || []).map((s) =>
      s.step === 'Đã hủy' ? { ...s, done: true, at: new Date().toLocaleString('vi-VN') } : s
    );
    db.orders.update(order.id, { status: 'Đã hủy', cancelReason: reason || '', timeline });
    // Hoan lai ton kho
    for (const item of order.items || []) {
      const qty = item.qty || 1;
      let pId = item.productId;
      if (!pId) {
        // Thu tim qua code hoac ten neu data seed cu
        const all = db.products.all();
        const p = item.code 
          ? all.find(x => x.code === item.code)
          : all.find(x => x.name === item.name);
        if (p) pId = p.id;
      }
      if (pId) {
        productStore.updateStock(pId, qty);
      }
    }
    return { success: true, message: `Đơn ${code} đã được hủy thành công.`, order: { ...order, status: 'Đã hủy' } };
  },
  updateStatus: (id, newStatus, note) => {
    const order = db.orders.getById(id);
    if (!order) return null;
    const timeline = (order.timeline || []).map((s) => {
      if (s.step === newStatus) {
        return { ...s, done: true, at: new Date().toLocaleString('vi-VN'), note: note || undefined };
      }
      return s;
    });
    return db.orders.update(id, { status: newStatus, timeline });
  },
};

// ====== Khach hang ======
export const customerStore = {
  byEmail: (email) =>
    db.customers.findOne((c) => c.email.toLowerCase() === String(email).toLowerCase()),
  getById: (id) => db.customers.getById(id),
  create: (data) => db.customers.insert(data),
  update: (id, patch) => db.customers.update(id, patch),
};

// ====== Gio hang ======
export const cartStore = {
  getByCustomer: (customerId) => {
    let cart = db.carts.findOne((c) => c.customerId === customerId);
    if (!cart) {
      cart = db.carts.insert({ customerId, items: [] });
    }
    return cart;
  },
  addItem: (customerId, productId, qty = 1) => {
    const cart = cartStore.getByCustomer(customerId);
    const items = [...(cart.items || [])];
    const idx = items.findIndex((i) => i.productId === productId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    } else {
      items.push({ productId, qty });
    }
    return db.carts.update(cart.id, { items });
  },
  updateItem: (customerId, productId, qty) => {
    const cart = cartStore.getByCustomer(customerId);
    let items = [...(cart.items || [])];
    if (qty <= 0) {
      items = items.filter((i) => i.productId !== productId);
    } else {
      const idx = items.findIndex((i) => i.productId === productId);
      if (idx >= 0) items[idx] = { ...items[idx], qty };
    }
    return db.carts.update(cart.id, { items });
  },
  clear: (customerId) => {
    const cart = cartStore.getByCustomer(customerId);
    return db.carts.update(cart.id, { items: [] });
  },
  getDetailed: (customerId) => {
    const cart = cartStore.getByCustomer(customerId);
    const items = (cart.items || []).map((item) => {
      const product = db.products.getById(item.productId);
      return product
        ? { ...item, name: product.name, price: product.price, image: product.image, stock: product.stock, code: product.code }
        : item;
    }).filter((item) => item.name); // bo item khong con san pham
    return { ...cart, items };
  },
};

// ====== Voucher ======
export const voucherStore = {
  all: () => db.vouchers.all().filter((v) => v.active),
  byCode: (code) =>
    db.vouchers.findOne((v) => v.code.toUpperCase() === String(code).trim().toUpperCase() && v.active),
  apply: (code, orderTotal) => {
    const v = voucherStore.byCode(code);
    if (!v) return { valid: false, message: 'Mã giảm giá không tồn tại.' };
    if (orderTotal < (v.minOrder || 0)) {
      return { valid: false, message: `Đơn tối thiểu ${(v.minOrder || 0).toLocaleString('vi-VN')}đ để dùng mã này.` };
    }
    let discount = 0;
    if (v.type === 'percent') discount = Math.round(orderTotal * v.value / 100);
    else if (v.type === 'fixed') discount = v.value;
    else if (v.type === 'shipping') discount = 0; // mien phi ship xu ly rieng
    return { valid: true, discount, type: v.type, description: v.description };
  },
};

// ====== Hoi thoai + tin nhan ======
export const conversationStore = {
  ensure: (sessionId, label, customerId) => {
    let c = db.conversations.findOne((x) => x.sessionId === sessionId);
    if (!c) {
      c = db.conversations.insert({
        sessionId,
        label: label || `Khách #${sessionId.slice(0, 4)}`,
        customerId: customerId || null,
        status: 'bot',
        assignedAgent: null,
        sentiment: 'neutral',
        lastAt: Date.now(),
        resolvedByAI: false,
        summary: null,
      });
    }
    return c;
  },
  get: (id) => db.conversations.getById(id),
  bySession: (sessionId) => db.conversations.findOne((x) => x.sessionId === sessionId),
  update: (id, patch) => db.conversations.update(id, { ...patch, lastAt: Date.now() }),
  list: () =>
    db.conversations.all().sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)),
};

export const messageStore = {
  add: (conversationId, role, content, extra = {}) =>
    db.messages.insert({ conversationId, role, content, ...extra }),
  byConversation: (conversationId) =>
    db.messages
      .find((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt),
};

// ====== Ticket ======
export const ticketStore = {
  create: (data) => db.tickets.insert({ status: 'open', ...data }),
  list: () => db.tickets.all().sort((a, b) => b.createdAt - a.createdAt),
  update: (id, patch) => db.tickets.update(id, patch),
};

// ====== Feedback (CSAT) ======
export const feedbackStore = {
  add: (data) => db.feedback.insert(data),
  all: () => db.feedback.all(),
};

// ====== Thong bao ======
export const notificationStore = {
  create: (customerId, data) =>
    db.notifications.insert({ customerId, read: false, ...data }),
  byCustomer: (customerId) =>
    db.notifications
      .find((n) => n.customerId === customerId)
      .sort((a, b) => b.createdAt - a.createdAt),
  unreadCount: (customerId) =>
    db.notifications.count((n) => n.customerId === customerId && !n.read),
  markRead: (id) => db.notifications.update(id, { read: true }),
  markAllRead: (customerId) => {
    db.notifications
      .find((n) => n.customerId === customerId && !n.read)
      .forEach((n) => db.notifications.update(n.id, { read: true }));
  },
};

// ====== Nguoi dung (admin/agent) ======
export const userStore = {
  byEmail: (email) =>
    db.users.findOne((u) => u.email.toLowerCase() === String(email).toLowerCase()),
  getById: (id) => db.users.getById(id),
};

// ====== Dánh giá san pham ======
export const reviewStore = {
  byProduct: (productId) =>
    db.reviews
      .find((r) => r.productId === productId)
      .sort((a, b) => b.createdAt - a.createdAt),
  add: (data) => db.reviews.insert(data),
};
