import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
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
} from '../db/store.js';
import { syncEmbeddings } from '../services/embeddingStore.js';
import { sendToCustomerByOrderId } from '../realtime/io.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

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

adminRouter.delete('/faqs/:id', (req, res) => {
  faqStore.remove(req.params.id);
  res.json({ ok: true });
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
