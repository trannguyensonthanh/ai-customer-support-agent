import { Link, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) return <Navigate to="/products" replace />;

  return (
    <div className="min-h-screen"><Header />
      <div className="mx-auto max-w-lg px-5 py-12 text-center">
        <div className="anim-pop inline-flex h-20 w-20 items-center justify-center rounded-full bg-success-50 text-success text-4xl mb-6">✓</div>
        <h1 className="font-display text-2xl font-bold text-ink">Đặt hàng thành công!</h1>
        <p className="mt-2 text-sm text-muted">Cảm ơn bạn đã mua sắm tại ShopViệt</p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display font-semibold text-ink">Mã đơn: {order.code}</span>
            <span className="rounded-full bg-flag-50 px-3 py-1 text-xs font-medium text-flag">{order.status}</span>
          </div>
          <div className="space-y-2 text-sm border-b border-line pb-3 mb-3">
            {(order.items || []).map((i, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-muted">{i.name} ×{i.qty}</span>
                <span className="text-ink">{formatVnd(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted">Thanh toán</span><span>{order.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-muted">Dự kiến giao</span><span>{order.estimatedDelivery}</span></div>
            <div className="flex justify-between font-semibold mt-2"><span>Tổng cộng</span><span className="text-brand">{formatVnd(order.total)}</span></div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/orders" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600">
            Theo dõi đơn hàng
          </Link>
          <Link to="/products" className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink transition hover:bg-paper">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
