import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChat } from '../lib/api.js';
import { getCustomerSocket } from '../lib/customerSocket.js';

let idSeq = 0;
const nextId = () => `m${++idSeq}`;

const TOOL_LABEL = {
  search_knowledge_base: '📚 Đang tra cứu thông tin…',
  lookup_order: '📦 Đang tra cứu đơn hàng…',
  find_orders_by_contact: '🔍 Đang tìm đơn theo liên hệ…',
  search_products: '🛒 Đang tìm sản phẩm…',
  check_stock: '📊 Đang kiểm tra tồn kho…',
  cancel_order: '❌ Đang xử lý hủy đơn…',
  check_voucher: '🎫 Đang kiểm tra mã giảm giá…',
  escalate_to_human: '👤 Đang kết nối nhân viên…',
};

const welcome = () => ({
  id: nextId(),
  role: 'ai',
  text: 'Xin chào! Mình là Trợ lý AI của **3TStore** 🛍️\n\nMình có thể giúp bạn:\n- 🔍 Tra cứu đơn hàng\n- 🛒 Tìm & gợi ý sản phẩm\n- 📋 Giải đáp chính sách đổi trả, vận chuyển\n- ❌ Hủy đơn hàng\n\nBạn cần hỗ trợ gì nào?',
  ts: Date.now(),
});

export function useChat() {
  const [messages, setMessages] = useState([welcome()]);
  const [status, setStatus] = useState('idle');
  const [escalated, setEscalated] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [agentTyping, setAgentTyping] = useState(false);
  const sessionRef = useRef(null);
  const escalatedRef = useRef(false);
  const humanRef = useRef(false);
  const socketRef = useRef(null);

  // Load lich su chat khi khoi tao
  useEffect(() => {
    const savedSessionId = localStorage.getItem('sv_chat_session');
    if (savedSessionId) {
      sessionRef.current = savedSessionId;
      import('../lib/api.js').then(({ fetchChatHistory }) => {
        fetchChatHistory(savedSessionId).then((history) => {
          if (history && history.length > 0) {
            setMessages([welcome(), ...history]);
          }
        });
      });
    }
  }, []);

  const append = (msg) => setMessages((prev) => [...prev, { id: nextId(), ts: Date.now(), ...msg }]);
  const patch = (id, updater) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updater(m) } : m)));

  // Socket events
  useEffect(() => {
    const s = getCustomerSocket();
    socketRef.current = s;
    const onTakeover = ({ agentName }) => {
      humanRef.current = true;
      escalatedRef.current = true;
      setHumanMode(true);
      setEscalated(true);
      append({ role: 'system', text: `${agentName || 'Nhân viên'} đã tham gia cuộc trò chuyện` });
    };
    const onAgentMsg = ({ text }) => { setAgentTyping(false); append({ role: 'human', text }); };
    const onClosed = () => append({ role: 'system', text: 'Nhân viên đã kết thúc hỗ trợ. Cảm ơn bạn!' });
    const onAgentTyping = () => setAgentTyping(true);
    const onAgentStopTyping = () => setAgentTyping(false);

    s.on('agent_takeover', onTakeover);
    s.on('agent_message', onAgentMsg);
    s.on('conversation_closed', onClosed);
    s.on('agent_typing', onAgentTyping);
    s.on('agent_stop_typing', onAgentStopTyping);
    return () => {
      s.off('agent_takeover', onTakeover);
      s.off('agent_message', onAgentMsg);
      s.off('conversation_closed', onClosed);
      s.off('agent_typing', onAgentTyping);
      s.off('agent_stop_typing', onAgentStopTyping);
    };
  }, []);

  const send = useCallback(
    async (raw, images = [], language = 'vi') => {
      const text = (raw || '').trim();
      if ((!text && images.length === 0) || status !== 'idle') return;

      setFollowUps([]); // Clear follow-ups khi gui tin moi
      append({
        role: 'user',
        text,
        images: images.map((i) => i.preview).filter(Boolean),
      });

      // Typing indicator cho agent
      if (sessionRef.current) {
        socketRef.current?.emit('customer:typing', { sessionId: sessionRef.current });
      }

      // Che do nhan vien: gui qua socket, khong goi AI
      if (humanRef.current) {
        socketRef.current?.emit('customer:message', { sessionId: sessionRef.current, text });
        socketRef.current?.emit('customer:stop_typing', { sessionId: sessionRef.current });
        return;
      }

      const replyId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: replyId, role: escalatedRef.current ? 'human' : 'ai', text: '', orders: [], products: [], toolStatus: null, streaming: true, ts: Date.now() },
      ]);
      setStatus('streaming');

      try {
        await streamChat(
          {
            message: text || '(đã gửi hình ảnh)',
            images: images.map(({ mimeType, data }) => ({ mimeType, data })),
            language,
            sessionId: sessionRef.current,
          },
          {
            meta: (d) => {
              if (d.sessionId) {
                sessionRef.current = d.sessionId;
                localStorage.setItem('sv_chat_session', d.sessionId);
                socketRef.current?.emit('customer:join', { sessionId: d.sessionId });
              }
            },
            tool: (d) => patch(replyId, () => ({ toolStatus: TOOL_LABEL[d.name] || '⚙️ Đang xử lý…' })),
            order: (d) => patch(replyId, (m) => ({ orders: [...(m.orders || []), ...(d.orders || [])] })),
            products: (d) => patch(replyId, (m) => ({ products: [...(m.products || []), ...(d.products || [])] })),
            delta: (d) => patch(replyId, (m) => ({ text: (m.text || '') + (d.text || ''), toolStatus: null })),
            follow_ups: (d) => setFollowUps(d.suggestions || []),
            confidence: () => {}, // UI co the hien thi confidence indicator
            action_result: () => {}, // UI co the hien thi ket qua hanh dong
            escalated: () => {
              escalatedRef.current = true;
              setEscalated(true);
              patch(replyId, () => ({ role: 'human' }));
            },
            done: () => patch(replyId, () => ({ streaming: false, toolStatus: null })),
            error: () =>
              patch(replyId, () => ({ streaming: false, toolStatus: null, role: 'system', text: 'Mất kết nối tới máy chủ. Bạn kiểm tra lại backend và thử lại nhé.' })),
          }
        );
      } catch {
        patch(replyId, () => ({ streaming: false, role: 'system', text: 'Mất kết nối tới máy chủ. Bạn kiểm tra lại backend và thử lại nhé.' }));
      } finally {
        setStatus('idle');
        socketRef.current?.emit('customer:stop_typing', { sessionId: sessionRef.current });
      }
    },
    [status]
  );

  const requestRating = useCallback(() => {
    setMessages((prev) => {
      if (prev.some((m) => m.role === 'rating')) return prev;
      return [...prev, { id: nextId(), role: 'rating', sessionId: sessionRef.current, ts: Date.now() }];
    });
  }, []);

  const cancelEscalation = useCallback(() => {
    if (!escalated && !humanMode) return;
    socketRef.current?.emit('customer:cancel_escalation', { sessionId: sessionRef.current });
    setEscalated(false);
    setHumanMode(false);
  }, [escalated, humanMode]);

  return { messages, status, escalated, humanMode, followUps, agentTyping, send, requestRating, cancelEscalation };
}
