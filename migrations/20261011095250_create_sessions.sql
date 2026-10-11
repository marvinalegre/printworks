-- Migration: create_sessions
-- UP
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%dT%H:%M:%SZ', 'now', '+7 days')),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- DOWN
DROP TABLE IF EXISTS sessions;
