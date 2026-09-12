import {
  getDatabase,
  initializeDatabase,
} from "../database/database";

export type AuditableRecordTable =
  | "projects"
  | "expenses"
  | "youth"
  | "meetings"
  | "activities"
  | "inventory_items"
  | "documents";

export type RecordAuditMetadata = {
  recordId: string;
  creatorId: string | null;
  creatorName: string | null;
  creatorRole: string | null;
  createdAt: string;
  updatedAt: string;
};

const TABLES:
  Record<
    AuditableRecordTable,
    string
  > = {
    projects: "projects",
    expenses: "expenses",
    youth: "youth",
    meetings: "meetings",
    activities: "activities",
    inventory_items:
      "inventory_items",
    documents: "documents",
  };

export async function getRecordAuditMetadata(
  table: AuditableRecordTable,
  recordId: string
): Promise<
  RecordAuditMetadata | null
> {
  await initializeDatabase();

  const db =
    await getDatabase();

  const tableName =
    TABLES[table];

  const row =
    await db.getFirstAsync<{
      record_id: string;
      creator_id:
        | string
        | null;
      creator_name:
        | string
        | null;
      creator_role:
        | string
        | null;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT
          r.id AS record_id,
          r.created_by AS creator_id,
          u.full_name AS creator_name,
          u.role AS creator_role,
          r.created_at,
          r.updated_at
        FROM ${tableName} r
        LEFT JOIN users u
          ON u.id = r.created_by
        WHERE r.id = ?
        LIMIT 1
      `,
      recordId
    );

  if (!row) {
    return null;
  }

  return {
    recordId:
      row.record_id,
    creatorId:
      row.creator_id,
    creatorName:
      row.creator_name,
    creatorRole:
      row.creator_role,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}
