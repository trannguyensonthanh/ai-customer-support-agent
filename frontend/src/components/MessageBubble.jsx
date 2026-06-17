import { BotIcon, AgentIcon } from './icons.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import OrderCard from './OrderCard.jsx';
import RatingCard from './RatingCard.jsx';
import ProductCard from './ProductCard.jsx';
import MarkdownText from './MarkdownText.jsx';

function Avatar({ role }) {
  const human = role === 'human';
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
        human ? 'bg-agent-50 text-agent' : 'bg-brand-50 text-brand'
      }`}
    >
      {human ? <AgentIcon /> : <BotIcon />}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const { role, text, images, orders, products, toolStatus, streaming } = message;

  if (role === 'rating') {
    return (
      <div className="px-1 py-1">
        <RatingCard sessionId={message.sessionId} />
      </div>
    );
  }

  if (role === 'system') {
    return (
      <div className="my-1 flex justify-center anim-fadeup">
        <span className="rounded-full bg-flag-50 px-3 py-1 text-center text-xs font-medium text-flag">
          {text}
        </span>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1 anim-fadeup">
        {images?.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Ảnh đính kèm"
                className="h-24 w-24 rounded-xl border border-line object-cover"
              />
            ))}
          </div>
        )}
        {text && (
          <div className="max-w-[78%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-[15px] leading-relaxed text-white">
            {text}
          </div>
        )}
      </div>
    );
  }

  // ai / human
  const isHuman = role === 'human';
  const showDots = streaming && !text && !toolStatus;

  return (
    <div className="flex items-end gap-2 anim-fadeup">
      <Avatar role={role} />
      <div className="max-w-[85%] space-y-2">
        {(text || toolStatus || showDots) && (
          <div
            className={`rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-[15px] leading-relaxed ${
              isHuman ? 'border-agent-50 bg-agent-50 text-ink' : 'border-line bg-surface text-ink'
            }`}
          >
            {showDots ? (
              <TypingIndicator />
            ) : toolStatus && !text ? (
              <span className="flex items-center gap-2 text-muted">
                <TypingIndicator />
                <span className="text-[13px]">{toolStatus}</span>
              </span>
            ) : (
              <>
                <MarkdownText text={text} />
                {streaming && text && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-muted align-middle" />
                )}
              </>
            )}
          </div>
        )}
        {/* Render orders if any */}
        {orders?.map((o, i) => (
          <OrderCard key={`order-${o.code}-${i}`} order={o} />
        ))}
        {/* Render products if any */}
        {products?.length > 0 && (
          <div className="flex flex-col gap-2">
            {products.map((p, i) => (
              <ProductCard key={`prod-${p.id || p.code}-${i}`} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
