import { BotIcon, AgentIcon, CloseIcon, StarIcon } from './icons.jsx';

export default function ChatHeader({ escalated, humanMode, language, onLanguage, onRate, onClose, onCancelEscalation }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-3 text-white transition-colors duration-500 ${
        humanMode ? 'bg-flag' : escalated ? 'bg-agent' : 'bg-brand'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        {escalated || humanMode ? <AgentIcon className="h-5 w-5" /> : <BotIcon className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[15px] font-semibold leading-tight truncate">
          {humanMode ? 'Nhân viên hỗ trợ' : escalated ? 'Đang chuyển máy...' : 'Trợ lý CSKH'}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/90 truncate">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${humanMode ? 'bg-white' : escalated ? 'bg-white animate-pulse' : 'bg-green-300'}`} />
          {humanMode ? 'Đã kết nối nhân viên' : escalated ? 'Đang chờ nhân viên phản hồi' : 'Phản hồi tức thì · Trực tuyến'}
        </div>
      </div>

      {/* Nút hủy chuyển máy */}
      {escalated && !humanMode && onCancelEscalation && (
        <button
          type="button"
          onClick={onCancelEscalation}
          className="mr-1 shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white hover:text-agent whitespace-nowrap"
        >
          Hủy yêu cầu
        </button>
      )}

      {/* Chuyen ngon ngu */}
      <div className="flex overflow-hidden rounded-lg bg-white/15 text-xs font-medium">
        {['vi', 'en'].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLanguage(l)}
            className={`px-2 py-1 uppercase transition ${
              language === l ? 'bg-white text-ink' : 'text-white/80'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onRate}
        aria-label="Đánh giá cuộc trò chuyện"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
      >
        <StarIcon className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng khung chat"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
