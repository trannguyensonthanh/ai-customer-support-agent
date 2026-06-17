import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import { checkout, checkVoucher } from '../lib/customerApi.js';
import Header from '../components/Header.jsx';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const { cart, subtotal, clear } = useCart();
  const [address, setAddress] = useState(customer?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherResult, setVoucherResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const discount = voucherResult?.valid ? voucherResult.discount : 0;
  const total = subtotal + shippingFee - discount;

  const handleVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const result = await checkVoucher(voucherCode, subtotal);
      setVoucherResult(result);
    } catch (e) { setVoucherResult({ valid: false, message: e.message }); }
  };

  const handleSubmit = async () => {
    if (!address.trim()) { setError('Vui lòng nhập địa chỉ giao hàng.'); return; }
    setSubmitting(true); setError('');
    try {
      const result = await checkout({ address, paymentMethod, note, voucherCode: voucherResult?.valid ? voucherCode : undefined });
      navigate('/order-confirm', { state: { order: result.order } });
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  if (!cart.items?.length) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen"><Header />
      <div className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Thanh toán</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* Address */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-display font-semibold text-ink mb-3">📍 Địa chỉ giao hàng</h3>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                placeholder="Nhập địa chỉ giao hàng đầy đủ…"
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand" />
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-display font-semibold text-ink mb-3">💳 Phương thức thanh toán</h3>
              {['COD', 'Chuyển khoản'].map((m) => (
                <label key={m} className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-2 border cursor-pointer transition ${
                  paymentMethod === m ? 'border-brand bg-brand-50' : 'border-line hover:bg-paper'
                }`}>
                  <input type="radio" name="payment" value={m} checked={paymentMethod === m}
                    onChange={() => setPaymentMethod(m)} className="accent-brand" />
                  <span className="text-sm font-medium text-ink">{m === 'COD' ? '🚚 Thanh toán khi nhận hàng (COD)' : '🏦 Chuyển khoản ngân hàng'}</span>
                </label>
              ))}
            </div>

            {/* Voucher */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-display font-semibold text-ink mb-3">🎫 Mã giảm giá</h3>
              <div className="flex gap-2">
                <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã giảm giá…"
                  className="flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand" />
                <button onClick={handleVoucher}
                  className="rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:bg-brand hover:text-white">
                  Áp dụng
                </button>
              </div>
              {voucherResult && (
                <div className={`mt-2 text-sm ${voucherResult.valid ? 'text-success' : 'text-danger'}`}>
                  {voucherResult.valid ? `✓ ${voucherResult.description} — Giảm ${formatVnd(voucherResult.discount)}` : voucherResult.message}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-display font-semibold text-ink mb-3">📝 Ghi chú</h3>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho đơn hàng (không bắt buộc)…"
                className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand" />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-line bg-surface p-5 h-fit lg:sticky lg:top-20">
            <h3 className="font-display font-semibold text-ink mb-3">Đơn hàng ({cart.items.length} sản phẩm)</h3>
            <div className="space-y-2 border-b border-line pb-3 mb-3">
              {cart.items.map((i) => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span className="text-muted truncate mr-2">{i.name} ×{i.qty}</span>
                  <span className="text-ink shrink-0">{formatVnd(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span>{formatVnd(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Phí ship</span>
                <span className={shippingFee === 0 ? 'text-success' : ''}>{shippingFee === 0 ? 'Miễn phí' : formatVnd(shippingFee)}</span>
              </div>
              {discount > 0 && <div className="flex justify-between"><span className="text-muted">Giảm giá</span><span className="text-success">-{formatVnd(discount)}</span></div>}
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-3">
              <span className="font-semibold">Tổng cộng</span>
              <span className="text-xl font-bold text-brand">{formatVnd(total)}</span>
            </div>
            {error && <div className="mt-3 text-sm text-danger">{error}</div>}
            <button onClick={handleSubmit} disabled={submitting}
              className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50">
              {submitting ? 'Đang xử lý…' : 'Xác nhận đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
