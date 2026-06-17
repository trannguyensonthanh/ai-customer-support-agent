import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getMyOrders, cancelMyOrder } from '../lib/customerApi.js';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import Header from '../components/Header.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

const STATUS_STYLE = {
  'Đã giao': 'bg-success/10 text-success ring-1 ring-success/20',
  'Đang giao': 'bg-brand/10 text-brand ring-1 ring-brand/20',
  'Đang chuẩn bị': 'bg-agent/10 text-agent ring-1 ring-agent/20',
  'Chờ xác nhận': 'bg-warning/10 text-warning ring-1 ring-warning/20',
  'Đã xác nhận': 'bg-brand/10 text-brand ring-1 ring-brand/20',
  'Đã hủy': 'bg-danger/10 text-danger ring-1 ring-danger/20',
};

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Chờ xác nhận', label: 'Chờ xác nhận' },
  { value: 'Đang giao', label: 'Đang giao' },
  { value: 'Đã giao', label: 'Hoàn thành' },
  { value: 'Đã hủy', label: 'Đã hủy' },
];

export default function MyOrders() {
  const { customer } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  if (!customer) return <Navigate to="/login" replace />;

  useEffect(() => {
    setLoading(true);
    getMyOrders(tab).then(setOrders).finally(() => setLoading(false));
  }, [tab]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleCancel = (code) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận hủy đơn hàng',
      message: `Bạn có chắc chắn muốn hủy đơn hàng ${code}?`,
      onConfirm: async () => {
        try {
          await cancelMyOrder(code, 'Khách tự hủy');
          setOrders((prev) => prev.map((o) => (o.code === code ? { ...o, status: 'Đã hủy' } : o)));
        } catch (e) { alert(e.message); }
      }
    });
  };

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

      {/* Page Header */}
      <div className="bg-paper border-b border-line">
        <div className="mx-auto max-w-4xl px-5 py-10 sm:py-12">
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight">Đơn hàng của tôi</h1>
          <p className="mt-2 text-muted">Theo dõi và quản lý lịch sử mua sắm của bạn</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-5 py-8 flex-1">
        {/* Modern Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`shrink-0 rounded-2xl px-5 py-2.5 text-[14px] font-semibold transition-all ${tab === t.value
                  ? 'bg-ink text-surface shadow-md'
                  : 'bg-paper border border-line text-muted hover:border-brand-300 hover:text-brand'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-3xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-16 text-center rounded-3xl border border-dashed border-line bg-paper py-20">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-display text-xl font-bold text-ink">Chưa có đơn hàng nào</h3>
            <p className="mt-2 text-muted">Bạn chưa có đơn hàng nào trong mục này.</p>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-surface transition hover:bg-brand">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((o) => {
              const cancellable = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'].includes(o.status);

              return (
                <div key={o.id || o.code} className="group rounded-3xl border border-line bg-paper shadow-sm transition hover:shadow-md anim-fadeup">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between border-b border-line px-6 py-4 gap-4 bg-surface/50 rounded-t-3xl">
                    <div className="flex flex-col gap-1">
                      <span className="font-display text-base font-bold text-ink">{o.code}</span>
                      <span className="text-[13px] text-muted font-medium">Đặt lúc: {o.placedAt}</span>
                    </div>
                    <span className={`rounded-xl px-3 py-1.5 text-[12px] font-bold tracking-wide uppercase ${STATUS_STYLE[o.status] || 'bg-line text-muted'}`}>
                      {o.status}
                    </span>
                  </div>

                  {/* Card Items */}
                  <div className="px-6 py-2">
                    {(o.items || []).slice(0, 3).map((it, i) => (
                      <div key={i} className="flex items-center gap-4 py-4 border-b border-line/50 last:border-0">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                          <img src={it.image || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80`} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold text-ink truncate mb-1">{it.name}</div>
                          <div className="text-[13px] font-medium text-muted">x{it.qty}</div>
                        </div>
                        <div className="text-[15px] font-bold text-ink">{formatVnd(it.price * it.qty)}</div>
                      </div>
                    ))}
                    {(o.items || []).length > 3 && (
                      <div className="py-3 text-center">
                        <span className="text-[13px] font-semibold text-brand">Và {o.items.length - 3} sản phẩm khác...</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex flex-wrap items-center justify-between border-t border-line px-6 py-4 bg-surface/50 rounded-b-3xl gap-4">
                    <div className="text-[15px]">
                      <span className="text-muted font-medium mr-2">Tổng tiền:</span>
                      <span className="text-xl font-extrabold text-brand tracking-tight">{formatVnd(o.total)}</span>
                    </div>
                    <div className="flex gap-3">
                      {cancellable && (
                        <button onClick={() => handleCancel(o.code)}
                          className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-2.5 text-[13px] font-bold text-danger transition hover:bg-danger/10 hover:border-danger/30">
                          Hủy đơn
                        </button>
                      )}
                      <Link to={`/orders/${o.code}`}
                        className="rounded-xl bg-brand-50 px-5 py-2.5 text-[13px] font-bold text-brand-600 transition hover:bg-brand hover:text-white shadow-sm hover:shadow-brand/20">
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
