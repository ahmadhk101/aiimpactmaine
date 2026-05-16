CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  form_type TEXT,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  role TEXT,
  sector TEXT,
  interest TEXT,
  involvement TEXT,
  message TEXT,
  package_name TEXT,
  resource_url TEXT,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

INSERT OR IGNORE INTO migration_versions (version, description)
VALUES ('0005', 'Add lead capture table');

