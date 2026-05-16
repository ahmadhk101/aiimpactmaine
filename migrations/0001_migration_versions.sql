CREATE TABLE IF NOT EXISTS migration_versions (
  version TEXT PRIMARY KEY,
  description TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO migration_versions (version, description)
VALUES ('0001', 'Create migration tracking table');

