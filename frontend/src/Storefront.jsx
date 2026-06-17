import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from './lib/customerApi.js';
import Header from './components/Header.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import { useCustomerAuth } from './contexts/CustomerAuthContext.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { customer } = useCustomerAuth();

  useEffect(() => {
    fetchProducts({ sort: 'best_selling' })
      .then((data) => setProducts(data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/50 via-surface to-surface pt-16 sm:pt-24 pb-12 sm:pb-20">
        {/* Abstract blur shapes */}
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-agent-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative mx-auto w-full max-w-5xl px-5 text-center anim-fadeup">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-agent animate-pulse" />
            <span className="text-ink">Trợ lý AI 3TStore đã sẵn sàng hỗ trợ bạn</span>
          </div>
          
          <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold leading-[1.1] text-ink sm:text-6xl tracking-tight">
            Mua sắm thông minh, <br />
            <span className="bg-gradient-to-r from-brand to-agent bg-clip-text text-transparent">
              Chăm sóc tận tình 24/7
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Chào mừng {customer ? customer.name.split(' ').pop() : 'bạn'} đến với 3TStore. 
            Khám phá các sản phẩm đỉnh cao và trải nghiệm dịch vụ chăm sóc khách hàng bằng AI thế hệ mới.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link 
              to="/products"
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-ink px-8 text-[15px] font-semibold text-surface transition hover:scale-105 hover:bg-brand hover:text-white sm:w-auto shadow-xl shadow-ink/10"
            >
              Khám phá sản phẩm
            </Link>
            <Link 
              to="/chat"
              className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-white px-8 text-[15px] font-semibold text-ink shadow-lg shadow-black/5 ring-1 ring-line transition hover:scale-105 sm:w-auto dark:bg-paper"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-agent/10 opacity-0 transition-opacity group-hover:opacity-100" />
              Chat với AI ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto w-full max-w-5xl px-5 py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { title: 'Tư vấn thông minh', desc: 'AI phân tích nhu cầu và gợi ý sản phẩm chuẩn xác nhất.', icon: '💡' },
            { title: 'Hỗ trợ 24/7', desc: 'Giải đáp mọi thắc mắc về đơn hàng mọi lúc, mọi nơi.', icon: '⚡' },
            { title: 'Kết nối liền mạch', desc: 'Dễ dàng chuyển sang nhân viên tư vấn thật khi cần thiết.', icon: '🤝' },
          ].map((f, i) => (
            <div key={i} className="rounded-3xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:shadow-xl shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-2xl shadow-sm ring-1 ring-line">
                {f.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16 flex-1">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink tracking-tight">Sản phẩm nổi bật</h2>
            <p className="mt-2 text-muted">Được chọn lọc và yêu thích nhất bởi khách hàng.</p>
          </div>
          <Link to="/products" className="hidden text-sm font-bold text-brand hover:underline sm:block">
            Xem tất cả bộ sưu tập →
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-[340px] rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {products.map((p) => {
              const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
              // Fallback to high-quality Unsplash image if no real image
              const imgSrc = p.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80`;
              
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
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-[13px] font-medium text-muted mb-1">{p.category || 'Công nghệ'}</div>
                    <div className="font-display text-base font-semibold leading-snug text-ink line-clamp-2 group-hover:text-brand transition-colors">{p.name}</div>
                    <div className="mt-auto pt-3 flex items-end gap-2">
                      <span className="text-[17px] font-bold text-brand">{formatVnd(p.price)}</span>
                      {discount > 0 && (
                        <span className="text-[13px] font-medium text-muted line-through">{formatVnd(p.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Link to="/products" className="mt-8 block text-center text-sm font-bold text-brand hover:underline sm:hidden">
          Xem tất cả bộ sưu tập →
        </Link>
      </section>

      <footer className="border-t border-line bg-paper py-10 text-center text-sm text-muted">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-agent text-white text-[10px] font-black">3T</div>
          <span className="font-display text-xl font-bold tracking-tight text-ink">3T<span className="text-brand">Store</span></span>
        </div>
        <p>© 2026 3TStore · AI-Powered E-Commerce Platform.</p>
        <p className="mt-1 text-xs">Tích hợp công nghệ AI Agent CSKH tiên tiến nhất.</p>
      </footer>

      <ChatWidget />
    </div>
  );
}
