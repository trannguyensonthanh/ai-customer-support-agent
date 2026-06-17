import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

const STATUS_OPTIONS = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang chuẩn bị',
  'Đang giao',
  'Đã giao',
  'Đã hủy'
];

const STATUS_STYLE = {
  'Đã giao': 'bg-success/10 text-success ring-1 ring-success/20',
  'Đang giao': 'bg-brand/10 text-brand ring-1 ring-brand/20',
  'Đang chuẩn bị': 'bg-agent/10 text-agent ring-1 ring-agent/20',
  'Chờ xác nhận': 'bg-warning/10 text-warning ring-1 ring-warning/20',
  'Đã xác nhận': 'bg-brand/10 text-brand ring-1 ring-brand/20',
  'Đã hủy': 'bg-danger/10 text-danger ring-1 ring-danger/20',
};

export default function Orders() {
  const { auth } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const fetchOrders = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (filterStatus !== 'all') q.set('status', filterStatus);
    if (search) q.set('search', search);

    fetch(`/api/admin/orders?${q.toString()}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        if (selectedOrder) {
          const updated = data.find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({ status: newStatus, note: noteInput })
      });
      if (res.ok) {
        setNoteInput('');
        fetchOrders();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi cập nhật');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận hủy đơn hàng',
      message: `Bạn có chắc chắn muốn hủy đơn ${selectedOrder.code}? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setUpdating(true);
        try {
          const res = await fetch(`/api/admin/orders/${selectedOrder.id}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.token}`
            },
            body: JSON.stringify({ reason: cancelReason || 'Nhân viên quản trị hủy' })
          });
          if (res.ok) {
            setCancelReason('');
            fetchOrders();
          } else {
            const d = await res.json();
            alert(d.error || 'Lỗi hủy đơn');
          }
        } catch (e) {
          alert(e.message);
        } finally {
          setUpdating(false);
        }
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={true}
        confirmText="Hủy đơn hàng"
      />
      {/* Header & Filters */}
      <div className="border-b border-line bg-surface px-6 py-4">
        <h1 className="font-display text-xl font-bold text-ink">Quản lý Đơn hàng</h1>
        <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-[200px] gap-2">
            <input
              type="text"
              placeholder="Tìm theo mã, tên, email, SĐT..."
              className="flex-1 rounded-xl border border-line bg-paper px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-surface hover:bg-brand transition">
              Tìm
            </button>
          </form>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted">Trạng thái:</span>
            <select
              className="rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Order List */}
        <div className="flex-1 overflow-y-auto border-r border-line bg-paper p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center text-muted">Không tìm thấy đơn hàng nào phù hợp.</div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${selectedOrder?.id === o.id
                      ? 'border-brand bg-brand-50 shadow-sm'
                      : 'border-line bg-surface hover:border-brand/50'
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display font-bold text-ink">{o.code}</span>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase ${STATUS_STYLE[o.status] || 'bg-line text-muted'}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted mb-1">{o.customerName} - {o.phone}</div>
                  <div className="flex justify-between items-end text-[13px]">
                    <span className="text-muted">{new Date(o.createdAt).toLocaleString('vi-VN')}</span>
                    <span className="font-bold text-ink">{formatVnd(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Detail Sidebar */}
        {selectedOrder ? (
          <div className="w-[450px] shrink-0 overflow-y-auto bg-surface flex flex-col">
            <div className="border-b border-line px-6 py-4 flex justify-between items-center sticky top-0 bg-surface/90 backdrop-blur z-10">
              <h2 className="font-display text-lg font-bold text-ink">Chi tiết {selectedOrder.code}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-muted hover:text-danger p-1">✕</button>
            </div>

            <div className="p-6 space-y-6 flex-1">

              {/* Timeline Control */}
              <div className="rounded-2xl border border-line bg-paper p-5">
                <h3 className="font-display text-sm font-bold text-ink mb-4">Cập nhật Trạng thái (Thủ công)</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {STATUS_OPTIONS.map(s => {
                    if (s === 'Đã hủy') return null; // Hủy có luồng riêng
                    return (
                      <button
                        key={s}
                        disabled={updating || selectedOrder.status === 'Đã hủy'}
                        onClick={() => handleUpdateStatus(s)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border ${selectedOrder.status === s
                            ? 'bg-brand text-white border-brand shadow-sm'
                            : 'bg-surface text-ink border-line hover:border-brand/50 disabled:opacity-50'
                          }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
                {selectedOrder.status !== 'Đã hủy' && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Ghi chú (tùy chọn) - Hiển thị cho khách"
                      className="flex-1 rounded-xl border border-line px-3 py-2 text-xs bg-surface outline-none focus:border-brand"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Cancel Control */}
              {selectedOrder.status !== 'Đã hủy' && (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
                  <h3 className="font-display text-sm font-bold text-danger mb-3">Hủy đơn hàng</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Lý do hủy"
                      className="flex-1 rounded-xl border border-danger/30 px-3 py-2 text-xs bg-surface outline-none focus:border-danger"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <button
                      disabled={updating}
                      onClick={handleCancelOrder}
                      className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger-600 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-display text-sm font-bold text-ink mb-3">Sản phẩm ({selectedOrder.items?.length})</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((it, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <img src={it.image || 'https://via.placeholder.com/60'} alt="" className="h-12 w-12 rounded-lg object-cover border border-line" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink truncate">{it.name}</div>
                        <div className="text-muted text-xs">x{it.qty}</div>
                      </div>
                      <div className="font-semibold text-ink">{formatVnd(it.price * it.qty)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="rounded-2xl bg-surface p-4 text-sm space-y-2 border border-line">
                <div className="flex justify-between"><span className="text-muted">Tên:</span> <span className="font-medium">{selectedOrder.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted">SĐT:</span> <span className="font-medium">{selectedOrder.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted">Email:</span> <span className="font-medium">{selectedOrder.email}</span></div>
                <div className="pt-2 border-t border-line">
                  <span className="text-muted block mb-1">Địa chỉ giao hàng:</span>
                  <p className="font-medium leading-relaxed">{selectedOrder.address}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl bg-surface p-4 text-sm space-y-2 border border-line">
                <div className="flex justify-between"><span className="text-muted">Tạm tính:</span> <span>{formatVnd(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Phí ship:</span> <span>{formatVnd(selectedOrder.shippingFee)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Giảm giá:</span> <span className="text-success">-{formatVnd(selectedOrder.discount)}</span></div>
                <div className="pt-2 border-t border-line flex justify-between font-bold">
                  <span>Tổng tiền:</span> <span className="text-brand text-lg">{formatVnd(selectedOrder.total)}</span>
                </div>
                <div className="mt-2 text-xs text-muted">TT: {selectedOrder.paymentMethod}</div>
              </div>

            </div>
          </div>
        ) : (
          <div className="w-[450px] shrink-0 bg-surface flex items-center justify-center border-l border-line">
            <div className="text-center text-muted">
              <div className="text-4xl mb-3">📄</div>
              <p>Chọn một đơn hàng để xem chi tiết</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
