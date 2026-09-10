import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "sklocal.db";

let databasePromise:
  | Promise<SQLite.SQLiteDatabase>
  | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise =
      SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_metadata (
      id INTEGER PRIMARY KEY NOT NULL,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      full_name TEXT,
      role TEXT,
      recovery_question TEXT,
      recovery_answer_hash TEXT,
      recovery_answer_salt TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
  `);

  await db.runAsync(
    `
      INSERT INTO app_metadata (
        key,
        value
      )
      VALUES (?, ?)

      ON CONFLICT(key)
      DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `,
    "schema_version",
    "3"
  );

  return db;
}