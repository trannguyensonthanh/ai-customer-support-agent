import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct, fetchProductReviews, fetchProducts } from '../lib/customerApi.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import Header from '../components/Header.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function ProductDetail() {
  const { id } = useParams();
  const { customer } = useCustomerAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProduct(id).catch(() => null),
      fetchProductReviews(id).catch(() => []),
      fetchProducts().catch(() => [])
    ]).then(([prodData, reviewsData, allProducts]) => {
      setProduct(prodData);
      setReviews(reviewsData);
      if (prodData && allProducts) {
        const relatedProds = allProducts.filter(p => p.category === prodData.category && p.id !== prodData.id).slice(0, 4);
        setRelated(relatedProds);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!customer) return;
    const ok = await addItem(product.id, qty);
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 1500); }
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col bg-surface"><Header />
      <div className="mx-auto max-w-6xl px-5 py-12 w-full">
        <div className="grid gap-12 sm:grid-cols-2">
          <div className="skeleton aspect-square sm:aspect-[4/5] rounded-3xl" />
          <div className="space-y-6 pt-6">
            <div className="skeleton h-10 w-3/4 rounded-xl" />
            <div className="skeleton h-6 w-1/4 rounded-lg" />
            <div className="skeleton h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="flex min-h-screen flex-col bg-surface"><Header />
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h2 className="font-display text-2xl font-bold text-ink">Không tìm thấy sản phẩm</h2>
        <p className="text-muted mt-2">Sản phẩm này có thể đã bị xóa hoặc không tồn tại.</p>
        <Link to="/products" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-600">
          ← Quay lại danh sách
        </Link>
      </div>
    </div>
  );

  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const imgSrc = product.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80`;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-12 flex-1">
        
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-[13px] font-medium text-muted">
          <Link to="/" className="hover:text-brand transition">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand transition">Sản phẩm</Link>
          <span>/</span>
          <span className="text-ink">{product.category}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Image Section */}
          <div className="group relative overflow-hidden rounded-3xl border border-line bg-paper shadow-sm">
            <div className="aspect-square sm:aspect-[4/5] w-full">
              <img 
                src={imgSrc} 
                alt={product.name} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            </div>
            {/* Overlay Tags */}
            <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
              {(product.tags || []).map((t) => (
                <span key={t} className={`rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-md ${
                  t === 'bán chạy' ? 'bg-agent/90' : t === 'mới' ? 'bg-brand/90' : t === 'giảm giá' ? 'bg-flag/90' : 'bg-ink/80'
                }`}>{t}</span>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col py-4">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-muted mb-6">
              <span>Mã: <strong className="text-ink">{product.code}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-warning">★</span>
                <strong className="text-ink">{product.rating || '4.9'}</strong> ({product.reviews || 0} đánh giá)
              </span>
              <span>•</span>
              <span>Đã bán <strong className="text-ink">{product.sold || 0}</strong></span>
            </div>

            <div className="mb-8 flex items-end gap-4 rounded-2xl bg-paper p-5 border border-line shadow-sm">
              <span className="text-4xl font-extrabold text-brand tracking-tight">{formatVnd(product.price)}</span>
              {product.originalPrice && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-agent uppercase tracking-wider mb-1">Tiết kiệm {discount}%</span>
                  <span className="text-lg text-muted line-through font-medium">{formatVnd(product.originalPrice)}</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">Mô tả sản phẩm</h3>
              <p className="text-[15px] leading-relaxed text-muted whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {product.specs && (
              <div className="mb-8 rounded-2xl bg-paper border border-line p-5 shadow-sm">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">Thông số kỹ thuật</h3>
                <div className="text-[14px] leading-loose text-muted whitespace-pre-wrap">
                  {product.specs}
                </div>
              </div>
            )}

            <div className="mt-auto border-t border-line pt-8">
              <div className="mb-4 flex items-center justify-between">
                <span className={`text-sm font-bold uppercase tracking-wider ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                  {product.stock > 0 ? `Tình trạng: Còn ${product.stock} sản phẩm` : 'Tình trạng: Hết hàng'}
                </span>
              </div>

              {customer ? (
                product.stock > 0 ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex h-14 w-full sm:w-36 items-center justify-between overflow-hidden rounded-2xl border border-line bg-paper px-2 shadow-sm">
                      <button 
                        onClick={() => setQty(Math.max(1, qty - 1))} 
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-muted hover:bg-surface hover:text-ink transition"
                      >−</button>
                      <span className="w-8 text-center text-[15px] font-bold text-ink">{qty}</span>
                      <button 
                        onClick={() => setQty(Math.min(product.stock, qty + 1))} 
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-muted hover:bg-surface hover:text-ink transition"
                      >+</button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAdd}
                      className={`relative flex h-14 flex-1 items-center justify-center rounded-2xl text-[15px] font-bold transition-all shadow-lg overflow-hidden ${
                        added 
                          ? 'bg-success text-white shadow-success/30' 
                          : 'bg-brand text-white hover:bg-brand-600 hover:shadow-brand/30 hover:-translate-y-0.5'
                      }`}
                    >
                      {added ? (
                        <span className="flex items-center gap-2 anim-fadeup">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          Đã thêm vào giỏ hàng
                        </span>
                      ) : (
                        <span>Thêm vào giỏ hàng</span>
                      )}
                    </button>
                  </div>
                ) : (
                  <button disabled className="h-14 w-full rounded-2xl bg-surface border border-line text-[15px] font-bold text-muted cursor-not-allowed">
                    Sản phẩm tạm hết hàng
                  </button>
                )
              ) : (
                <Link 
                  to="/login" 
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-ink text-[15px] font-bold text-surface shadow-lg shadow-ink/10 transition hover:bg-brand hover:-translate-y-0.5"
                >
                  Đăng nhập để mua hàng
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-line pt-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-8">Khách hàng nhận xét</h2>
          <div className="grid gap-8 sm:grid-cols-[300px_1fr]">
            {/* Rating Summary */}
            <div className="rounded-3xl bg-paper border border-line p-8 text-center flex flex-col items-center justify-center">
              <div className="text-6xl font-display font-extrabold text-ink mb-2">{product.rating || '4.9'}</div>
              <div className="flex gap-1 text-warning text-xl mb-3">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <div className="text-muted text-[15px]">{product.reviews || 0} lượt đánh giá</div>
            </div>
            
            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-3xl border border-line text-muted">
                  Chưa có nhận xét nào cho sản phẩm này.
                </div>
              ) : reviews.map((r) => (
                <div key={r.id} className="rounded-3xl bg-surface border border-line p-6 anim-fadeup">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                        {r.customerName ? r.customerName.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <div className="font-bold text-ink text-[14px]">
                          {r.customerName || 'Khách hàng ẩn danh'}
                        </div>
                        <div className="text-[12px] text-muted">
                          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className="flex text-warning text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[14px] text-muted leading-relaxed">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-line pt-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-8">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {related.map(p => (
                <Link key={p.id} to={`/products/${p.id}`} className="group flex flex-col items-start gap-4">
                  <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-paper">
                    <img 
                      src={p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'} 
                      alt={p.name} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-ink group-hover:text-brand line-clamp-2">{p.name}</h3>
                    <p className="mt-1 font-bold text-brand">{formatVnd(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
