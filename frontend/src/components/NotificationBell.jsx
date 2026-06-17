import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext.jsx';

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-brand"
        aria-label="Thông báo"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-agent px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-slidedown absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-display text-sm font-semibold text-ink">Thông báo</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-brand hover:underline">
                Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scroll-soft">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">Chưa có thông báo</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read) markRead(n.id); }}
                  className={`border-b border-line px-4 py-3 transition hover:bg-paper cursor-pointer ${!n.read ? 'bg-brand-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm">{n.type === 'order' ? '📦' : '🔔'}</span>
                    <div className="flex-1">
                      <div className={`text-sm ${!n.read ? 'font-semibold text-ink' : 'text-ink'}`}>{n.title}</div>
                      <div className="mt-0.5 text-xs text-muted line-clamp-2">{n.message}</div>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
