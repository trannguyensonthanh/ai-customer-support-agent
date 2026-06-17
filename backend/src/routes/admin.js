import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  db,
  faqStore,
  conversationStore,
  messageStore,
  ticketStore,
  feedbackStore,
  orderStore,
  customerStore,
  notificationStore,
  productStore,
} from '../db/store.js';
import { getLlmSettings, saveLlmSettings } from '../config/llmSettings.js';
import { syncEmbeddings } from '../services/embeddingStore.js';
import { processPdfToFaqs } from '../services/pdfStore.js';
import { sendToCustomerByOrderId } from '../realtime/io.js';
import { hashPassword } from '../services/authService.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.get('/llm-settings', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Require Admin role' });
  res.json(getLlmSettings());
});

adminRouter.put('/llm-settings', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Require Admin role' });
  const updated = saveLlmSettings(req.body);
  res.json({ success: true, settings: updated });
});

const upload = multer({ dest: 'uploads/' });

// POST /api/admin/upload-pdf
adminRouter.post('/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chưa đính kèm file.' });
  const category = req.body.category || 'Chính sách (PDF)';
  try {
    const result = await processPdfToFaqs(req.file.path, category);
    // Xóa file tạm
    fs.unlinkSync(req.file.path);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ====== User Management (Admin/Agent/Customer) ======

// GET /api/admin/users — List all users (admin + agents)
adminRouter.get('/users', (req, res) => {
  const users = db.users.all().map(u => ({
    id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt,
  }));
  const customers = db.customers.all().map(c => ({
    id: c.id, email: c.email, name: c.name, role: 'customer', phone: c.phone, address: c.address, createdAt: c.createdAt,
  }));
  res.json({ users, customers });
});

// POST /api/admin/users — Create new agent/admin
adminRouter.post('/users', (req, res) => {
  const { email, name, role, password } = req.body || {};
  if (!email || !name || !password) return res.status(400).json({ error: 'Thiếu thông tin.' });
  if (!['admin', 'agent'].includes(role)) return res.status(400).json({ error: 'Role phải là admin hoặc agent.' });
  // Check duplicate
  const existing = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email đã tồn tại.' });
  const user = db.users.insert({ email: email.toLowerCase().trim(), name: name.trim(), role, passwordHash: hashPassword(password) });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

// PUT /api/admin/users/:id — Update user
adminRouter.put('/users/:id', (req, res) => {
  const { name, email, role, password } = req.body || {};
  const patch = {};
  if (name) patch.name = name.trim();
  if (email) patch.email = email.toLowerCase().trim();
  if (role && ['admin', 'agent'].includes(role)) patch.role = role;
  if (password) patch.passwordHash = hashPassword(password);
  const updated = db.users.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Không tìm thấy.' });
  res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role });
});

// DELETE /api/admin/users/:id — Delete user
adminRouter.delete('/users/:id', (req, res) => {
  // Don't allow deleting yourself
  if (req.user.sub === req.params.id) return res.status(400).json({ error: 'Không thể xóa chính mình.' });
  db.users.remove(req.params.id);
  res.json({ ok: true });
});

// ====== Product Management ======

// GET /api/admin/products
adminRouter.get('/products', (_req, res) => {
  res.json(productStore.all());
});

// POST /api/admin/products — Create product
adminRouter.post('/products', (req, res) => {
  const { name, code, category, price, originalPrice, description, image, stock, tags } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: 'Thiếu tên hoặc giá sản phẩm.' });
  const product = db.products.insert({
    name, code: code || `SP${Date.now()}`, category: category || 'Khác',
    price: Number(price), originalPrice: Number(originalPrice || price),
    description: description || '', image: image || '', stock: Number(stock || 0),
    tags: tags || [], rating: 0, reviews: 0, sold: 0,
  });
  res.json(product);
});

// PUT /api/admin/products/:id — Update product
adminRouter.put('/products/:id', (req, res) => {
  const { name, code, category, price, originalPrice, description, image, stock, tags } = req.body || {};
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (code !== undefined) patch.code = code;
  if (category !== undefined) patch.category = category;
  if (price !== undefined) patch.price = Number(price);
  if (originalPrice !== undefined) patch.originalPrice = Number(originalPrice);
  if (description !== undefined) patch.description = description;
  if (image !== undefined) patch.image = image;
  if (stock !== undefined) patch.stock = Number(stock);
  if (tags !== undefined) patch.tags = tags;
  const updated = db.products.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json(updated);
});

// DELETE /api/admin/products/:id
adminRouter.delete('/products/:id', (req, res) => {
  db.products.remove(req.params.id);
  res.json({ ok: true });
});

// ====== FAQ ======
adminRouter.get('/faqs', (_req, res) => {
  res.json(
    faqStore.list().map((f) => ({
      id: f.id,
      category: f.category,
      question: f.question,
      answer: f.answer,
      hits: f.hits || 0,
      hasEmbedding: !!f.embedding,
    }))
  );
});

adminRouter.post('/faqs', async (req, res) => {
  const { category, question, answer } = req.body || {};
  if (!question || !answer) return res.status(400).json({ error: 'Thiếu nội dung FAQ.' });
  const f = faqStore.create({ category: category || 'Khác', question, answer });
  syncEmbeddings();
  res.json(f);
});

adminRouter.put('/faqs/:id', async (req, res) => {
  const { category, question, answer } = req.body || {};
  const f = faqStore.update(req.params.id, { category, question, answer });
  if (!f) return res.status(404).json({ error: 'Không tìm thấy FAQ.' });
  syncEmbeddings();
  res.json(f);
});

adminRouter.delete('/faqs/category/:categoryName', (req, res) => {
  const category = req.params.categoryName;
  const faqs = faqStore.all().filter(f => f.category === category);
  for (const f of faqs) {
    faqStore.remove(f.id);
  }
  syncEmbeddings();
  res.json({ ok: true, deleted: faqs.length });
});

adminRouter.delete('/faqs/:id', (req, res) => {
  faqStore.remove(req.params.id);
  res.json({ ok: true });
});

adminRouter.post('/faqs/bulk-delete', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  for (const id of ids) {
    faqStore.remove(id);
  }
  syncEmbeddings();
  res.json({ ok: true, deleted: ids.length });
});

// ====== Hoi thoai ======
adminRouter.get('/conversations', (_req, res) => {
  const list = conversationStore.list().map((c) => {
    const msgs = messageStore.byConversation(c.id);
    const last = msgs[msgs.length - 1];
    // Lay thong tin khach hang neu co
    let customerInfo = null;
    if (c.customerId) {
      const cust = customerStore.getById(c.customerId);
      if (cust) customerInfo = { name: cust.name, email: cust.email, phone: cust.phone };
    }
    return {
      id: c.id,
      sessionId: c.sessionId,
      label: c.label,
      status: c.status,
      assignedAgent: c.assignedAgent,
      sentiment: c.sentiment,
      csat: c.csat || null,
      summary: c.summary || null,
      customerId: c.customerId || null,
      customerInfo,
      lastAt: c.lastAt,
      messageCount: msgs.length,
      preview: last ? String(last.content).slice(0, 60) : '',
    };
  });
  res.json(list);
});

adminRouter.get('/conversations/:id', (req, res) => {
  const conv = conversationStore.get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });

  // Lay thong tin khach hang chi tiet
  let customerDetail = null;
  if (conv.customerId) {
    const cust = customerStore.getById(conv.customerId);
    if (cust) {
      const orders = orderStore.byCustomer(conv.customerId);
      const byEmail = orderStore.byCustomerEmail(cust.email);
      const allOrders = [...orders];
      const existingIds = new Set(orders.map((o) => o.id));
      for (const o of byEmail) {
        if (!existingIds.has(o.id)) allOrders.push(o);
      }
      customerDetail = {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        address: cust.address,
        orders: allOrders.slice(0, 5).map((o) => ({
          code: o.code,
          status: o.status,
          total: o.total,
          placedAt: o.placedAt,
        })),
      };
    }
  }

  res.json({
    conversation: conv,
    messages: messageStore.byConversation(conv.id),
    customerDetail,
  });
});

// ====== Don hang (admin) ======
adminRouter.get('/orders', (req, res) => {
  const { status, search } = req.query;
  let orders = orderStore.all();
  if (status && status !== 'all') {
    orders = orders.filter((o) => o.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        (o.code || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q)
    );
  }
  orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(orders);
});

adminRouter.get('/orders/:id', (req, res) => {
  const order = orderStore.getById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  res.json(order);
});

// PUT /api/admin/orders/:id/status
adminRouter.put('/orders/:id/status', (req, res) => {
  const { status, note } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Thiếu trạng thái.' });
  const order = orderStore.updateStatus(req.params.id, status, note);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

  // Gui thong bao realtime + luu notification
  if (order.customerId) {
    notificationStore.create(order.customerId, {
      type: 'order',
      title: `Đơn ${order.code}: ${status}`,
      message: `Đơn hàng ${order.code} đã chuyển sang trạng thái "${status}".${note ? ` Ghi chú: ${note}` : ''}`,
      orderCode: order.code,
      orderId: order.id,
    });
  }

  // Phat su kien qua socket
  sendToCustomerByOrderId(order, status, note);

  res.json(order);
});

// POST /api/admin/orders/:id/cancel
adminRouter.post('/orders/:id/cancel', (req, res) => {
  const { reason } = req.body || {};
  const order = orderStore.getById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  const result = orderStore.cancelOrder(order.code, reason || 'Nhân viên hủy');
  if (!result.success) return res.status(400).json({ error: result.message });

  if (order.customerId) {
    notificationStore.create(order.customerId, {
      type: 'order',
      title: `Đơn ${order.code} đã bị hủy`,
      message: `Đơn hàng bị hủy. Lý do: ${reason || 'Không rõ'}.`,
      orderCode: order.code,
      orderId: order.id,
    });
  }
  sendToCustomerByOrderId(order, 'Đã hủy', reason);

  res.json(result);
});

// ====== Ticket ======
adminRouter.get('/tickets', (_req, res) => {
  res.json(ticketStore.list());
});

adminRouter.put('/tickets/:id', (req, res) => {
  const { status } = req.body || {};
  const t = ticketStore.update(req.params.id, { status });
  if (!t) return res.status(404).json({ error: 'Không tìm thấy ticket.' });
  res.json(t);
});

// ====== Analytics ======
adminRouter.get('/analytics', (_req, res) => {
  const convs = db.conversations.all();
  const total = convs.length;
  const escalated = convs.filter((c) => c.status === 'escalated' || c.status === 'human' || c.assignedAgent).length;
  const resolvedByAI = convs.filter((c) => c.resolvedByAI && !c.assignedAgent && c.status !== 'escalated').length;

  const fb = feedbackStore.all();
  const csatAvg = fb.length ? fb.reduce((s, f) => s + f.rating, 0) / fb.length : 0;

  // Luu luong 7 ngay gan nhat
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const start = d.getTime();
    const end = start + 86400000;
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    days.push({ day: label, count: convs.filter((c) => c.createdAt >= start && c.createdAt < end).length });
  }

  const topQuestions = faqStore
    .list()
    .filter((f) => (f.hits || 0) > 0)
    .sort((a, b) => (b.hits || 0) - (a.hits || 0))
    .slice(0, 5)
    .map((f) => ({ question: f.question, hits: f.hits }));

  // Thong ke don hang
  const orders = orderStore.all();
  const ordersByStatus = {};
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  }

  res.json({
    totalConversations: total,
    resolutionRate: total ? Math.round((resolvedByAI / total) * 100) : 0,
    escalationRate: total ? Math.round((escalated / total) * 100) : 0,
    csatAvg: Math.round(csatAvg * 10) / 10,
    csatCount: fb.length,
    openTickets: ticketStore.list().filter((t) => t.status !== 'resolved').length,
    volumeByDay: days,
    topQuestions,
    totalOrders: orders.length,
    ordersByStatus,
  });
});
