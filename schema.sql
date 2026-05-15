-- AI Impact Maine — Client Engagement Backend v2
-- Fresh install: run this whole file in the D1 console.
-- Upgrading from v1: see MIGRATION FROM V1 section at the bottom.

-- ===== CORE TABLES =====

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS engagements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'pre',
  description TEXT,
  -- v2 additions:
  contract_text TEXT,
  contract_signed_at TEXT,
  contract_signed_ip TEXT,
  contract_signed_name TEXT,
  invoice_amount_cents INTEGER,
  invoice_status TEXT DEFAULT 'unpaid',
  invoice_paid_at TEXT,
  invoice_notes TEXT,
  cal_link TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_engagements_slug ON engagements(slug);
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(client_id);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size_bytes INTEGER,
  visibility TEXT NOT NULL DEFAULT 'all',
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_engagement ON documents(engagement_id);

CREATE TABLE IF NOT EXISTS document_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  accessed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  responses TEXT NOT NULL,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_surveys_engagement ON surveys(engagement_id);

-- ===== V2 TABLES =====

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER,
  event_type TEXT NOT NULL,
  detail TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_activity_engagement ON activity_log(engagement_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_engagement ON messages(engagement_id);

CREATE TABLE IF NOT EXISTS library_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size_bytes INTEGER,
  category TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'drafted',
  template TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE SET NULL
);

-- ===== MIGRATION FROM V1 =====
-- If you already ran v1, run ONLY the statements below (skip everything above).
-- Run each one separately in the D1 console.
--
-- ALTER TABLE engagements ADD COLUMN contract_text TEXT;
-- ALTER TABLE engagements ADD COLUMN contract_signed_at TEXT;
-- ALTER TABLE engagements ADD COLUMN contract_signed_ip TEXT;
-- ALTER TABLE engagements ADD COLUMN contract_signed_name TEXT;
-- ALTER TABLE engagements ADD COLUMN invoice_amount_cents INTEGER;
-- ALTER TABLE engagements ADD COLUMN invoice_status TEXT DEFAULT 'unpaid';
-- ALTER TABLE engagements ADD COLUMN invoice_paid_at TEXT;
-- ALTER TABLE engagements ADD COLUMN invoice_notes TEXT;
-- ALTER TABLE engagements ADD COLUMN cal_link TEXT;
-- Then create activity_log, messages, library_resources, email_log tables.
