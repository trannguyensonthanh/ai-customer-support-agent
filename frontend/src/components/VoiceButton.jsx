import { useState, useRef, useCallback } from 'react';

export default function VoiceButton({ onResult, disabled }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  const toggle = useCallback(() => {
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt không hỗ trợ giọng nói. Vui lòng dùng Chrome.');
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = 'vi-VN';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.continuous = false;

    recog.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript;
      if (text) onResult(text);
      setListening(false);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);

    recogRef.current = recog;
    recog.start();
    setListening(true);
  }, [listening, onResult]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? 'Dừng nghe' : 'Nói'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
        listening
          ? 'bg-agent text-white animate-pulse'
          : 'text-muted hover:bg-brand-50 hover:text-brand disabled:opacity-40'
      }`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <path d="M12 19v4M8 23h8" />
      </svg>
    </button>
  );
}
