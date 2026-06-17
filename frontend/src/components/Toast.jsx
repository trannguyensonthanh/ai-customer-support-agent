import { useNotifications } from '../contexts/NotificationContext.jsx';

export default function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  const ICONS = {
    order: '📦',
    info: 'ℹ️',
    success: '✅',
    error: '❌',
  };

  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2" style={{ maxWidth: 360 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-enter flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-xl"
          onClick={() => removeToast(t.id)}
        >
          <span className="mt-0.5 text-lg">{ICONS[t.type] || ICONS.info}</span>
          <div className="flex-1 text-sm font-medium text-ink">{t.message}</div>
          <button className="ml-2 text-xs text-muted hover:text-ink">✕</button>
        </div>
      ))}
    </div>
  );
}
