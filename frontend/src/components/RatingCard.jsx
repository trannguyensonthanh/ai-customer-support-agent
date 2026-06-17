import { useState } from 'react';
import { StarIcon } from './icons.jsx';
import { sendFeedback } from '../lib/api.js';

export default function RatingCard({ sessionId }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!rating) return;
    await sendFeedback({ sessionId, rating, comment });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="anim-fadeup rounded-2xl border border-brand-50 bg-brand-50 px-4 py-3 text-center text-sm text-brand-600">
        Cảm ơn bạn đã đánh giá! Phản hồi của bạn giúp ShopViệt phục vụ tốt hơn.
      </div>
    );
  }

  return (
    <div className="anim-fadeup rounded-2xl border border-line bg-surface p-4">
      <div className="text-center text-sm font-medium text-ink">
        Bạn thấy cuộc trò chuyện này thế nào?
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} sao`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className={`transition ${(hover || rating) >= n ? 'text-flag' : 'text-line'}`}
          >
            <StarIcon className="h-7 w-7" filled={(hover || rating) >= n} />
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Góp ý thêm (không bắt buộc)…"
        className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!rating}
        className="mt-3 w-full rounded-xl bg-brand py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-40"
      >
        Gửi đánh giá
      </button>
    </div>
  );
}
