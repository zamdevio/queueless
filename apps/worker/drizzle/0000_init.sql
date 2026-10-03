-- Placeholder schema for QueueLess.
-- Replace with real migrations (drizzle-kit or hand-written) as the product lands.

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '0');
