import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';

function StatCard({ label, value, suffix, tone = 'brand' }) {
  const toneCls = {
    brand: 'text-brand-600',
    agent: 'text-agent-600',
    flag: 'text-flag',
    ink: 'text-ink',
  }[tone];
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${toneCls}`}>
        {value}
        {suffix && <span className="text-lg">{suffix}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const api = adminApi(auth.token);

  useEffect(() => {
    api
      .getAnalytics()
      .then(setData)
      .catch((e) => {
        if (e.message === 'UNAUTHORIZED') {
          logout();
          navigate('/admin/login');
        } else setError(e.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="p-8 text-agent-600">{error}</div>;
  if (!data) return <div className="p-8 text-muted">Đang tải số liệu…</div>;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Tổng quan</h1>
      <p className="mb-6 text-sm text-muted">Hiệu quả hoạt động của AI Agent CSKH</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tổng hội thoại" value={data.totalConversations} tone="ink" />
        <StatCard label="AI tự giải quyết" value={data.resolutionRate} suffix="%" tone="brand" />
        <StatCard label="Tỷ lệ chuyển NV" value={data.escalationRate} suffix="%" tone="agent" />
        <StatCard
          label={`Hài lòng (CSAT · ${data.csatCount})`}
          value={data.csatAvg || '–'}
          suffix={data.csatAvg ? '/5' : ''}
          tone="flag"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2">
          <div className="mb-4 font-display text-sm font-semibold text-ink">
            Lưu lượng hội thoại 7 ngày
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.volumeByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECE8DF" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7686' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7686' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#E8F1EF' }} contentStyle={{ borderRadius: 12, border: '1px solid #ECE8DF', fontSize: 13 }} />
                <Bar dataKey="count" name="Hội thoại" fill="#2F6F6A" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 font-display text-sm font-semibold text-ink">Câu hỏi hàng đầu</div>
          {data.topQuestions.length === 0 ? (
            <div className="text-sm text-muted">Chưa có dữ liệu. Hãy thử hỏi vài câu ở widget khách.</div>
          ) : (
            <ol className="space-y-3">
              {data.topQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-ink">{q.question}</span>
                  <span className="text-xs text-muted">{q.hits} lượt</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-5 rounded-xl bg-paper p-3 text-xs text-muted">
            Ticket đang mở: <span className="font-semibold text-ink">{data.openTickets}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
