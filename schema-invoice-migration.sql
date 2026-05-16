ALTER TABLE engagements ADD COLUMN invoice_number TEXT;
ALTER TABLE engagements ADD COLUMN invoice_date TEXT;
ALTER TABLE engagements ADD COLUMN payment_link TEXT;
ALTER TABLE engagements ADD COLUMN payment_method TEXT;
ALTER TABLE engagements ADD COLUMN payment_reference TEXT;
CREATE TABLE IF NOT EXISTS invoice_attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, engagement_id INTEGER NOT NULL, filename TEXT NOT NULL, r2_key TEXT NOT NULL, size_bytes INTEGER, label TEXT, uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_invoice_attachments_engagement ON invoice_attachments(engagement_id);
