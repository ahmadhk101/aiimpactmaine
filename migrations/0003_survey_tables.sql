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
ALTER TABLE surveys ADD COLUMN survey_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_surveys_survey ON surveys(survey_id);

INSERT OR IGNORE INTO migration_versions (version, description)
VALUES ('0003', 'Add survey templates and engagement survey assignments');
