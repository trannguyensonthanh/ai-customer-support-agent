import { Server } from 'socket.io';
import { verifyToken } from '../services/authService.js';
import { conversationStore, messageStore, ticketStore } from '../db/store.js';

let io = null;
const room = (sessionId) => `conv:${sessionId}`;
const customerRoom = (customerId) => `customer:${customerId}`;

export function initIo(httpServer, corsOrigin) {
  io = new Server(httpServer, { cors: { origin: corsOrigin, methods: ['GET', 'POST'] } });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    const user = token ? verifyToken(token) : null;

    // Nhan vien
    if (user && (user.role === 'admin' || user.role === 'agent')) {
      socket.data.agent = user;
      socket.join('agents');
    }

    // Khach hang dang nhap -> join phong rieng de nhan thong bao
    if (user && user.role === 'customer') {
      socket.data.customer = user;
      socket.join(customerRoom(user.sub));
    }

    // Khach tham gia phong hoi thoai
    socket.on('customer:join', ({ sessionId }) => {
      if (sessionId) socket.join(room(sessionId));
    });

    // Khach gui tin khi nhan vien dang xu ly
    socket.on('customer:message', ({ sessionId, text }) => {
      if (!sessionId || !text) return;
      const conv = conversationStore.bySession(sessionId);
      if (!conv) return;
      messageStore.add(conv.id, 'user', text);
      conversationStore.update(conv.id, {});
      io.to('agents').emit('agent:incoming', {
        conversationId: conv.id,
        sessionId,
        role: 'user',
        content: text,
        at: Date.now(),
      });
    });

    // ====== Typing indicators ======
    socket.on('customer:typing', ({ sessionId }) => {
      io.to('agents').emit('agent:customer_typing', { sessionId });
    });

    socket.on('customer:cancel_escalation', ({ sessionId }) => {
      if (!sessionId) return;
      const conv = conversationStore.bySession(sessionId);
      if (!conv || conv.status !== 'escalated') return;
      
      // Chuyển lại trạng thái về bot
      conversationStore.update(conv.id, { status: 'bot' });
      
      // Hủy ticket đang open nếu có
      ticketStore.list()
        .filter((t) => t.conversationId === conv.id && t.status === 'open')
        .forEach((t) => ticketStore.update(t.id, { status: 'resolved' }));
        
      messageStore.add(conv.id, 'system', 'Khách hàng đã hủy yêu cầu gặp nhân viên.');
      
      io.to('agents').emit('agent:conversation_updated', { conversationId: conv.id });
      io.to(room(sessionId)).emit('agent_message', {
        agentName: 'Hệ thống',
        text: 'Đã hủy yêu cầu chuyển máy. Trợ lý AI đã quay lại hỗ trợ bạn!',
      });
    });

    socket.on('customer:stop_typing', ({ sessionId }) => {
      io.to('agents').emit('agent:customer_stop_typing', { sessionId });
    });

    socket.on('agent:typing', ({ conversationId }) => {
      if (!socket.data.agent) return;
      const conv = conversationStore.get(conversationId);
      if (conv) {
        io.to(room(conv.sessionId)).emit('agent_typing', {
          agentName: socket.data.agent.name,
        });
      }
    });

    socket.on('agent:stop_typing', ({ conversationId }) => {
      if (!socket.data.agent) return;
      const conv = conversationStore.get(conversationId);
      if (conv) {
        io.to(room(conv.sessionId)).emit('agent_stop_typing', {});
      }
    });

    // ====== Hanh dong nhan vien ======
    socket.on('agent:take', ({ conversationId }) => {
      if (!socket.data.agent) return;
      const conv = conversationStore.get(conversationId);
      if (!conv) return;
      conversationStore.update(conversationId, {
        status: 'human',
        assignedAgent: socket.data.agent.name,
      });
      io.to(room(conv.sessionId)).emit('agent_takeover', { agentName: socket.data.agent.name });
      io.to('agents').emit('agent:conversation_updated', { conversationId });
    });

    socket.on('agent:message', ({ conversationId, text }) => {
      if (!socket.data.agent || !text) return;
      const conv = conversationStore.get(conversationId);
      if (!conv) return;
      messageStore.add(conversationId, 'human', text, { agent: socket.data.agent.name });
      conversationStore.update(conversationId, {});
      io.to(room(conv.sessionId)).emit('agent_message', {
        text,
        agentName: socket.data.agent.name,
      });
      io.to('agents').emit('agent:conversation_updated', { conversationId });
    });

    socket.on('agent:resolve', ({ conversationId }) => {
      if (!socket.data.agent) return;
      const conv = conversationStore.get(conversationId);
      if (!conv) return;
      conversationStore.update(conversationId, { status: 'closed' });
      ticketStore
        .list()
        .filter((t) => t.conversationId === conversationId && t.status !== 'resolved')
        .forEach((t) => ticketStore.update(t.id, { status: 'resolved' }));
      io.to(room(conv.sessionId)).emit('conversation_closed', {});
      io.to('agents').emit('agent:conversation_updated', { conversationId });
    });
  });

  return io;
}

export function notifyAgents(event, data) {
  io?.to('agents').emit(event, data);
}

export function sendToCustomer(sessionId, event, data) {
  io?.to(room(sessionId)).emit(event, data);
}

// Gui thong bao trang thai don hang cho khach
export function sendToCustomerByOrderId(order, newStatus, note) {
  if (!io) return;
  // Gui vao phong customer neu co customerId
  if (order.customerId) {
    io.to(customerRoom(order.customerId)).emit('order_status_changed', {
      orderCode: order.code,
      orderId: order.id,
      newStatus,
      note: note || '',
      at: Date.now(),
    });
  }
  // Gui vao phong hoi thoai neu co sessionId trong conversation
  // (de widget chat cung nhan duoc)
}

// Gui thong bao chung cho 1 khach hang
export function notifyCustomer(customerId, event, data) {
  io?.to(customerRoom(customerId)).emit(event, data);
}
