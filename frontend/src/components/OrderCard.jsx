import { BoxIcon, CheckIcon } from './icons.jsx';

const STATUS_STYLE = {
  'Đã giao': 'bg-green-100 text-green-700',
  'Đang giao': 'bg-brand-50 text-brand-600',
  'Đang chuẩn bị': 'bg-flag-50 text-flag',
  'Chờ xác nhận': 'bg-flag-50 text-flag',
};

function formatVnd(n) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

export default function OrderCard({ order }) {
  const badge = STATUS_STYLE[order.status] || 'bg-line text-muted';

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-paper px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand">
            <BoxIcon />
          </span>
          <span className="font-display text-sm font-semibold">{order.code}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}>
          {order.status}
        </span>
      </div>

      <div className="px-3.5 py-3">
        {/* San pham */}
        <div className="space-y-1.5">
          {order.items?.map((it, i) => (
            <div key={i} className="flex justify-between text-[13px]">
              <span className="text-ink">
                {it.name} <span className="text-muted">×{it.qty}</span>
              </span>
              <span className="text-muted">{formatVnd(it.price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex justify-between border-t border-line pt-2.5 text-[13px]">
          <span className="text-muted">Tổng cộng</span>
          <span className="font-semibold text-brand-600">{formatVnd(order.total)}</span>
        </div>
        {order.estimatedDelivery && (
          <div className="mt-1 text-xs text-muted">
            Dự kiến giao: {order.estimatedDelivery}
          </div>
        )}

        {/* Timeline trang thai */}
        {order.timeline?.length > 0 && (
          <div className="mt-3.5 border-t border-line pt-3">
            <ol className="relative space-y-3.5">
              {order.timeline.map((s, i) => {
                const isLast = i === order.timeline.length - 1;
                return (
                  <li key={i} className="relative flex gap-3">
                    {!isLast && (
                      <span
                        className={`absolute left-[7px] top-4 h-[calc(100%+0.4rem)] w-0.5 ${
                          s.done ? 'bg-brand' : 'bg-line'
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                        s.done ? 'bg-brand text-white' : 'border-2 border-line bg-surface'
                      }`}
                    >
                      {s.done && <CheckIcon className="h-2 w-2" />}
                    </span>
                    <div className="-mt-0.5">
                      <div className={`text-[13px] ${s.done ? 'font-medium text-ink' : 'text-muted'}`}>
                        {s.step}
                      </div>
                      {s.at && <div className="text-xs text-muted">{s.at}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
