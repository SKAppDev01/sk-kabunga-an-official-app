import * as Crypto from "expo-crypto";

import { getDatabase } from "../database/database";
import {
  AUTH_LEVEL_PUBLIC,
  AUTH_LEVEL_VERIFIED_OFFICIAL,
  YOUTH_MEMBER_ROLE,
  isOfficialRole,
} from "./authorization";
import { hashPassword, verifyPassword } from "./password";

type CreateAccountInput = {
  username: string;
  password: string;
  recoveryQuestion: string;
  recoveryAnswer: string;
};

type LoginInput = {
  username: string;
  password: string;
};

type UpdateProfileInput = {
  userId: string;
  fullName: string;
  role: string;
};

type StoredUser = {
  id: string;
  username: string;
  password_hash: string;
  password_salt: string;
  full_name: string | null;
  role: string | null;
  authorization_level: string;
};

type RecoveryUser = {
  id: string;
  username: string;
  recovery_question: string | null;
  recovery_answer_hash: string | null;
  recovery_answer_salt: string | null;
};

export type LocalAccount = {
  id: string;
  username: string;
  fullName: string | null;
  role: string | null;
  authorizationLevel: string;
  createdAt: string;
};

function normalizeRecoveryAnswer(answer: string) {
  return answer.trim().toLowerCase();
}

export async function createLocalAccount({
  username,
  password,
  recoveryQuestion,
  recoveryAnswer,
}: CreateAccountInput) {
  const db = await getDatabase();

  const cleanUsername = username.trim();
  const cleanRecoveryQuestion =
    recoveryQuestion.trim();
  const cleanRecoveryAnswer =
    normalizeRecoveryAnswer(recoveryAnswer);

  const existingUser =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM users
        WHERE username = ? COLLATE NOCASE
        LIMIT 1
      `,
      cleanUsername
    );

  if (existingUser) {
    throw new Error("USERNAME_EXISTS");
  }

  const passwordResult =
    await hashPassword(password);

  const recoveryResult =
    await hashPassword(cleanRecoveryAnswer);

  const userId = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO users (
        id,
        username,
        password_hash,
        password_salt,
        recovery_question,
        recovery_answer_hash,
        recovery_answer_salt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    userId,
    cleanUsername,
    passwordResult.hash,
    passwordResult.salt,
    cleanRecoveryQuestion,
    recoveryResult.hash,
    recoveryResult.salt
  );

  return {
    id: userId,
    username: cleanUsername,
  };
}

export async function loginLocalAccount({
  username,
  password,
}: LoginInput) {
  const db = await getDatabase();

  const cleanUsername = username.trim();

  const user =
    await db.getFirstAsync<StoredUser>(
      `
        SELECT
          id,
          username,
          password_hash,
          password_salt,
          full_name,
          role,
          authorization_level
        FROM users
        WHERE username = ? COLLATE NOCASE
          AND is_active = 1
        LIMIT 1
      `,
      cleanUsername
    );

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordIsValid =
    await verifyPassword(
      password,
      user.password_hash,
      user.password_salt
    );

  if (!passwordIsValid) {
    throw new Error("INVALID_CREDENTIALS");
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

export async function updateLocalProfile({
  userId,
  fullName,
  role,
}: UpdateProfileInput) {
  const db = await getDatabase();

  const cleanFullName = fullName.trim();
  const cleanRole = role.trim();

  const user =
    await db.getFirstAsync<{
      id: string;
      role: string | null;
      authorization_level: string;
    }>(
      `
        SELECT
          id,
          role,
          authorization_level
        FROM users
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `,
      userId
    );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (isOfficialRole(cleanRole)) {
    if (
      user.authorization_level !==
        AUTH_LEVEL_VERIFIED_OFFICIAL
    ) {
      throw new Error(
        "OFFICIAL_AUTHORIZATION_REQUIRED"
      );
    }
  } else if (
    cleanRole !== YOUTH_MEMBER_ROLE
  ) {
    throw new Error("INVALID_ROLE");
  }

  await db.runAsync(
    `
      UPDATE users
      SET
        full_name = ?,
        role = ?,
        authorization_level = CASE
          WHEN ? = ? THEN ?
          ELSE authorization_level
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    cleanFullName,
    cleanRole,
    cleanRole,
    YOUTH_MEMBER_ROLE,
    AUTH_LEVEL_PUBLIC,
    userId
  );

  return {
    id: userId,
    fullName: cleanFullName,
    role: cleanRole,
    authorizationLevel:
      cleanRole === YOUTH_MEMBER_ROLE
        ? AUTH_LEVEL_PUBLIC
        : user.authorization_level,
  };
}

export async function savePendingFullName({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const db = await getDatabase();

  const cleanFullName =
    fullName.trim();

  if (!cleanFullName) {
    throw new Error(
      "FULL_NAME_REQUIRED"
    );
  }

  const result = await db.runAsync(
    `
      UPDATE users
      SET
        full_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND is_active = 1
    `,
    cleanFullName,
    userId
  );

  if (
    "changes" in result &&
    Number(result.changes) === 0
  ) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  return true;
}

export async function getRecoveryQuestion(
  username: string
) {
  const db = await getDatabase();

  const cleanUsername = username.trim();

  const user =
    await db.getFirstAsync<RecoveryUser>(
      `
        SELECT
          id,
          username,
          recovery_question,
          recovery_answer_hash,
          recovery_answer_salt
        FROM users
        WHERE username = ? COLLATE NOCASE
          AND is_active = 1
        LIMIT 1
      `,
      cleanUsername
    );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (
    !user.recovery_question ||
    !user.recovery_answer_hash ||
    !user.recovery_answer_salt
  ) {
    throw new Error("RECOVERY_NOT_SETUP");
  }

  return {
    username: user.username,
    recoveryQuestion:
      user.recovery_question,
  };
}

export async function resetPasswordWithRecovery({
  username,
  recoveryAnswer,
  newPassword,
}: {
  username: string;
  recoveryAnswer: string;
  newPassword: string;
}) {
  const db = await getDatabase();

  const cleanUsername = username.trim();

  const user =
    await db.getFirstAsync<RecoveryUser>(
      `
        SELECT
          id,
          username,
          recovery_question,
          recovery_answer_hash,
          recovery_answer_salt
        FROM users
        WHERE username = ? COLLATE NOCASE
          AND is_active = 1
        LIMIT 1
      `,
      cleanUsername
    );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (
    !user.recovery_answer_hash ||
    !user.recovery_answer_salt
  ) {
    throw new Error("RECOVERY_NOT_SETUP");
  }

  const normalizedAnswer =
    normalizeRecoveryAnswer(
      recoveryAnswer
    );

  const answerIsCorrect =
    await verifyPassword(
      normalizedAnswer,
      user.recovery_answer_hash,
      user.recovery_answer_salt
    );

  if (!answerIsCorrect) {
    throw new Error(
      "INVALID_RECOVERY_ANSWER"
    );
  }

  const newPasswordResult =
    await hashPassword(newPassword);

  await db.runAsync(
    `
      UPDATE users
      SET
        password_hash = ?,
        password_salt = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    newPasswordResult.hash,
    newPasswordResult.salt,
    user.id
  );

  return true;
}

export async function getAllLocalAccounts(): Promise<
  LocalAccount[]
> {
  const db = await getDatabase();

  const users =
    await db.getAllAsync<{
      id: string;
      username: string;
      full_name: string | null;
      role: string | null;
      authorization_level: string;
      created_at: string;
    }>(
      `
        SELECT
          id,
          username,
          full_name,
          role,
          authorization_level,
          created_at
        FROM users
        ORDER BY created_at DESC
      `
    );

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    authorizationLevel:
      user.authorization_level,
    createdAt: user.created_at,
  }));
}

export async function deleteLocalAccount(
  userId: string
) {
  const db = await getDatabase();

  const foundingOrganization =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM sk_organization
        WHERE established_by = ?
        LIMIT 1
      `,
      userId
    );

  if (foundingOrganization) {
    throw new Error(
      "FOUNDING_OFFICIAL_PROTECTED"
    );
  }

  await db.runAsync(
    `
      DELETE FROM users
      WHERE id = ?
    `,
    userId
  );
}