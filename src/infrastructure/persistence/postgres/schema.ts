/**
 * Skema PostgreSQL (idempoten, aman dijalankan berulang). Mengikuti model data PRD §8.
 * Waktu disimpan sebagai epoch milidetik (BIGINT). Saldo lead TIDAK punya kolom: saldo = hasil hitung dari ledger_entries.
 */
export const SCHEMA_SQL = `
-- Peningkatan dari skema lama (aditif, aman diulang): kolom milik tutor menjadi milik pengguna mana pun.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'ledger_entries' AND column_name = 'tutor_id') THEN
    ALTER TABLE ledger_entries RENAME COLUMN tutor_id TO user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'orders' AND column_name = 'tutor_id') THEN
    ALTER TABLE orders RENAME COLUMN tutor_id TO buyer_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'orders' AND column_name = 'leads') THEN
    ALTER TABLE orders RENAME COLUMN leads TO units;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE, password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE, status TEXT NOT NULL DEFAULT 'active', created_at BIGINT NOT NULL
);
-- Peningkatan dari skema lama: email terverifikasi OTP, dan nomor WhatsApp menjadi isian sesudah daftar (boleh kosong sementara).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at BIGINT;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
CREATE TABLE IF NOT EXISTS otp_challenges (
  id TEXT PRIMARY KEY, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at BIGINT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at BIGINT, ip_hash TEXT NOT NULL, created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS otp_email_idx ON otp_challenges (email, created_at);
CREATE INDEX IF NOT EXISTS otp_ip_idx ON otp_challenges (ip_hash, created_at);
CREATE TABLE IF NOT EXISTS tutor_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id), headline TEXT NOT NULL, subjects JSONB NOT NULL, levels JSONB NOT NULL, curricula JSONB NOT NULL,
  area TEXT NOT NULL, rate INTEGER NOT NULL, rate_duration_min INTEGER NOT NULL, experience_years INTEGER NOT NULL, education TEXT NOT NULL,
  bio TEXT NOT NULL, achievements TEXT NOT NULL, teaches_offline BOOLEAN NOT NULL, teaches_online BOOLEAN NOT NULL, gender TEXT, age INTEGER,
  available_days JSONB NOT NULL, verification TEXT NOT NULL, plan_until BIGINT, rating_avg REAL NOT NULL, review_count INTEGER NOT NULL,
  students_taught INTEGER NOT NULL, completed_at BIGINT, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
);
-- Persetujuan tutor atas pembukaan nama dan WhatsApp (UU PDP). Tutor contoh (id t1, t2, ...) dianggap sudah setuju.
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS consent_at BIGINT;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS consent_version TEXT;
UPDATE tutor_profiles SET consent_at = created_at, consent_version = 'demo' WHERE consent_at IS NULL AND user_id ~ '^t[0-9]+$';
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY, seeker_id TEXT NOT NULL REFERENCES users(id), subject TEXT NOT NULL, level TEXT NOT NULL, curriculum TEXT NOT NULL,
  student_note TEXT NOT NULL, area TEXT NOT NULL, mode TEXT NOT NULL, duration_min INTEGER NOT NULL, budget INTEGER NOT NULL,
  schedule JSONB NOT NULL, notes TEXT NOT NULL, target_tutor_ids JSONB NOT NULL, boost_days INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS requests_seeker_idx ON requests (seeker_id);
CREATE INDEX IF NOT EXISTS requests_expires_idx ON requests (expires_at);
CREATE TABLE IF NOT EXISTS unlocks (
  id TEXT PRIMARY KEY, tutor_id TEXT NOT NULL REFERENCES users(id), request_id TEXT NOT NULL REFERENCES requests(id), created_at BIGINT NOT NULL,
  UNIQUE (tutor_id, request_id)
);
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL DEFAULT 'lead', delta INTEGER NOT NULL, reason TEXT NOT NULL,
  ref_id TEXT NOT NULL, expires_at BIGINT, created_at BIGINT NOT NULL
);
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'lead';
CREATE INDEX IF NOT EXISTS ledger_user_idx ON ledger_entries (user_id, kind);
CREATE TABLE IF NOT EXISTS contact_unlocks (
  id TEXT PRIMARY KEY, seeker_id TEXT NOT NULL REFERENCES users(id), tutor_id TEXT NOT NULL REFERENCES users(id), created_at BIGINT NOT NULL,
  UNIQUE (seeker_id, tutor_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, buyer_id TEXT NOT NULL REFERENCES users(id), product TEXT NOT NULL, amount INTEGER NOT NULL, units INTEGER NOT NULL,
  is_plan BOOLEAN NOT NULL, status TEXT NOT NULL, idempotency_key TEXT NOT NULL, gateway_ref TEXT NOT NULL DEFAULT '',
  created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, UNIQUE (buyer_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS webhook_events (event_id TEXT PRIMARY KEY, at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY, tutor_id TEXT NOT NULL REFERENCES users(id), seeker_id TEXT NOT NULL REFERENCES users(id), child TEXT NOT NULL,
  subject TEXT NOT NULL, slots JSONB NOT NULL, created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS session_notes (
  id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id), topic TEXT NOT NULL, understanding INTEGER NOT NULL, created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY, tutor_id TEXT NOT NULL REFERENCES users(id), seeker_id TEXT NOT NULL REFERENCES users(id), stars INTEGER NOT NULL,
  text TEXT NOT NULL, created_at BIGINT NOT NULL, UNIQUE (tutor_id, seeker_id)
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL REFERENCES users(id), tutor_id TEXT NOT NULL REFERENCES users(id), reason TEXT NOT NULL,
  status TEXT NOT NULL, created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS verification_docs (
  id TEXT PRIMARY KEY, tutor_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, status TEXT NOT NULL, reviewed_by TEXT, created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, user_id TEXT, type TEXT NOT NULL, payload JSONB NOT NULL, dedupe_key TEXT UNIQUE, created_at BIGINT NOT NULL
);
-- Supabase membuka skema public lewat REST API. RLS tanpa kebijakan menolak akses anon/authenticated;
-- backend memakai role pemilik tabel (bypass RLS), jadi tidak terpengaruh.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_challenges ENABLE ROW LEVEL SECURITY;
`;
