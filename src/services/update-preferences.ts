import {
  getDatabase,
  initializeDatabase,
} from "../database/database";

const AUTO_CHECK_KEY = "app_update_auto_check";

export async function getAutomaticUpdateCheckEnabled() {
  await initializeDatabase();
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    value: string | null;
  }>(
    `
      SELECT value
      FROM app_metadata
      WHERE key = ?
      LIMIT 1
    `,
    AUTO_CHECK_KEY
  );

  if (!row) {
    return true;
  }

  return row.value !== "0";
}

export async function setAutomaticUpdateCheckEnabled(
  enabled: boolean
) {
  await initializeDatabase();
  const db = await getDatabase();

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
    AUTO_CHECK_KEY,
    enabled ? "1" : "0"
  );
}
