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

INSERT OR IGNORE INTO migration_versions (version, description)
VALUES ('0002', 'Add magic links and secure client portal sessions');
