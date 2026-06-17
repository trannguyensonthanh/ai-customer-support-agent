import { nanoid } from 'nanoid';

// Luu lich su tro chuyen theo session trong RAM.
// Tang sau: chuyen sang Redis/PostgreSQL de ben vung va da phien.
const sessions = new Map();

export function getOrCreateSession(sessionId) {
  if (sessionId && sessions.has(sessionId)) {
    return { id: sessionId, session: sessions.get(sessionId) };
  }
  const id = sessionId || nanoid(12);
  const session = { history: [], escalated: false, createdAt: Date.now() };
  sessions.set(id, session);
  return { id, session };
}

export function markEscalated(sessionId) {
  const s = sessions.get(sessionId);
  if (s) s.escalated = true;
}
