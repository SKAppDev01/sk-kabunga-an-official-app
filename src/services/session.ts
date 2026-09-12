import {
    getDatabase,
    initializeDatabase,
} from "../database/database";

export type SessionUser = {
  id: string;
  username: string;
  fullName: string | null;
  role: string | null;
  authorizationLevel: string;
};

export async function saveSession(
  userId: string
) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO app_session (
        id,
        user_id
      )
      VALUES (1, ?)

      ON CONFLICT(id)
      DO UPDATE SET
        user_id = excluded.user_id,
        updated_at = CURRENT_TIMESTAMP
    `,
    userId
  );
}

export async function getCurrentSessionUser():
  Promise<SessionUser | null> {
  await initializeDatabase();

  const db = await getDatabase();

  const user = await db.getFirstAsync<{
    id: string;
    username: string;
    full_name: string | null;
    role: string | null;
    authorization_level: string;
  }>(
    `
      SELECT
        users.id,
        users.username,
        users.full_name,
        users.role,
        users.authorization_level

      FROM app_session

      INNER JOIN users
        ON users.id = app_session.user_id

      WHERE app_session.id = 1
        AND users.is_active = 1

      LIMIT 1
    `
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    authorizationLevel:
      user.authorization_level,
  };
}

export async function clearSession() {
  await initializeDatabase();

  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM app_session
      WHERE id = 1
    `
  );
}