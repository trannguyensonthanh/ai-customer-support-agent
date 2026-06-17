import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import Header from '../components/Header.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function CartPage() {
  const { cart, itemCount, subtotal, updateItem, clear } = useCart();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  if (itemCount === 0) return (
    <div className="min-h-screen"><Header />
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="font-display text-xl font-bold text-ink">Giỏ hàng trống</h2>
        <p className="mt-2 text-sm text-muted">Hãy khám phá sản phẩm tuyệt vời tại ShopViệt!</p>
        <Link to="/products" className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600">
          Mua sắm ngay
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen"><Header />
      <div className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Giỏ hàng ({itemCount})</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-3 lg:col-span-2">
            {(cart.items || []).map((item) => (
              <div key={item.productId} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 anim-fadeup">
                <img src={item.image || 'https://picsum.photos/seed/default/120/120'} alt={item.name}
                  className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink truncate">{item.name}</div>
                  <div className="mt-0.5 text-sm font-bold text-brand-600">{formatVnd(item.price)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateItem(item.productId, item.qty - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:bg-paper transition">−</button>
                  <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                  <button onClick={() => updateItem(item.productId, item.qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:bg-paper transition">+</button>
                </div>
                <div className="w-24 text-right font-semibold text-ink">{formatVnd(item.price * item.qty)}</div>
              </div>
            ))}
            <button onClick={clear} className="text-xs text-agent-600 hover:underline">Xóa tất cả</button>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-line bg-surface p-5 h-fit lg:sticky lg:top-20">
            <h3 className="font-display font-semibold text-ink">Tóm tắt đơn</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="text-ink">{formatVnd(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Phí vận chuyển</span>
                <span className={shippingFee === 0 ? 'text-success font-medium' : 'text-ink'}>{shippingFee === 0 ? 'Miễn phí' : formatVnd(shippingFee)}</span>
              </div>
              {subtotal < 500000 && <div className="text-xs text-muted">Mua thêm {formatVnd(500000 - subtotal)} để được miễn phí ship</div>}
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4">
              <span className="font-semibold text-ink">Tổng cộng</span>
              <span className="text-lg font-bold text-brand">{formatVnd(subtotal + shippingFee)}</span>
            </div>
            <Link to="/checkout" className="mt-4 block w-full rounded-xl bg-brand py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-600">
              Đặt hàng
            </Link>
            <Link to="/products" className="mt-2 block text-center text-xs text-muted hover:text-brand transition">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
