import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../lib/customerApi.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import Header from '../components/Header.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function ProductList() {
  const { customer } = useCustomerAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('best_selling');
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => { fetchCategories().then(setCategories); }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts({ q: search, category, sort }).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, [search, category, sort]);

  const handleAdd = async (e, p) => {
    e.preventDefault(); // Prevent navigating to product detail
    if (!customer) return;
    const ok = await addItem(p.id, 1);
    if (ok) { setAddedId(p.id); setTimeout(() => setAddedId(null), 1200); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      
      {/* Page Header */}
      <div className="bg-paper border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-ink sm:text-5xl tracking-tight">
            Bộ Sưu Tập <span className="bg-gradient-to-r from-brand to-agent bg-clip-text text-transparent">Sản Phẩm</span>
          </h1>
          <p className="mt-4 text-muted max-w-xl mx-auto text-[15px]">
            Lựa chọn những thiết bị công nghệ hiện đại nhất với mức giá hấp dẫn cùng sự hỗ trợ thông minh từ AI Agent.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8 flex-1 w-full">
        {/* Filters */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row bg-paper p-4 rounded-3xl border border-line shadow-sm">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nhanh..."
              className="w-full rounded-2xl border-none bg-surface px-5 py-3.5 pl-12 text-[15px] text-ink outline-none ring-1 ring-line placeholder:text-muted focus:ring-2 focus:ring-brand transition-all shadow-inner"
            />
            <svg className="absolute left-4 top-4 h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <div className="flex w-full gap-3 sm:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-2xl border-none bg-surface px-4 py-3.5 text-[14px] font-medium text-ink outline-none ring-1 ring-line focus:ring-2 focus:ring-brand transition-all cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="flex-1 rounded-2xl border-none bg-surface px-4 py-3.5 text-[14px] font-medium text-ink outline-none ring-1 ring-line focus:ring-2 focus:ring-brand transition-all cursor-pointer"
            >
              <option value="best_selling">🔥 Bán chạy nhất</option>
              <option value="rating_desc">⭐ Đánh giá tốt nhất</option>
              <option value="newest">✨ Mới nhất</option>
              <option value="price_asc">💰 Giá tăng dần</option>
              <option value="price_desc">💎 Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-[360px] rounded-3xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="text-5xl mb-4">🛸</div>
            <h3 className="font-display text-xl font-bold text-ink">Không tìm thấy sản phẩm</h3>
            <p className="mt-2 text-muted">Thử thay đổi từ khóa hoặc danh mục xem sao nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
              const imgSrc = p.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80`;
              
              return (
                <Link
                  to={`/products/${p.id}`}
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-paper transition-all hover:border-brand-300 hover:shadow-2xl hover:shadow-brand/10 anim-fadeup"
                >
                  <div className="relative aspect-square overflow-hidden bg-surface">
                    <img 
                      src={imgSrc} 
                      alt={p.name} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {(p.tags || []).map((t) => (
                        <span key={t} className={`rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-md ${
                          t === 'bán chạy' ? 'bg-agent/90' : t === 'mới' ? 'bg-brand/90' : t === 'giảm giá' ? 'bg-flag/90' : 'bg-ink/80'
                        }`}>{t}</span>
                      ))}
                    </div>

                    {p.stock <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
                        <span className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-bold text-danger shadow-lg">HẾT HÀNG</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-[12px] font-medium text-muted mb-1 tracking-wider uppercase">{p.category}</div>
                    <div className="font-display text-[15px] font-semibold leading-snug text-ink line-clamp-2 group-hover:text-brand transition-colors">{p.name}</div>
                    
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-lg font-bold text-brand-600">{formatVnd(p.price)}</span>
                      {discount > 0 && (
                        <span className="text-[12px] font-medium text-muted line-through mb-0.5">{formatVnd(p.originalPrice)}</span>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-4">
                      {customer && p.stock > 0 ? (
                        <button
                          onClick={(e) => handleAdd(e, p)}
                          className={`w-full rounded-xl py-2.5 text-[13px] font-bold transition-all shadow-sm ${
                            addedId === p.id
                              ? 'bg-success text-white shadow-success/30'
                              : 'bg-brand-50 text-brand-600 hover:bg-brand hover:text-white hover:shadow-brand/30'
                          }`}
                        >
                          {addedId === p.id ? '✓ Đã Thêm Giỏ Hàng' : '+ Thêm Giỏ Hàng'}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between text-[12px] text-muted border-t border-line pt-3">
                          <span>Đã bán: <b>{p.sold || 0}</b></span>
                          <span className="flex items-center gap-1">
                            <span className="text-warning">★</span> {p.rating || '4.9'} <span className="opacity-50">({p.reviews || 0})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
