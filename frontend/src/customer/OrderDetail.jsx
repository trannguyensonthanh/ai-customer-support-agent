import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getMyOrder, cancelMyOrder } from '../lib/customerApi.js';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import Header from '../components/Header.jsx';
import { CheckIcon } from '../components/icons.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function OrderDetail() {
  const { code } = useParams();
  const { customer } = useCustomerAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!customer) return <Navigate to="/login" replace />;

  useEffect(() => {
    setLoading(true);
    getMyOrder(code).then(setOrder).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [code]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleCancel = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận hủy đơn hàng',
      message: `Bạn có chắc chắn muốn hủy đơn hàng ${code}? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await cancelMyOrder(code, 'Khách tự hủy');
          setOrder((prev) => prev ? { ...prev, status: 'Đã hủy' } : prev);
        } catch (e) { alert(e.message); }
      }
    });
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col bg-surface"><Header />
      <div className="mx-auto max-w-4xl px-5 py-12 w-full"><div className="skeleton h-[500px] rounded-3xl" /></div>
    </div>
  );

  if (!order) return (
    <div className="flex min-h-screen flex-col bg-surface"><Header />
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="text-6xl mb-6">📦</div>
        <h2 className="font-display text-2xl font-bold text-ink">Không tìm thấy đơn hàng</h2>
        <p className="text-muted mt-2">Mã đơn hàng không hợp lệ hoặc đã bị xóa.</p>
        <Link to="/orders" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-600">
          ← Quay lại danh sách
        </Link>
      </div>
    </div>
  );

  const cancellable = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'].includes(order.status);

  // Status color logic for header badge
  let badgeColor = 'bg-line text-muted';
  if (order.status === 'Đã giao') badgeColor = 'bg-success/10 text-success ring-1 ring-success/20';
  else if (order.status === 'Đang giao') badgeColor = 'bg-brand/10 text-brand ring-1 ring-brand/20';
  else if (order.status === 'Đang chuẩn bị') badgeColor = 'bg-agent/10 text-agent ring-1 ring-agent/20';
  else if (order.status === 'Chờ xác nhận') badgeColor = 'bg-warning/10 text-warning ring-1 ring-warning/20';
  else if (order.status === 'Đã hủy') badgeColor = 'bg-danger/10 text-danger ring-1 ring-danger/20';

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={true}
        confirmText="Hủy đơn hàng"
      />
      <div className="mx-auto w-full max-w-4xl px-5 py-8 flex-1">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-[13px] font-medium text-muted">
          <Link to="/" className="hover:text-brand transition">Trang chủ</Link>
          <span>/</span>
          <Link to="/orders" className="hover:text-brand transition">Đơn hàng của tôi</Link>
          <span>/</span>
          <span className="text-ink font-semibold">{order.code}</span>
        </nav>

        {/* Header Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight">Chi tiết đơn hàng</h1>
            <p className="mt-2 text-muted">Mã đơn: <strong className="text-ink">{order.code}</strong></p>
          </div>
          {cancellable && (
            <button
              onClick={handleCancel}
              className="inline-flex rounded-xl border border-danger/20 bg-danger/5 px-6 py-3 text-[14px] font-bold text-danger transition hover:bg-danger/10 hover:border-danger/30 w-full sm:w-auto justify-center"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main Content (Left Col) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Timeline Card */}
            {order.timeline?.length > 0 && (
              <div className="rounded-3xl border border-line bg-paper shadow-sm overflow-hidden">
                <div className="border-b border-line px-6 py-4 bg-surface/50 flex justify-between items-center">
                  <h3 className="font-display text-lg font-bold text-ink">Tiến trình đơn hàng</h3>
                  <span className={`rounded-xl px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase ${badgeColor}`}>
                    {order.status}
                  </span>
                </div>
                <div className="px-6 py-6">
                  <ol className="relative space-y-6">
                    {order.timeline.map((s, i) => {
                      const isLast = i === order.timeline.length - 1;
                      // active check if it's the last done step (and not all done) - simple heuristic
                      const isActive = s.done && order.timeline[i + 1] && !order.timeline[i + 1].done;

                      return (
                        <li key={i} className="relative flex gap-5">
                          {!isLast && (
                            <span className={`absolute left-[11px] top-7 h-full w-[2px] ${s.done ? 'bg-brand/50' : 'bg-line dashed'}`} />
                          )}
                          <span className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all ${s.done
                            ? isActive ? 'bg-brand text-white shadow-[0_0_0_4px_rgba(var(--color-brand),0.2)]' : 'bg-brand text-white'
                            : 'border-2 border-line bg-surface'
                            }`}>
                            {s.done && <CheckIcon className="h-3.5 w-3.5" />}
                          </span>
                          <div className="flex-1">
                            <div className={`text-[15px] ${s.done ? 'font-bold text-ink' : 'font-medium text-muted'}`}>{s.step}</div>
                            {s.at && <div className="text-[13px] text-muted mt-0.5">{s.at}</div>}
                            {s.note && <div className="mt-1.5 rounded-lg bg-surface px-3 py-2 text-[13px] text-brand-600 border border-brand-100">{s.note}</div>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            )}

            {/* Items Card */}
            <div className="rounded-3xl border border-line bg-paper shadow-sm overflow-hidden">
              <div className="border-b border-line px-6 py-4 bg-surface/50">
                <h3 className="font-display text-lg font-bold text-ink">Sản phẩm đã mua</h3>
              </div>
              <div className="p-6 space-y-4">
                {(order.items || []).map((it, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b border-line/50 last:border-0 last:pb-0">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-surface">
                      <img src={it.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80`} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center min-w-0">
                      <div className="text-[15px] font-bold text-ink line-clamp-2 leading-snug">{it.name}</div>
                      <div className="mt-1 text-[13px] font-medium text-muted">Số lượng: x{it.qty}</div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <div className="text-[16px] font-bold text-ink">{formatVnd(it.price)}</div>
                      {it.qty > 1 && <div className="text-[12px] font-medium text-brand mt-1">= {formatVnd(it.price * it.qty)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar (Right Col) */}
          <div className="space-y-6">

            {/* Payment Summary */}
            <div className="rounded-3xl border border-line bg-paper shadow-sm overflow-hidden">
              <div className="border-b border-line px-5 py-4 bg-surface/50">
                <h3 className="font-display text-lg font-bold text-ink">Thanh toán</h3>
              </div>
              <div className="p-5 space-y-3 text-[14px]">
                <div className="flex justify-between items-center text-muted">
                  <span>Tạm tính</span>
                  <span className="font-medium text-ink">{formatVnd(order.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-muted">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-ink">{order.shippingFee === 0 ? 'Miễn phí' : formatVnd(order.shippingFee)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-success font-medium">
                    <span>Giảm giá</span>
                    <span>-{formatVnd(order.discount)}</span>
                  </div>
                )}

                <div className="my-4 border-t border-line border-dashed" />

                <div className="flex justify-between items-end">
                  <span className="font-bold text-ink">Tổng cộng</span>
                  <div className="text-right">
                    <span className="block text-2xl font-extrabold text-brand tracking-tight">{formatVnd(order.total)}</span>
                    <span className="block text-[11px] text-muted uppercase mt-1">Đã bao gồm VAT</span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-surface px-4 py-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">💳</div>
                  <div>
                    <div className="text-[12px] text-muted">Phương thức</div>
                    <div className="font-semibold text-[13px] text-ink">{order.paymentMethod}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="rounded-3xl border border-line bg-paper shadow-sm overflow-hidden">
              <div className="border-b border-line px-5 py-4 bg-surface/50">
                <h3 className="font-display text-lg font-bold text-ink">Thông tin nhận hàng</h3>
              </div>
              <div className="p-5 space-y-4 text-[14px]">
                <div>
                  <div className="text-[12px] text-muted mb-1">Người nhận</div>
                  <div className="font-bold text-ink">{order.customerName}</div>
                </div>
                <div>
                  <div className="text-[12px] text-muted mb-1">Số điện thoại</div>
                  <div className="font-medium text-ink">{order.phone || 'Chưa cập nhật'}</div>
                </div>
                <div>
                  <div className="text-[12px] text-muted mb-1">Địa chỉ giao hàng</div>
                  <div className="font-medium text-ink leading-relaxed">{order.address}</div>
                </div>
                {order.estimatedDelivery && (
                  <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 flex gap-3">
                    <span className="text-xl">🚚</span>
                    <div>
                      <div className="text-[12px] text-brand-600 font-medium">Dự kiến giao hàng</div>
                      <div className="font-bold text-brand-700">{order.estimatedDelivery}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
