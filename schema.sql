-- AI Impact Maine production schema
-- Fresh install: run this whole file once in D1.
-- Existing production databases should use files in migrations/ instead.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS migration_versions (
  version TEXT PRIMARY KEY,
  description TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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
  contract_text TEXT,
  contract_signed_at TEXT,
  contract_signed_ip TEXT,
  contract_signed_name TEXT,
  invoice_number TEXT,
  invoice_date TEXT,
  invoice_amount_cents INTEGER,
  invoice_status TEXT DEFAULT 'unpaid',
  invoice_paid_at TEXT,
  invoice_notes TEXT,
  payment_link TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  cal_link TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_engagements_slug ON engagements(slug);
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_stage ON engagements(stage);

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

CREATE TABLE IF NOT EXISTS survey_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  questions TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS engagement_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER NOT NULL,
  template_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  questions TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'all',
  repeatable INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES survey_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_engagement_surveys_engagement ON engagement_surveys(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_surveys_template ON engagement_surveys(template_id);

CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  survey_id INTEGER,
  responses TEXT NOT NULL,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE,
  FOREIGN KEY (survey_id) REFERENCES engagement_surveys(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_surveys_engagement ON surveys(engagement_id);
CREATE INDEX IF NOT EXISTS idx_surveys_survey ON surveys(survey_id);

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

CREATE TABLE IF NOT EXISTS invoice_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engagement_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size_bytes INTEGER,
  label TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoice_attachments_engagement ON invoice_attachments(engagement_id);

CREATE TABLE IF NOT EXISTS portal_magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  email_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  requested_ip TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portal_magic_links_token ON portal_magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_client ON portal_magic_links(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_ip_created ON portal_magic_links(requested_ip, created_at);

CREATE TABLE IF NOT EXISTS portal_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  session_hash TEXT NOT NULL UNIQUE,
  requested_ip TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_hash ON portal_sessions(session_hash);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_client ON portal_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_expires ON portal_sessions(expires_at);

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

CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'consultation',
  client_id INTEGER,
  start_time TEXT NOT NULL,
  end_time TEXT,
  location TEXT,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  client_id INTEGER,
  related_lead_id INTEGER,
  assigned_to TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (related_lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(related_lead_id);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  lead_id INTEGER,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  organization TEXT,
  role TEXT,
  notes TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_lead ON contacts(lead_id);

CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  client_id INTEGER,
  contact_id INTEGER,
  title TEXT NOT NULL,
  notes TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_client ON follow_ups(client_id);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  client_id INTEGER,
  lead_id INTEGER,
  project_type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  start_date TEXT,
  target_end_date TEXT,
  actual_end_date TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  owner TEXT,
  budget INTEGER,
  notes TEXT,
  archived_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead ON projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_target_end ON projects(target_end_date);

CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);

CREATE TABLE IF NOT EXISTS project_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  update_text TEXT NOT NULL,
  status_snapshot TEXT,
  progress_snapshot INTEGER,
  next_step TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_created ON project_updates(created_at);
