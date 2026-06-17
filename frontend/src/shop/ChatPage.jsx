import { useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import Header from '../components/Header.jsx';
import ChatHeader from '../components/ChatHeader.jsx';
import MessageList from '../components/MessageList.jsx';
import ChatInput from '../components/ChatInput.jsx';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const [language, setLanguage] = useState('vi');
  const { messages, status, escalated, humanMode, followUps, send, requestRating, cancelEscalation } = useChat();
  const navigate = useNavigate();

  const busy = status !== 'idle';
  const showQuick = messages.filter((m) => m.role === 'user').length === 0;

  const handleSend = (text, images = []) => send(text, images, language);

  return (
    <div className="flex h-screen flex-col bg-surface overflow-hidden relative">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-50/80 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-agent-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Header />
      
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col min-h-0 z-10">
        <div className="flex-1 bg-paper/80 backdrop-blur-xl border border-line rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-black/5">
          <ChatHeader
            escalated={escalated}
            humanMode={humanMode}
            language={language}
            onLanguage={setLanguage}
            onRate={requestRating}
            onClose={() => navigate(-1)}
            onCancelEscalation={cancelEscalation}
          />
          
          <div className="flex-1 overflow-y-auto flex flex-col">
            <MessageList messages={messages} />
            
            {/* Enhanced Quick Replies for Empty Chat */}
            {showQuick && (
              <div className="px-6 pb-8 pt-4 anim-fadeup">
                <p className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Gợi ý câu hỏi nhanh</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: '📦', title: 'Tra cứu đơn hàng', desc: 'Kiểm tra trạng thái đơn hàng của bạn', text: 'Giúp tôi kiểm tra trạng thái đơn hàng gần nhất.' },
                    { icon: '🔥', title: 'Sản phẩm bán chạy', desc: 'Gợi ý các mặt hàng được mua nhiều nhất', text: 'Bạn có thể gợi ý cho tôi vài sản phẩm gia dụng đang bán chạy không?' },
                    { icon: '⭐', title: 'Đánh giá cao nhất', desc: 'Tìm sản phẩm chất lượng được review tốt', text: 'Tìm giúp tôi một vài sản phẩm có đánh giá 5 sao.' },
                    { icon: '💳', title: 'Khuyến mãi & Thanh toán', desc: 'Thông tin giảm giá và mã voucher', text: 'Hiện tại shop có những mã giảm giá nào?' },
                  ].map((q, i) => (
                    <button
                      key={i}
                      disabled={busy}
                      onClick={() => handleSend(q.text)}
                      className="flex items-start gap-4 p-4 rounded-2xl border border-line bg-surface text-left transition-all hover:border-brand hover:shadow-lg hover:-translate-y-0.5 group disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper shadow-sm ring-1 ring-line group-hover:bg-brand-50 group-hover:ring-brand-200 transition-colors text-lg">
                        {q.icon}
                      </div>
                      <div>
                        <div className="font-bold text-ink text-[14px] group-hover:text-brand transition-colors">{q.title}</div>
                        <div className="text-[12px] text-muted mt-0.5 leading-snug">{q.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* AI Suggested Follow-ups */}
          {!showQuick && followUps?.length > 0 && !busy && (
            <div className="flex flex-wrap gap-2 px-6 py-4 border-t border-line/50 bg-surface/50 backdrop-blur-md anim-fadeup">
              {followUps.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(text)}
                  disabled={busy}
                  className="rounded-full border border-brand/20 bg-brand-50/50 px-4 py-2 text-[13px] font-semibold text-brand-700 transition hover:border-brand hover:bg-brand hover:text-white hover:shadow-md"
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 sm:p-6 bg-surface/80 backdrop-blur-md border-t border-line/50">
            <ChatInput onSend={handleSend} disabled={busy} />
          </div>
        </div>
      </div>
    </div>
  );
}
