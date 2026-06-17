import { BotIcon, AgentIcon, CloseIcon, StarIcon } from './icons.jsx';

export default function ChatHeader({ escalated, language, onLanguage, onRate, onClose }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-3 text-white transition-colors duration-500 ${
        escalated ? 'bg-agent' : 'bg-brand'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        {escalated ? <AgentIcon className="h-5 w-5" /> : <BotIcon className="h-5 w-5" />}
      </div>
      <div className="flex-1">
        <div className="font-display text-[15px] font-semibold leading-tight">
          {escalated ? 'Nhân viên hỗ trợ' : 'Trợ lý CSKH'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/85">
          <span className="h-2 w-2 rounded-full bg-green-300" />
          {escalated ? 'Đang kết nối nhân viên' : 'Phản hồi tức thì · Trực tuyến'}
        </div>
      </div>

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
