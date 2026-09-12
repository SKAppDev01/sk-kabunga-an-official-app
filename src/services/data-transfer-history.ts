import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  requireOfficialAccess,
} from "./access";

export type TransferDirection =
  | "incoming"
  | "outgoing";

export type TransferChannel =
  | "file"
  | "share"
  | "qr";

export type TransferAudience =
  | "public"
  | "officials"
  | "device";

export type TransferType =
  | "export"
  | "import"
  | "backup"
  | "restore"
  | "public_qr"
  | "official_qr";

export type TransferHistoryItem = {
  id: string;
  transfer_type: TransferType;
  direction: TransferDirection;
  channel: TransferChannel;
  status: string;
  audience: TransferAudience | null;
  package_id: string | null;
  record_count: number;
  detail: string | null;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  created_at: string;
};

type AddTransferHistoryInput = {
  transferType: TransferType;
  direction: TransferDirection;
  channel: TransferChannel;
  status?: string;
  audience?: TransferAudience | null;
  packageId?: string | null;
  recordCount?: number;
  detail?: string | null;
  userId?: string | null;
};

async function getCurrentUserId() {
  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      user_id: string;
    }>(
      `
        SELECT user_id
        FROM app_session
        WHERE id = 1
        LIMIT 1
      `
    );

  return row?.user_id || null;
}

export async function addTransferHistory(
  input: AddTransferHistoryInput
) {
  await initializeDatabase();

  const db =
    await getDatabase();

  const userId =
    input.userId !== undefined
      ? input.userId
      : await getCurrentUserId();

  await db.runAsync(
    `
      INSERT INTO data_transfer_history (
        id,
        transfer_type,
        direction,
        channel,
        status,
        audience,
        package_id,
        record_count,
        detail,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    Crypto.randomUUID(),
    input.transferType,
    input.direction,
    input.channel,
    input.status || "completed",
    input.audience || null,
    input.packageId || null,
    Math.max(
      0,
      Number(
        input.recordCount
      ) || 0
    ),
    input.detail || null,
    userId
  );
}

export async function getTransferHistory(
  limit = 100
) {
  await requireOfficialAccess();
  await initializeDatabase();

  const db =
    await getDatabase();

  return db.getAllAsync<
    TransferHistoryItem
  >(
    `
      SELECT
        h.id,
        h.transfer_type,
        h.direction,
        h.channel,
        h.status,
        h.audience,
        h.package_id,
        h.record_count,
        h.detail,
        h.user_id,
        u.full_name AS user_name,
        u.role AS user_role,
        h.created_at
      FROM data_transfer_history h
      LEFT JOIN users u
        ON u.id = h.user_id
      ORDER BY
        h.created_at DESC,
        h.rowid DESC
      LIMIT ?
    `,
    Math.max(
      1,
      Math.min(
        500,
        Math.floor(limit)
      )
    )
  );
}

export async function getTransferHistoryCounts() {
  await requireOfficialAccess();
  await initializeDatabase();

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      total: number;
      incoming: number;
      outgoing: number;
      qr: number;
    }>(
      `
        SELECT
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN direction = 'incoming'
              THEN 1
              ELSE 0
            END
          ) AS incoming,
          SUM(
            CASE
              WHEN direction = 'outgoing'
              THEN 1
              ELSE 0
            END
          ) AS outgoing,
          SUM(
            CASE
              WHEN channel = 'qr'
              THEN 1
              ELSE 0
            END
          ) AS qr
        FROM data_transfer_history
      `
    );

  return {
    total:
      Number(
        row?.total
      ) || 0,
    incoming:
      Number(
        row?.incoming
      ) || 0,
    outgoing:
      Number(
        row?.outgoing
      ) || 0,
    qr:
      Number(
        row?.qr
      ) || 0,
  };
}
