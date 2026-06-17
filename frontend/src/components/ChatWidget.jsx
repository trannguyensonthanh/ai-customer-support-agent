import { useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import ChatHeader from './ChatHeader.jsx';
import MessageList from './MessageList.jsx';
import QuickReplies from './QuickReplies.jsx';
import ChatInput from './ChatInput.jsx';
import { ChatIcon } from './icons.jsx';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState('vi');
  const { messages, status, escalated, humanMode, followUps, send, requestRating, cancelEscalation } = useChat();

  const busy = status !== 'idle';
  const showQuick = messages.filter((m) => m.role === 'user').length === 0;

  const handleSend = (text, images = []) => send(text, images, language);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý CSKH"
          className="anim-pop fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-brand px-4 py-3.5 text-white shadow-lg shadow-brand/30 transition hover:bg-brand-600"
        >
          <ChatIcon />
          <span className="font-display text-[15px] font-semibold">Cần hỗ trợ?</span>
        </button>
      )}

      {open && (
        <div
          className="anim-pop fixed z-50 flex flex-col overflow-hidden glass-panel
                     inset-0 rounded-none
                     sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[650px] sm:max-h-[88vh] sm:w-[400px] sm:rounded-3xl"
        >
          <ChatHeader
            escalated={escalated}
            humanMode={humanMode}
            language={language}
            onLanguage={setLanguage}
            onRate={requestRating}
            onClose={() => setOpen(false)}
            onCancelEscalation={cancelEscalation}
          />
          <MessageList messages={messages} />
          
          {/* Quick Replies for empty chat */}
          {showQuick && <QuickReplies onPick={handleSend} disabled={busy} />}
          
          {/* AI Suggested Follow-ups */}
          {!showQuick && followUps?.length > 0 && !busy && (
            <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-line bg-surface anim-fadeup">
              {followUps.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(text)}
                  disabled={busy}
                  className="rounded-full border border-brand-50 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          <ChatInput onSend={handleSend} disabled={busy} />
        </div>
      )}
    </>
  );
}
