import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  photo_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reminder_type (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_key TEXT NOT NULL DEFAULT 'bell',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reminder_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interval_minutes INTEGER NOT NULL DEFAULT 45,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  dnd_until TEXT,
  rotation_mode TEXT NOT NULL DEFAULT 'sequential',
  last_type_index INTEGER NOT NULL DEFAULT -1,
  daily_goal INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS reminder_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_type_id INTEGER NOT NULL REFERENCES reminder_type(id) ON DELETE CASCADE,
  scheduled_at TEXT NOT NULL,
  action TEXT NOT NULL,
  action_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  body_area TEXT NOT NULL DEFAULT 'full',
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  media_key TEXT NOT NULL DEFAULT 'stretch'
);

CREATE TABLE IF NOT EXISTS exercise_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
  scheduled_at TEXT NOT NULL,
  action TEXT NOT NULL,
  action_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_action_at ON reminder_log(action_at);
CREATE INDEX IF NOT EXISTS idx_exercise_log_action_at ON exercise_log(action_at);
`;

async function columnExists(
  db: SQLiteDatabase,
  table: string,
  column: string
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

/** Lightweight migrations for databases created by an earlier schema version. */
async function runMigrations(db: SQLiteDatabase): Promise<void> {
  if (!(await columnExists(db, 'reminder_settings', 'daily_goal'))) {
    await db.execAsync('ALTER TABLE reminder_settings ADD COLUMN daily_goal INTEGER NOT NULL DEFAULT 5');
  }
}

export async function createSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
  await runMigrations(db);
}
