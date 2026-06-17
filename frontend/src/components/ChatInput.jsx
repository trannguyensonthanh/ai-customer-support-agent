import { useRef, useState } from 'react';
import { SendIcon, ClipIcon, CloseIcon } from './icons.jsx';
import VoiceButton from './VoiceButton.jsx';
import { fileToInlineData } from '../lib/api.js';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState([]); // { mimeType, data, preview }
  const fileRef = useRef(null);

  const submit = () => {
    const t = value.trim();
    if ((!t && images.length === 0) || disabled) return;
    onSend(t, images);
    setValue('');
    setImages([]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    const loaded = await Promise.all(files.map(fileToInlineData));
    setImages((prev) => [...prev, ...loaded].slice(0, 3));
    if (fileRef.current) fileRef.current.value = '';
  };

  const onVoice = (text) => {
    setValue((prev) => (prev ? prev + ' ' + text : text));
  };

  return (
    <div className="border-t border-line bg-surface px-3 py-3">
      {images.length > 0 && (
        <div className="mb-2 flex gap-2 px-1">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.preview} alt="" className="h-14 w-14 rounded-lg border border-line object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Xóa ảnh"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-line bg-paper px-2 py-1.5 focus-within:border-brand">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Đính kèm ảnh"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-brand disabled:opacity-40"
        >
          <ClipIcon />
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />

        <VoiceButton onResult={onVoice} disabled={disabled} />

        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập tin nhắn của bạn…"
          className="max-h-24 flex-1 resize-none bg-transparent py-1.5 text-[15px] text-ink outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || (!value.trim() && images.length === 0)}
          aria-label="Gửi"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
