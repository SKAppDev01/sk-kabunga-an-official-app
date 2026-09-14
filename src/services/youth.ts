import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  requireOfficialAccess,
} from "./access";
import {
  recordAppActivity,
} from "./app-activity";
import type {
  ProfileQrPayload,
} from "./profile-qr-data";

export type YouthRecord = {
  id: string;
  profileId: string | null;
  fullName: string;
  birthday: string | null;
  age: number | null;
  sex: string | null;
  purokSitio: string | null;
  contactNumber: string | null;
  education: string | null;
  employmentStatus: string | null;
  youthClassification: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type YouthRow = {
  id: string;
  profile_id: string | null;
  full_name: string;
  birthday: string | null;
  sex: string | null;
  purok_sitio: string | null;
  contact_number: string | null;
  education: string | null;
  employment_status: string | null;
  youth_classification: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const YOUTH_SELECT = `
  SELECT
    id,
    profile_id,
    full_name,
    birthday,
    sex,
    purok_sitio,
    contact_number,
    education,
    employment_status,
    youth_classification,
    created_by,
    created_at,
    updated_at
  FROM youth
`;

export function calculateYouthAge(
  birthday: string | null
): number | null {
  if (!birthday) {
    return null;
  }

  const match = birthday.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);

  const today = new Date();

  let age =
    today.getFullYear() - birthYear;

  const hasNotHadBirthdayYet =
    today.getMonth() + 1 < birthMonth ||
    (today.getMonth() + 1 === birthMonth &&
      today.getDate() < birthDay);

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function mapYouthRow(
  row: YouthRow
): YouthRecord {
  return {
    id: row.id,
    profileId: row.profile_id,
    fullName: row.full_name,
    birthday: row.birthday,
    age: calculateYouthAge(row.birthday),
    sex: row.sex,
    purokSitio: row.purok_sitio,
    contactNumber: row.contact_number,
    education: row.education,
    employmentStatus:
      row.employment_status,
    youthClassification:
      row.youth_classification,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getYouthList():
  Promise<YouthRecord[]> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<YouthRow>(
      `
        ${YOUTH_SELECT}
        ORDER BY full_name COLLATE NOCASE ASC
      `
    );

  return rows.map(mapYouthRow);
}

export async function getYouthCount() {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      count: number;
    }>(
      `
        SELECT COUNT(*) AS count
        FROM youth
      `
    );

  return Number(row?.count) || 0;
}

type CreateYouthInput = {
  profileId?: string;
  fullName: string;
  birthday?: string;
  sex?: string;
  purokSitio?: string;
  contactNumber?: string;
  education?: string;
  employmentStatus?: string;
  youthClassification?: string;
  createdBy?: string;
};

export type UpdateYouthInput = {
  youthId: string;
  fullName: string;
  birthday?: string;
  sex?: string;
  purokSitio?: string;
  contactNumber?: string;
  education?: string;
  employmentStatus?: string;
  youthClassification?: string;
};

function validateOptionalBirthday(
  value?: string
) {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw new Error("INVALID_BIRTHDAY");
  }

  const [year, month, day] =
    cleanValue.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValid) {
    throw new Error("INVALID_BIRTHDAY");
  }

  const today = new Date();

  const todayUtc = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
  );

  if (date.getTime() > todayUtc.getTime()) {
    throw new Error("BIRTHDAY_IN_FUTURE");
  }

  return cleanValue;
}

export async function createYouthRecord({
  profileId,
  fullName,
  birthday,
  sex,
  purokSitio,
  contactNumber,
  education,
  employmentStatus,
  youthClassification,
  createdBy,
}: CreateYouthInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanProfileId =
    profileId?.trim() || null;
  const cleanName = fullName.trim();
  const cleanBirthday =
    validateOptionalBirthday(birthday);

  if (!cleanName) {
    throw new Error("FULL_NAME_REQUIRED");
  }

  if (cleanProfileId) {
    const existing =
      await db.getFirstAsync<{
        id: string;
      }>(
        `
          SELECT id
          FROM youth
          WHERE profile_id = ?
          LIMIT 1
        `,
        cleanProfileId
      );

    if (existing) {
      throw new Error(
        "PROFILE_ALREADY_REGISTERED"
      );
    }
  }

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO youth (
        id,
        profile_id,
        full_name,
        birthday,
        sex,
        purok_sitio,
        contact_number,
        education,
        employment_status,
        youth_classification,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    cleanProfileId,
    cleanName,
    cleanBirthday,
    sex?.trim() || null,
    purokSitio?.trim() || null,
    contactNumber?.trim() || null,
    education?.trim() || null,
    employmentStatus?.trim() || null,
    youthClassification?.trim() || null,
    createdBy || null
  );

  await recordAppActivity({
    actionType: "youth_created",
    entityType: "youth",
    entityId: id,
    subject: cleanName,
    detail: cleanProfileId
      ? "Youth registry record created from Profile QR"
      : "Youth registry record created",
    userId: createdBy || null,
  });

  return id;
}

export async function getYouthById(
  youthId: string
): Promise<YouthRecord | null> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<YouthRow>(
      `
        ${YOUTH_SELECT}
        WHERE id = ?
        LIMIT 1
      `,
      youthId
    );

  return row ? mapYouthRow(row) : null;
}

export async function getYouthByProfileId(
  profileId: string
): Promise<YouthRecord | null> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanProfileId = profileId.trim();

  if (!cleanProfileId) {
    return null;
  }

  const row =
    await db.getFirstAsync<YouthRow>(
      `
        ${YOUTH_SELECT}
        WHERE profile_id = ?
        LIMIT 1
      `,
      cleanProfileId
    );

  return row ? mapYouthRow(row) : null;
}

export async function resolveYouthFromProfileQr(
  payload: ProfileQrPayload
): Promise<YouthRecord | null> {
  const direct =
    await getYouthByProfileId(
      payload.profileId
    );

  if (direct) {
    return direct;
  }

  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<YouthRow>(
      `
        ${YOUTH_SELECT}
        WHERE full_name = ? COLLATE NOCASE
          AND birthday = ?
          AND COALESCE(sex, '') = ? COLLATE NOCASE
          AND COALESCE(purok_sitio, '') = ? COLLATE NOCASE
        LIMIT 2
      `,
      payload.fullName.trim(),
      payload.birthDate.trim(),
      payload.sex.trim(),
      payload.purokSitio.trim()
    );

  if (rows.length !== 1) {
    return null;
  }

  const candidate = rows[0];

  if (
    candidate.profile_id &&
    candidate.profile_id !==
      payload.profileId
  ) {
    return null;
  }

  if (!candidate.profile_id) {
    try {
      await db.runAsync(
        `
          UPDATE youth
          SET
            profile_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND profile_id IS NULL
        `,
        payload.profileId,
        candidate.id
      );
    } catch (error) {
      const linked =
        await getYouthByProfileId(
          payload.profileId
        );

      if (linked) {
        return linked;
      }

      throw error;
    }
  }

  return getYouthById(candidate.id);
}

export async function updateYouthRecord({
  youthId,
  fullName,
  birthday,
  sex,
  purokSitio,
  contactNumber,
  education,
  employmentStatus,
  youthClassification,
}: UpdateYouthInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanId = youthId.trim();
  const cleanName = fullName.trim();
  const cleanBirthday =
    validateOptionalBirthday(birthday);

  if (!cleanId) {
    throw new Error("YOUTH_ID_REQUIRED");
  }

  if (!cleanName) {
    throw new Error("FULL_NAME_REQUIRED");
  }

  const result = await db.runAsync(
    `
      UPDATE youth
      SET
        full_name = ?,
        birthday = ?,
        sex = ?,
        purok_sitio = ?,
        contact_number = ?,
        education = ?,
        employment_status = ?,
        youth_classification = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    cleanName,
    cleanBirthday,
    sex?.trim() || null,
    purokSitio?.trim() || null,
    contactNumber?.trim() || null,
    education?.trim() || null,
    employmentStatus?.trim() || null,
    youthClassification?.trim() || null,
    cleanId
  );

  if (result.changes === 0) {
    throw new Error("YOUTH_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "youth_updated",
    entityType: "youth",
    entityId: cleanId,
    subject: cleanName,
    detail: "Youth registry record updated",
  });
}
