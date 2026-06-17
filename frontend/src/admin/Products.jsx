import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function Products() {
  const { auth } = useAuth();
  const api = adminApi(auth.token);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', category: 'Điện tử', price: '', originalPrice: '', description: '', image: '', stock: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await api.getProducts()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ name: '', code: '', category: 'Điện tử', price: '', originalPrice: '', description: '', image: '', stock: '50', tags: '' });
    setError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, code: p.code, category: p.category, price: String(p.price),
      originalPrice: String(p.originalPrice || ''), description: p.description || '',
      image: p.image || '', stock: String(p.stock), tags: (p.tags || []).join(', '),
    });
    setError('');
    setModal({ mode: 'edit', product: p });
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, code: form.code, category: form.category,
        price: Number(form.price), originalPrice: Number(form.originalPrice || form.price),
        description: form.description, image: form.image, stock: Number(form.stock),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (modal.mode === 'create') await api.createProduct(payload);
      else await api.updateProduct(modal.product.id, payload);
      setModal(null);
      load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = (p) => {
    setConfirm({
      title: 'Xóa sản phẩm',
      message: `Xóa sản phẩm "${p.name}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => { try { await api.deleteProduct(p.id); load(); } catch {} setConfirm(null); },
    });
  };

  const categories = ['Tất cả', ...new Set(products.map(p => p.category))];
  const [catFilter, setCatFilter] = useState('Tất cả');
  const filtered = products.filter(p => {
    if (catFilter !== 'Tất cả' && p.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Quản lý sản phẩm</h1>
          <p className="text-sm text-muted mt-1">{products.length} sản phẩm</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
          + Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã..."
          className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand w-full sm:w-72" />
        <div className="flex gap-1 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${catFilter === c ? 'bg-brand text-white' : 'bg-paper text-muted border border-line hover:text-ink'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-48 rounded-2xl"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="rounded-2xl border border-line bg-surface p-4 hover:shadow-lg transition group">
              <div className="flex gap-3 mb-3">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-16 w-16 rounded-xl object-cover bg-paper"/>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-paper flex items-center justify-center text-2xl">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink text-sm leading-tight line-clamp-2">{p.name}</div>
                  <div className="text-xs text-muted mt-1">{p.code} · {p.category}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-brand">{formatVnd(p.price)}</span>
                  <span className="ml-2 text-xs text-muted">Kho: {p.stock}</span>
                  {Number(p.rating || 0) > 0 && <span className="ml-2 text-xs text-flag">⭐ {Number(p.rating).toFixed(1)}</span>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(p)} className="text-xs font-semibold text-brand hover:underline">Sửa</button>
                  <button onClick={() => handleDelete(p)} className="text-xs font-semibold text-danger hover:underline">Xóa</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted">Không tìm thấy sản phẩm nào.</div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm anim-fadeup">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-surface border border-line p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-ink mb-4">
              {modal.mode === 'create' ? 'Thêm sản phẩm mới' : 'Sửa sản phẩm'}
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Tên sản phẩm *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Mã SP</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Danh mục</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand">
                  {['Điện tử', 'Gia dụng', 'Thời trang', 'Phụ kiện', 'Làm đẹp', 'Khác'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Giá bán *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Giá gốc</label>
                  <input type="number" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Tồn kho</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Mô tả</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand resize-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">URL hình ảnh</label>
                <input value={form.image} onChange={e => setForm({...form, image: e.target.value})}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Tags <span className="text-muted font-normal">(phân cách bởi dấu phẩy)</span></label>
                <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="bán chạy, mới, giảm giá"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
              </div>
              {error && <div className="text-sm text-danger bg-danger-50 rounded-xl px-3 py-2">{error}</div>}
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted hover:bg-paper">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
