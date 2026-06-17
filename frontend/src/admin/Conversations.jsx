import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';
import { createAgentSocket } from './agentSocket.js';
import MarkdownText from '../components/MarkdownText.jsx';

const STATUS = {
  bot: { label: 'AI đang xử lý', cls: 'bg-brand-50 text-brand-600' },
  escalated: { label: 'Chờ nhân viên', cls: 'bg-flag-50 text-flag' },
  human: { label: 'Nhân viên', cls: 'bg-agent-50 text-agent-600' },
  closed: { label: 'Đã đóng', cls: 'bg-line text-muted' },
};

function Bubble({ m }) {
  if (m.role === 'system') {
    return <div className="my-3 text-center text-xs font-medium text-muted bg-line/30 rounded-full px-3 py-1 w-max mx-auto">{m.content}</div>;
  }
  
  const isAgent = m.role === 'human';
  const isCustomer = m.role === 'user';
  const isAi = !isAgent && !isCustomer;

  return (
    <div className={`flex w-full mb-4 ${isAgent ? 'justify-end' : 'justify-start'}`}>
      {!isAgent && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm ${isAi ? 'bg-brand text-white' : 'bg-surface text-brand font-bold border border-brand-100'}`}>
          {isAi ? 'AI' : 'KH'}
        </div>
      )}
      <div
        className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
          isCustomer
            ? 'bg-surface text-ink border border-line rounded-tl-sm'
            : isAgent
              ? 'bg-brand text-white rounded-tr-sm'
              : 'bg-brand-50 text-ink border border-brand-100 rounded-tl-sm'
        }`}
      >
        {isAi && <div className="mb-1 text-[11px] font-bold text-brand-600 uppercase tracking-wider">Trợ lý AI</div>}
        {isCustomer && <div className="mb-1 text-[11px] font-bold text-muted uppercase tracking-wider">Khách hàng</div>}
        <MarkdownText text={m.content || ''} />
      </div>
    </div>
  );
}

export default function Conversations() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const api = adminApi(auth.token);

  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null); // {conversation, messages}
  const [reply, setReply] = useState('');
  const selectedIdRef = useRef(null);
  const socketRef = useRef(null);
  const endRef = useRef(null);

  const loadList = () =>
    api.getConversations().then(setList).catch((e) => {
      if (e.message === 'UNAUTHORIZED') {
        logout();
        navigate('/admin/login');
      }
    });

  const openConversation = async (id) => {
    selectedIdRef.current = id;
    const d = await api.getConversation(id);
    setSelected(d);
  };

  useEffect(() => {
    loadList();
    const s = createAgentSocket(auth.token);
    socketRef.current = s;

    const refresh = () => loadList();
    const onIncoming = ({ conversationId, role, content }) => {
      loadList();
      if (conversationId === selectedIdRef.current) {
        setSelected((prev) =>
          prev ? { ...prev, messages: [...prev.messages, { id: Math.random(), role, content }] } : prev
        );
      }
    };
    s.on('conversation_escalated', refresh);
    s.on('agent:conversation_updated', refresh);
    s.on('agent:incoming', onIncoming);

    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages?.length]);

  const conv = selected?.conversation;

  const takeOver = () => {
    socketRef.current?.emit('agent:take', { conversationId: conv.id });
    setSelected((prev) => ({ ...prev, conversation: { ...prev.conversation, status: 'human', assignedAgent: auth.user.name } }));
  };

  const sendReply = () => {
    const t = reply.trim();
    if (!t || !conv) return;
    socketRef.current?.emit('agent:message', { conversationId: conv.id, text: t });
    setSelected((prev) => ({ ...prev, messages: [...prev.messages, { id: Math.random(), role: 'human', content: t }] }));
    setReply('');
  };

  const resolve = () => {
    socketRef.current?.emit('agent:resolve', { conversationId: conv.id });
    setSelected((prev) => ({ ...prev, conversation: { ...prev.conversation, status: 'closed' } }));
  };

  const returnToAi = () => {
    socketRef.current?.emit('agent:return_to_ai', { conversationId: conv.id });
    setSelected((prev) => ({ ...prev, conversation: { ...prev.conversation, status: 'bot' } }));
  };

  return (
    <div className="flex h-screen">
      {/* Danh sach hoi thoai */}
      <div className="flex w-80 shrink-0 flex-col border-r border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h1 className="font-display text-lg font-bold text-ink">Hội thoại</h1>
          <p className="text-xs text-muted">Cập nhật theo thời gian thực</p>
        </div>
        <div className="scroll-soft flex-1 overflow-y-auto">
          {list.map((c) => {
            const st = STATUS[c.status] || STATUS.bot;
            const active = c.id === selectedIdRef.current;
            return (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`block w-full border-b border-line px-4 py-3 text-left transition hover:bg-paper ${
                  active ? 'bg-brand-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{c.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted">{c.preview || '—'}</div>
              </button>
            );
          })}
          {list.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted">Chưa có hội thoại.</div>}
        </div>
      </div>

      {/* Chi tiet */}
      <div className="flex flex-1 flex-col bg-paper">
        {!conv ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Chọn một hội thoại để xem chi tiết
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
              <div>
                <div className="font-display text-sm font-semibold text-ink">{conv.label}</div>
                <div className="text-xs text-muted">
                  {(STATUS[conv.status] || STATUS.bot).label}
                  {conv.assignedAgent ? ` · ${conv.assignedAgent}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                {conv.status === 'human' && (
                  <button onClick={returnToAi} className="rounded-lg border border-line px-3 py-1.5 text-xs text-brand hover:bg-brand-50">
                    Chuyển lại AI
                  </button>
                )}
                {conv.status !== 'human' && conv.status !== 'closed' && (
                  <button onClick={takeOver} className="rounded-lg bg-agent px-3 py-1.5 text-xs font-medium text-white hover:bg-agent-600">
                    Tiếp quản
                  </button>
                )}
                {conv.status !== 'closed' && (
                  <button onClick={resolve} className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:bg-paper">
                    Đóng
                  </button>
                )}
              </div>
            </div>

            <div className="scroll-soft flex-1 overflow-y-auto p-5 bg-[#f0f2f5]">
              {selected.messages.map((m) => <Bubble key={m.id} m={m} />)}
              <div ref={endRef} />
            </div>

            <div className="border-t border-line bg-surface px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
              {conv.status === 'human' ? (
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                    placeholder="Trả lời khách hàng…"
                    className="flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <button onClick={sendReply} className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                    Gửi
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs text-muted">
                  {conv.status === 'closed' ? 'Hội thoại đã đóng.' : 'Bấm "Tiếp quản" để trả lời trực tiếp khách hàng.'}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
