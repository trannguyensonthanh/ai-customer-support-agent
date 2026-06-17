import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';

const STATUS = {
  open: { label: 'Đang mở', cls: 'bg-flag-50 text-flag' },
  in_progress: { label: 'Đang xử lý', cls: 'bg-brand-50 text-brand-600' },
  resolved: { label: 'Đã xử lý', cls: 'bg-green-100 text-green-700' },
};
const NEXT = { open: 'in_progress', in_progress: 'resolved', resolved: 'open' };

export default function Tickets() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const api = adminApi(auth.token);
  const [tickets, setTickets] = useState([]);

  const load = () =>
    api.getTickets().then(setTickets).catch((e) => {
      if (e.message === 'UNAUTHORIZED') {
        logout();
        navigate('/admin/login');
      }
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = async (t) => {
    await api.updateTicket(t.id, NEXT[t.status] || 'open');
    await load();
  };

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Ticket hỗ trợ</h1>
      <p className="mb-6 text-sm text-muted">Các yêu cầu được AI chuyển cho nhân viên</p>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {tickets.map((t, i) => {
          const st = STATUS[t.status] || STATUS.open;
          return (
            <div key={t.id} className={`flex items-start gap-4 px-5 py-4 ${i > 0 ? 'border-t border-line' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                  <span className="text-xs text-muted">
                    {new Date(t.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium text-ink">{t.reason}</div>
                {t.summary && <div className="mt-0.5 text-sm text-muted">{t.summary}</div>}
              </div>
              <button
                onClick={() => advance(t)}
                className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:bg-paper"
              >
                Chuyển trạng thái
              </button>
            </div>
          );
        })}
        {tickets.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted">Chưa có ticket nào.</div>
        )}
      </div>
    </div>
  );
}
