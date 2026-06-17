import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';

const EMPTY = { id: null, category: '', question: '', answer: '' };

export default function Faqs() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const api = adminApi(auth.token);
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(null); // null = an form
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.getFaqs().then(setFaqs).catch((e) => {
      if (e.message === 'UNAUTHORIZED') {
        logout();
        navigate('/admin/login');
      }
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      if (form.id) await api.updateFaq(form.id, form);
      else await api.createFaq(form);
      setForm(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Xóa FAQ này?')) return;
    await api.deleteFaq(id);
    await load();
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Quản lý FAQ</h1>
          <p className="text-sm text-muted">Sửa nội dung là AI tự học lại (embedding cập nhật)</p>
        </div>
        <button
          onClick={() => setForm({ ...EMPTY })}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          + Thêm FAQ
        </button>
      </div>

      {form && (
        <div className="anim-slidedown mb-5 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 font-display text-sm font-semibold text-ink">
            {form.id ? 'Sửa FAQ' : 'Thêm FAQ mới'}
          </div>
          <div className="grid gap-3">
            <input
              placeholder="Danh mục (vd Vận chuyển)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              placeholder="Câu hỏi"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              className="rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <textarea
              placeholder="Câu trả lời"
              rows={3}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              className="resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-xl border border-line px-4 py-2 text-sm text-muted hover:bg-paper"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {faqs.map((f, i) => (
          <div
            key={f.id}
            className={`flex items-start gap-4 px-5 py-4 ${i > 0 ? 'border-t border-line' : ''}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                  {f.category}
                </span>
                <span className="text-xs text-muted">{f.hits} lượt hỏi</span>
              </div>
              <div className="mt-1 text-sm font-medium text-ink">{f.question}</div>
              <div className="mt-0.5 text-sm text-muted">{f.answer}</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setForm({ id: f.id, category: f.category, question: f.question, answer: f.answer })}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:bg-paper"
              >
                Sửa
              </button>
              <button
                onClick={() => remove(f.id)}
                className="rounded-lg border border-agent-50 px-3 py-1.5 text-xs text-agent-600 hover:bg-agent-50"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">Chưa có FAQ.</div>}
      </div>
    </div>
  );
}
