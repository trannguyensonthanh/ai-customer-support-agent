import { Router } from 'express';
import { runAgentStream } from '../agent/agentStream.js';
import { getOrCreateSession, markEscalated } from '../store/sessions.js';
import {
  conversationStore,
  messageStore,
  ticketStore,
  feedbackStore,
  faqStore,
  customerStore,
  orderStore,
} from '../db/store.js';
import { isKnowledgeBaseReady } from '../services/embeddingStore.js';
import { notifyAgents } from '../realtime/io.js';
import { verifyToken } from '../services/authService.js';

export const chatRouter = Router();

// Lay thong tin khach hang tu token (neu co)
function getCustomerContext(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'customer') return null;
  const customer = customerStore.getById(payload.sub);
  if (!customer) return null;
  // Lay don hang gan nhat
  let recentOrders = orderStore.byCustomer(customer.id);
  const byEmail = orderStore.byCustomerEmail(customer.email);
  const existingIds = new Set(recentOrders.map((o) => o.id));
  for (const o of byEmail) {
    if (!existingIds.has(o.id)) recentOrders.push(o);
  }
  recentOrders = recentOrders.slice(0, 3);
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    recentOrders: recentOrders.map((o) => ({
      code: o.code,
      status: o.status,
      total: o.total,
      placedAt: o.placedAt,
      items: (o.items || []).map((i) => i.name).join(', '),
    })),
  };
}

// POST /api/chat/stream  (SSE)
chatRouter.post('/chat/stream', async (req, res) => {
  const { message, sessionId, images, language } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Thieu noi dung tin nhan.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const customerContext = getCustomerContext(req);
  const { id, session } = getOrCreateSession(sessionId);
  const conv = conversationStore.ensure(id, customerContext?.name ? `${customerContext.name}` : undefined, customerContext?.id);
  
  // Cap nhat label neu co ten khach
  if (customerContext?.name && conv.label?.startsWith('Khách #')) {
    conversationStore.update(conv.id, { label: customerContext.name, customerId: customerContext.id });
  }

  const emit = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data || {})}\n\n`);
  };
  emit('meta', { sessionId: id, conversationId: conv.id, status: conv.status });

  const text = message.trim();

  // Nhan vien dang xu ly
  if (conv.status === 'human') {
    messageStore.add(conv.id, 'user', text);
    notifyAgents('agent:incoming', {
      conversationId: conv.id, sessionId: id, role: 'user', content: text, at: Date.now(),
    });
    emit('human_mode', {});
    emit('done', {});
    return res.end();
  }

  messageStore.add(conv.id, 'user', text);

  let fullReply = '';
  const wrapped = (event, data) => {
    if (event === 'delta') fullReply += data.text || '';
    emit(event, data);
  };

  try {
    const result = await runAgentStream({
      history: session.history,
      userMessage: text,
      images: Array.isArray(images) ? images : [],
      language: language === 'en' ? 'en' : 'vi',
      customerContext,
      emit: wrapped,
    });

    messageStore.add(conv.id, result.escalated ? 'human' : 'ai', fullReply);

    const patch = { sentiment: result.sentiment?.label || 'neutral' };

    // Luu conversation summary khi escalation
    if (result.escalated) {
      patch.status = 'escalated';
      patch.summary = result.conversationSummary || null;
      session.escalated = true;
      markEscalated(id);
      const ticket = ticketStore.create({
        conversationId: conv.id,
        sessionId: id,
        reason: result.escalationInfo?.reason || 'Khách yêu cầu hỗ trợ',
        summary: result.conversationSummary || result.escalationInfo?.summary || '',
      });
      notifyAgents('conversation_escalated', {
        conversationId: conv.id, sessionId: id, ticketId: ticket.id,
        summary: result.conversationSummary || '',
        customerName: customerContext?.name || conv.label,
      });
    } else {
      patch.resolvedByAI = true;
    }
    conversationStore.update(conv.id, patch);
  } catch (err) {
    console.error('[chat/stream] Loi:', err);
    emit('error', { message: 'Co loi xay ra phia may chu.', detail: err.message });
  } finally {
    res.end();
  }
});

// POST /api/feedback
chatRouter.post('/feedback', (req, res) => {
  const { sessionId, rating, comment } = req.body || {};
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Diem danh gia khong hop le.' });
  }
  feedbackStore.add({ sessionId, rating, comment: comment || '' });
  const conv = sessionId ? conversationStore.bySession(sessionId) : null;
  if (conv) conversationStore.update(conv.id, { csat: rating });
  res.json({ ok: true });
});

// GET /api/faqs
chatRouter.get('/faqs', (_req, res) => {
  res.json(faqStore.list().map((f) => ({ id: f.id, q: f.question, category: f.category })));
});

// GET /api/health
chatRouter.get('/health', (_req, res) => {
  res.json({ ok: true, ragSemantic: isKnowledgeBaseReady() });
});

// GET /api/chat/history/:sessionId
chatRouter.get('/chat/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conv = conversationStore.bySession(sessionId);
  if (!conv) return res.json({ messages: [] });
  const messages = messageStore.byConversation(conv.id);
  res.json({ messages: messages.map(m => ({
    id: m.id,
    role: m.role,
    text: m.content,
    ts: m.createdAt
  }))});
});
