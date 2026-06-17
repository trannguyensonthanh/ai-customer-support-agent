export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5" aria-label="Đang soạn trả lời">
      <span className="h-2 w-2 rounded-full bg-brand dot-blink" style={{ animationDelay: '0s' }} />
      <span className="h-2 w-2 rounded-full bg-brand dot-blink" style={{ animationDelay: '0.2s' }} />
      <span className="h-2 w-2 rounded-full bg-brand dot-blink" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}
