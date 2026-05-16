CREATE TABLE IF NOT EXISTS portal_magic_links (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, email_hash TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, requested_ip TEXT, expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_token ON portal_magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_client ON portal_magic_links(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_email_created ON portal_magic_links(email_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_portal_magic_links_ip_created ON portal_magic_links(requested_ip, created_at);
