CREATE TABLE IF NOT EXISTS crm_companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  notes TEXT,
  source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies(lower(name));
CREATE INDEX IF NOT EXISTS idx_crm_companies_industry ON crm_companies(industry);

CREATE TABLE IF NOT EXISTS crm_contact_details (
  contact_id INTEGER PRIMARY KEY,
  company_id INTEGER,
  title TEXT,
  tags TEXT,
  lifecycle_stage TEXT NOT NULL DEFAULT 'new',
  lead_status TEXT NOT NULL DEFAULT 'new',
  owner TEXT,
  last_contacted_at TEXT,
  next_follow_up_date TEXT,
  follow_up_notes TEXT,
  source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_contact_details_company ON crm_contact_details(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_details_stage ON crm_contact_details(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_contact_details_follow_up ON crm_contact_details(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_crm_contact_details_last_contacted ON crm_contact_details(last_contacted_at);

CREATE TABLE IF NOT EXISTS crm_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  company_id INTEGER,
  lead_id INTEGER,
  activity_type TEXT NOT NULL,
  subject TEXT,
  notes TEXT,
  activity_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  outcome TEXT,
  next_follow_up_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON crm_activities(activity_date);

CREATE TABLE IF NOT EXISTS crm_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  company_id INTEGER,
  lead_id INTEGER,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'new',
  amount_cents INTEGER,
  expected_close_date TEXT,
  owner TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON crm_deals(company_id);

CREATE TABLE IF NOT EXISTS crm_import_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  source TEXT,
  duplicate_action TEXT NOT NULL DEFAULT 'skip',
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_import_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  row_number INTEGER NOT NULL,
  error TEXT NOT NULL,
  raw_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES crm_import_batches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_import_errors_batch ON crm_import_errors(batch_id);

INSERT OR IGNORE INTO migration_versions (version, description)
VALUES ('0009', 'Add CRM contacts, companies, activities, deals, import and export support');
