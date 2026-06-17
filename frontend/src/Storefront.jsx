import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from './lib/customerApi.js';
import Header from './components/Header.jsx';
import { useCustomerAuth } from './contexts/CustomerAuthContext.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

const FEATURES = [
  {
    title: 'Tư vấn thông minh',
    desc: 'AI phân tích nhu cầu và gợi ý sản phẩm chuẩn xác nhất cho bạn.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21h6M10 17v4M14 17v4" strokeLinecap="round"/>
      </svg>
    ),
    gradient: 'from-brand/10 to-brand/5',
    iconBg: 'bg-brand/10 text-brand',
  },
  {
    title: 'Hỗ trợ 24/7',
    desc: 'Giải đáp mọi thắc mắc về đơn hàng, chính sách mọi lúc mọi nơi.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" strokeLinecap="round"/>
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    gradient: 'from-agent/10 to-agent/5',
    iconBg: 'bg-agent/10 text-agent',
  },
  {
    title: 'Kết nối liền mạch',
    desc: 'Dễ dàng chuyển sang nhân viên tư vấn thật khi cần thiết.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    gradient: 'from-accent/10 to-accent/5',
    iconBg: 'bg-accent/10 text-accent',
  },
];

const STATS = [
  { value: '10K+', label: 'Sản phẩm' },
  { value: '50K+', label: 'Khách hàng' },
  { value: '4.9★', label: 'Đánh giá' },
  { value: '24/7', label: 'Hỗ trợ AI' },
];

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { customer } = useCustomerAuth();

  useEffect(() => {
    fetchProducts({ sort: 'best_selling' })
      .then((data) => setProducts(data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header />

      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-32 sm:pb-36">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-gradient" />
        
        {/* Decorative orbs */}
        <div className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-brand/8 blur-[120px] pointer-events-none anim-float" />
        <div className="absolute -right-32 top-40 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[100px] pointer-events-none" style={{ animationDelay: '2s', animation: 'float 5s ease-in-out infinite' }} />
        <div className="absolute left-1/2 -bottom-20 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-agent/5 blur-[80px] pointer-events-none" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle, var(--color-ink) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative mx-auto w-full max-w-5xl px-5">
          {/* Announcement badge */}
          <div className="flex justify-center mb-8 anim-fadeup">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-brand/20 bg-brand-50/60 backdrop-blur-sm px-5 py-2.5 text-sm font-medium shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <span className="text-brand-600">AI Agent CSKH đã sẵn sàng phục vụ bạn</span>
            </div>
          </div>
          
          {/* Main heading */}
          <div className="text-center anim-fadeup" style={{ animationDelay: '80ms' }}>
            <h1 className="mx-auto max-w-4xl font-display text-[2.75rem] font-extrabold leading-[1.08] text-ink sm:text-[4rem] tracking-tight">
              Mua sắm thông minh,{' '}
              <span className="gradient-text">
                Chăm sóc tận tình 24/7
              </span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <p className="mx-auto mt-7 max-w-2xl text-center text-[1.05rem] leading-relaxed text-muted anim-fadeup" style={{ animationDelay: '160ms' }}>
            Chào mừng {customer ? <span className="font-semibold text-ink">{customer.name.split(' ').pop()}</span> : 'bạn'} đến với 3TStore. 
            Khám phá các sản phẩm đỉnh cao và trải nghiệm dịch vụ chăm sóc khách hàng bằng AI thế hệ mới.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row anim-fadeup" style={{ animationDelay: '240ms' }}>
            <Link 
              to="/products"
              className="btn-primary gap-2 w-full sm:w-auto"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Khám phá sản phẩm
            </Link>
            <Link 
              to="/chat"
              className="btn-ghost gap-2 w-full sm:w-auto group"
            >
              <svg className="h-5 w-5 text-brand transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Chat với AI ngay
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4 anim-fadeup" style={{ animationDelay: '320ms' }}>
            {STATS.map((s, i) => (
              <div key={i} className="text-center rounded-2xl border border-line/50 bg-surface/50 backdrop-blur-sm py-5 px-4 transition hover:border-brand/30 hover:bg-brand-50/30">
                <div className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-sm font-medium text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section className="relative py-20 sm:py-28 bg-surface border-y border-line/50">
        <div className="mx-auto w-full max-w-5xl px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-600 mb-5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Tính năng nổi bật
            </div>
            <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl tracking-tight">
              Trải nghiệm mua sắm <span className="gradient-text">thế hệ mới</span>
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">
              Được trang bị công nghệ AI tiên tiến nhất, giúp bạn tiết kiệm thời gian và nâng cao trải nghiệm.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 stagger-children">
            {FEATURES.map((f, i) => (
              <div key={i} className={`group relative rounded-3xl border border-line/60 bg-gradient-to-br ${f.gradient} p-7 transition card-hover overflow-hidden`}>
                {/* Hover glow */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/5 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className={`relative mb-5 flex h-13 w-13 items-center justify-center rounded-2xl ${f.iconBg} ring-1 ring-black/5 transition group-hover:scale-110`}>
                  {f.icon}
                </div>
                <h3 className="relative font-display text-lg font-bold text-ink">{f.title}</h3>
                <p className="relative mt-2.5 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRODUCT GRID SECTION ========== */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:py-28 flex-1">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-agent-50 px-4 py-1.5 text-sm font-semibold text-agent-600 mb-4">
              🔥 Hot Products
            </div>
            <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl tracking-tight">Sản phẩm nổi bật</h2>
            <p className="mt-3 text-muted">Được chọn lọc và yêu thích nhất bởi cộng đồng khách hàng.</p>
          </div>
          <Link to="/products" className="hidden text-sm font-bold text-brand hover:text-brand-600 transition sm:flex items-center gap-1.5 group">
            Xem tất cả 
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton h-[360px] rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 stagger-children">
            {products.map((p) => {
              const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
              const imgSrc = p.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80`;
              
              return (
                <Link
                  to={`/products/${p.id}`}
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-line/60 bg-surface transition-all card-hover"
                >
                  <div className="relative aspect-square overflow-hidden bg-paper">
                    <img 
                      src={imgSrc} 
                      alt={p.name} 
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    
                    {/* Tags */}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {(p.tags || []).map((t) => (
                        <span key={t} className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm ${
                          t === 'bán chạy' ? 'bg-agent/90' : t === 'mới' ? 'bg-brand/90' : t === 'giảm giá' ? 'bg-flag/90' : 'bg-ink/70'
                        }`}>{t}</span>
                      ))}
                    </div>

                    {/* Discount badge */}
                    {discount > 0 && (
                      <div className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger font-bold text-[11px] text-white shadow-lg">
                        -{discount}%
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="text-[11px] font-semibold text-muted mb-1.5 tracking-wider uppercase">{p.category || 'Công nghệ'}</div>
                    <div className="font-display text-[14px] font-semibold leading-snug text-ink line-clamp-2 group-hover:text-brand transition-colors duration-300">{p.name}</div>
                    <div className="mt-auto pt-3 flex items-baseline gap-2">
                      <span className="text-[17px] font-extrabold text-brand">{formatVnd(p.price)}</span>
                      {p.originalPrice && (
                        <span className="text-[12px] font-medium text-muted line-through">{formatVnd(p.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        <div className="mt-10 text-center sm:hidden">
          <Link to="/products" className="btn-primary w-full">
            Xem tất cả sản phẩm
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="relative border-t border-line bg-surface overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="relative mx-auto max-w-5xl px-5 py-16">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white text-sm font-black shadow-lg shadow-brand/20 anim-glow">3T</div>
              <span className="font-display text-2xl font-bold tracking-tight text-ink">3T<span className="text-brand">Store</span></span>
            </div>
            <p className="text-sm text-muted max-w-md">
              Nền tảng thương mại điện tử thế hệ mới tích hợp công nghệ AI Agent CSKH tiên tiến nhất.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link to="/products" className="hover:text-brand transition">Sản phẩm</Link>
              <Link to="/chat" className="hover:text-brand transition">Chat AI</Link>
              <Link to="/login" className="hover:text-brand transition">Đăng nhập</Link>
            </div>
            <div className="border-t border-line/50 pt-6 w-full mt-2">
              <p className="text-xs text-muted">© 2026 3TStore · AI-Powered E-Commerce Platform · All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
