import * as Crypto from "expo-crypto";

import { getDatabase } from "../database/database";
import type { SessionUser } from "./session";
import {
  buildProfileQrPayload,
  isProfileQrReady,
  parseProfileQrPayload,
} from "./profile-qr-data";

export type PersonalProfile = {
  userId: string;
  profileId: string;
  fullName: string;
  birthDate: string;
  sex: string;
  purokSitio: string;
  contactNumber: string;
  educationStatus: string;
  employmentStatus: string;
  youthClassification: string;
  createdAt: string;
  updatedAt: string;
};

export type SavePersonalProfileInput = Omit<
  PersonalProfile,
  "createdAt" | "updatedAt"
>;

type PersonalProfileRow = {
  userId: string;
  profileId: string;
  fullName: string | null;
  birthDate: string | null;
  sex: string | null;
  purokSitio: string | null;
  contactNumber: string | null;
  educationStatus: string | null;
  employmentStatus: string | null;
  youthClassification: string | null;
  createdAt: string;
  updatedAt: string;
};


function normalizeSexValue(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();

  switch (normalized) {
    case "mal":
    case "male":
      return "Male";
    case "femal":
    case "female":
      return "Female";
    case "prefer not to sa":
    case "prefer not to say":
      return "Prefer not to say";
    default:
      return trimmed;
  }
}

const PROFILE_SELECT = `
  SELECT
    user_id AS userId,
    profile_id AS profileId,
    full_name AS fullName,
    birth_date AS birthDate,
    sex AS sex,
    purok_sitio AS purokSitio,
    contact_number AS contactNumber,
    education_status AS educationStatus,
    employment_status AS employmentStatus,
    youth_classification AS youthClassification,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM personal_profiles
`;

function mapRow(row: PersonalProfileRow): PersonalProfile {
  return {
    userId: row.userId,
    profileId: row.profileId,
    fullName: row.fullName ?? "",
    birthDate: row.birthDate ?? "",
    sex: normalizeSexValue(row.sex ?? ""),
    purokSitio: row.purokSitio ?? "",
    contactNumber: row.contactNumber ?? "",
    educationStatus: row.educationStatus ?? "",
    employmentStatus: row.employmentStatus ?? "",
    youthClassification: row.youthClassification ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function ensurePersonalProfileTable() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS personal_profiles (
      user_id TEXT NOT NULL UNIQUE,
      profile_id TEXT NOT NULL UNIQUE,
      full_name TEXT,
      birth_date TEXT,
      sex TEXT,
      purok_sitio TEXT,
      contact_number TEXT,
      education_status TEXT,
      employment_status TEXT,
      youth_classification TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_personal_profiles_profile_id
      ON personal_profiles(profile_id);
  `);

  return db;
}

export async function getPersonalProfile(userId: string) {
  const db = await ensurePersonalProfileTable();

  const row = await db.getFirstAsync<PersonalProfileRow>(
    `${PROFILE_SELECT} WHERE user_id = ? LIMIT 1`,
    userId
  );

  return row ? mapRow(row) : null;
}

export async function getPersonalProfileByProfileId(
  profileId: string
) {
  const db = await ensurePersonalProfileTable();

  const row = await db.getFirstAsync<PersonalProfileRow>(
    `${PROFILE_SELECT} WHERE profile_id = ? LIMIT 1`,
    profileId
  );

  return row ? mapRow(row) : null;
}

export async function getOrCreatePersonalProfile(
  user: SessionUser
) {
  const existing = await getPersonalProfile(user.id);

  if (existing) {
    return existing;
  }

  const db = await ensurePersonalProfileTable();
  const profileId = Crypto.randomUUID();
  const now = new Date().toISOString();
  const initialFullName =
    user.fullName?.trim() || user.username.trim();

  await db.runAsync(
    `
      INSERT OR IGNORE INTO personal_profiles (
        user_id,
        profile_id,
        full_name,
        birth_date,
        sex,
        purok_sitio,
        contact_number,
        education_status,
        employment_status,
        youth_classification,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, '', '', '', '', '', '', '', ?, ?)
    `,
    user.id,
    profileId,
    initialFullName,
    now,
    now
  );

  const profile = await getPersonalProfile(user.id);

  if (!profile) {
    throw new Error("PROFILE_CREATE_FAILED");
  }

  return profile;
}

export async function savePersonalProfile(
  input: SavePersonalProfileInput
) {
  const db = await ensurePersonalProfileTable();
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE personal_profiles
      SET
        full_name = ?,
        birth_date = ?,
        sex = ?,
        purok_sitio = ?,
        contact_number = ?,
        education_status = ?,
        employment_status = ?,
        youth_classification = ?,
        updated_at = ?
      WHERE user_id = ? AND profile_id = ?
    `,
    input.fullName.trim(),
    input.birthDate.trim(),
    normalizeSexValue(input.sex),
    input.purokSitio.trim(),
    input.contactNumber.trim(),
    input.educationStatus.trim(),
    input.employmentStatus.trim(),
    input.youthClassification.trim(),
    now,
    input.userId,
    input.profileId
  );

  // Keep the account-facing name in sync with the personal profile so
  // Home and other account surfaces immediately display the edited name.
  await db.runAsync(
    `
      UPDATE users
      SET full_name = ?, updated_at = ?
      WHERE id = ?
    `,
    input.fullName.trim(),
    now,
    input.userId
  );

  const profile = await getPersonalProfile(input.userId);

  if (!profile) {
    throw new Error("PROFILE_SAVE_FAILED");
  }

  return profile;
}

export {
  buildProfileQrPayload,
  isProfileQrReady,
  parseProfileQrPayload,
};
