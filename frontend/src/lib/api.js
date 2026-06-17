// Lay token khach hang neu co
function getCustomerToken() {
  try {
    const raw = localStorage.getItem('sv_customer');
    return raw ? JSON.parse(raw).token : null;
  } catch { return null; }
}

// Doc luong SSE tu backend va goi handler tuong ung voi tung su kien.
export async function streamChat({ message, images, language, sessionId }, handlers) {
  const token = getCustomerToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, images, language, sessionId }),
  });
  if (!res.ok || !res.body) {
    throw new Error('Không kết nối được máy chủ.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Moi su kien SSE cach nhau bang dong trong.
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      if (!block.trim()) continue;
      let event = 'message';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      let parsed = {};
      try {
        parsed = data ? JSON.parse(data) : {};
      } catch {
        parsed = {};
      }
      handlers[event]?.(parsed);
    }
  }
}

export async function fetchFaqs() {
  try {
    const res = await fetch('/api/faqs');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchChatHistory(sessionId) {
  try {
    const res = await fetch(`/api/chat/history/${sessionId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function sendFeedback(payload) {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Doc file anh -> base64 (bo tien to data:...;base64,) de gui cho Gemini.
export function fileToInlineData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.split(',')[1] || '';
      resolve({ mimeType: file.type || 'image/jpeg', data: base64, preview: result });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
