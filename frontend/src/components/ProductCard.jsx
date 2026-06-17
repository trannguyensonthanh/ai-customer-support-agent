// ProductCard: hien thi san pham trong chat khi AI goi y
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import { useState } from 'react';

function formatVnd(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

export default function ProductCard({ product }) {
  const { customer } = useCustomerAuth();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!customer) return;
    const ok = await addItem(product.id || product.code, 1);
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 1500); }
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="mt-1.5 overflow-hidden rounded-2xl border border-line bg-surface transition hover:shadow-md">
      <div className="flex gap-3 p-3">
        <img
          src={product.image || 'https://picsum.photos/seed/default/120/120'}
          alt={product.name}
          className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{product.name}</div>
          <div className="mt-0.5 text-xs text-muted line-clamp-2">{product.description}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm font-bold text-brand-600">{formatVnd(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted line-through">{formatVnd(product.originalPrice)}</span>
            )}
            {discount > 0 && (
              <span className="rounded-full bg-agent px-1.5 py-0.5 text-[10px] font-bold text-white">-{discount}%</span>
            )}
          </div>
          <div className="mt-1.5 flex gap-2">
            {product.stock > 0 && customer && (
              <button
                onClick={handleAdd}
                disabled={added}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  added
                    ? 'bg-success-50 text-success'
                    : 'bg-brand text-white hover:bg-brand-600'
                }`}
              >
                {added ? '✓ Đã thêm' : '+ Giỏ hàng'}
              </button>
            )}
            {product.stock <= 0 && <span className="text-xs font-medium text-danger">Hết hàng</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
