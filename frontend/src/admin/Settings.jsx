import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';

export default function Settings() {
  const { auth } = useAuth();
  const api = adminApi(auth.token);
  const [settings, setSettings] = useState({
    provider: 'gemini',
    ollamaUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'qwen3:8b',
    ollamaEmbedModel: 'nomic-embed-text',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => setMessage('Lỗi khi tải cài đặt'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      setMessage('Lưu cài đặt thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Lỗi: ${err.message}`);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-5">Đang tải...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">Cài đặt AI Agent</h1>
        <p className="mt-1 text-sm text-muted">Cấu hình mô hình xử lý ngôn ngữ và embedding cho trợ lý ảo.</p>
      </div>

      <div className="max-w-2xl">
        {message && (
          <div className={`mb-6 rounded-xl p-4 text-sm font-medium ${message.includes('Lỗi') ? 'bg-danger-50 text-danger border border-danger/20' : 'bg-success-50 text-success border border-success/20'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">Nền tảng xử lý (Provider)</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${settings.provider === 'gemini' ? 'border-brand bg-brand-50' : 'border-line hover:bg-paper'}`}>
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={settings.provider === 'gemini'}
                  onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                  className="h-4 w-4 text-brand"
                />
                <div>
                  <div className="font-bold text-ink">Online (Gemini API)</div>
                  <div className="text-xs text-muted">Sử dụng Google Gemini (nhanh, thông minh)</div>
                </div>
              </label>

              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${settings.provider === 'ollama' ? 'border-brand bg-brand-50' : 'border-line hover:bg-paper'}`}>
                <input
                  type="radio"
                  name="provider"
                  value="ollama"
                  checked={settings.provider === 'ollama'}
                  onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                  className="h-4 w-4 text-brand"
                />
                <div>
                  <div className="font-bold text-ink">Offline (Local LLMs)</div>
                  <div className="text-xs text-muted">Chạy qua Ollama (không tốn token, bảo mật)</div>
                </div>
              </label>
            </div>
          </div>

          {settings.provider === 'ollama' && (
            <div className="space-y-4 rounded-xl bg-paper p-5 border border-line anim-slidedown">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Ollama API URL</label>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">LLM Model (Chat)</label>
                  <input
                    type="text"
                    value={settings.ollamaModel}
                    onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                    placeholder="qwen3:8b"
                    className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <p className="mt-1 text-xs text-muted">Khuyên dùng: qwen3:8b cho tiếng Việt</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Embedding Model</label>
                  <input
                    type="text"
                    value={settings.ollamaEmbedModel}
                    onChange={(e) => setSettings({ ...settings, ollamaEmbedModel: e.target.value })}
                    placeholder="nomic-embed-text"
                    className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-line pt-6">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
