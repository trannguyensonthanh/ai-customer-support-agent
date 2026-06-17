import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function CartDrawer() {
  const { cart, itemCount, subtotal, updateItem } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-brand"
        aria-label="Giỏ hàng"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-agent px-1 text-[11px] font-bold text-white">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-slidedown absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="border-b border-line px-4 py-3">
            <span className="font-display text-sm font-semibold text-ink">Giỏ hàng ({itemCount})</span>
          </div>
          <div className="max-h-72 overflow-y-auto scroll-soft">
            {(cart.items || []).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">Giỏ hàng trống</div>
            ) : (
              (cart.items || []).map((item) => (
                <div key={item.productId} className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <img
                    src={item.image || 'https://picsum.photos/seed/default/80/80'}
                    alt={item.name}
                    className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{item.name}</div>
                    <div className="text-xs text-brand-600 font-semibold">{formatVnd(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateItem(item.productId, item.qty - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-xs text-muted hover:bg-paper"
                    >−</button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateItem(item.productId, item.qty + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-xs text-muted hover:bg-paper"
                    >+</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {itemCount > 0 && (
            <div className="border-t border-line p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted">Tạm tính</span>
                <span className="text-sm font-semibold text-brand-600">{formatVnd(subtotal)}</span>
              </div>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="block w-full rounded-xl bg-brand py-2.5 text-center text-sm font-medium text-white transition hover:bg-brand-600"
              >
                Xem giỏ hàng
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
