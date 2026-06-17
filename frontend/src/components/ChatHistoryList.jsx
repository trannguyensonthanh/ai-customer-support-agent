import React from 'react';

export default function ChatHistoryList({ sessions, activeId, onSelect }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center bg-surface">
        <div className="mb-3 text-4xl opacity-50">📭</div>
        <div className="text-sm font-medium text-ink">Chưa có lịch sử trò chuyện</div>
        <div className="mt-1 text-xs text-ink/60">Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface p-3">
      <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-ink/50">
        Lịch sử trò chuyện
      </div>
      <div className="flex flex-col gap-2">
        {sessions.map((s) => {
          const isActive = s.id === activeId;
          const dateStr = new Date(s.updatedAt || Date.now()).toLocaleDateString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
          });

          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`flex flex-col items-start gap-1 rounded-xl p-3 text-left transition ${
                isActive 
                  ? 'bg-brand/10 border border-brand/20' 
                  : 'bg-white hover:bg-black/5 border border-transparent'
              }`}
            >
              <div className={`text-sm font-medium line-clamp-1 ${isActive ? 'text-brand' : 'text-ink'}`}>
                {s.title || 'Trò chuyện'}
              </div>
              <div className="text-[11px] text-ink/50">
                {dateStr}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
