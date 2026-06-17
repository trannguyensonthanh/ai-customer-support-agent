const DEFAULTS = [
  'Kiểm tra đơn DH1024',
  'Chính sách đổi trả',
  'Phí vận chuyển bao nhiêu?',
  'Tôi muốn gặp nhân viên',
];

export default function QuickReplies({ onPick, disabled }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {DEFAULTS.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onPick(q)}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-brand-600 transition hover:border-brand hover:bg-brand-50 disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
