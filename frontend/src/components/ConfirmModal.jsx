import React, { useEffect } from 'react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy", 
  onConfirm, 
  onCancel,
  isDanger = false 
}) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-surface shadow-2xl anim-fadeup">
        {/* Icon Header */}
        <div className={`flex justify-center p-6 pb-2 ${isDanger ? 'text-danger' : 'text-brand'}`}>
          {isDanger ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="px-6 py-4 text-center">
          <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 bg-paper px-6 py-5 border-t border-line mt-2">
          <button 
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-bold text-ink transition hover:bg-paper focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDanger 
                ? 'bg-danger hover:bg-danger-600 focus:ring-danger' 
                : 'bg-brand hover:bg-brand-600 focus:ring-brand'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
