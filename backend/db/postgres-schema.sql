-- Schema PostgreSQL tuong duong kho JSON hien tai (Tang 3).
-- Dung khi nang cap production. Cot embedding co the dung pgvector (vector)
-- hoac jsonb + tinh cosine phia ung dung nhu hien tai.

-- CREATE EXTENSION IF NOT EXISTS vector;  -- bo comment neu dung pgvector

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'agent',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id         TEXT PRIMARY KEY,
  category   TEXT,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  hits       INT DEFAULT 0,
  embedding  JSONB,            -- hoac: embedding vector(768)
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                 TEXT PRIMARY KEY,
  code               TEXT UNIQUE NOT NULL,
  customer_name      TEXT,
  email              TEXT,
  phone              TEXT,
  status             TEXT,
  placed_at          TEXT,
  estimated_delivery TEXT,
  total              INT,
  items              JSONB,
  timeline           JSONB
);

CREATE TABLE IF NOT EXISTS conversations (
  id             TEXT PRIMARY KEY,
  session_id     TEXT UNIQUE NOT NULL,
  label          TEXT,
  status         TEXT NOT NULL DEFAULT 'bot',  -- bot | escalated | human | closed
  assigned_agent TEXT,
  sentiment      TEXT DEFAULT 'neutral',
  resolved_by_ai BOOLEAN DEFAULT false,
  csat           INT,
  last_at        TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,   -- user | ai | human | system
  content         TEXT,
  agent           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS tickets (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  session_id      TEXT,
  reason          TEXT,
  summary         TEXT,
  status          TEXT NOT NULL DEFAULT 'open',  -- open | in_progress | resolved
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id              TEXT PRIMARY KEY,
  session_id      TEXT,
  rating          INT,
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
