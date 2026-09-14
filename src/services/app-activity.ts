import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import { requireOfficialAccess } from "./access";

export type AppActivityAction =
  | "project_created"
  | "project_updated"
  | "project_archived"
  | "project_restored"
  | "project_deleted"
  | "project_expense_added"
  | "project_participant_added"
  | "project_participant_removed"
  | "budget_category_created"
  | "budget_category_deleted"
  | "budget_allocation_created"
  | "budget_allocation_updated"
  | "budget_allocation_deleted"
  | "finance_expense_created"
  | "finance_expense_updated"
  | "finance_receipt_attached"
  | "finance_receipt_removed"
  | "youth_created"
  | "youth_updated"
  | "meeting_created"
  | "meeting_status_updated"
  | "meeting_agenda_updated"
  | "meeting_minutes_updated"
  | "meeting_attendance_added"
  | "meeting_attendance_updated"
  | "meeting_attendance_deleted"
  | "meeting_resolution_added"
  | "meeting_resolution_updated"
  | "meeting_resolution_deleted"
  | "activity_created"
  | "activity_participant_added"
  | "activity_participant_removed"
  | "activity_attendance_updated"
  | "inventory_item_created"
  | "inventory_quantity_updated"
  | "inventory_condition_updated"
  | "inventory_item_borrowed"
  | "inventory_item_returned"
  | "document_created"
  | "document_updated"
  | "document_attachment_attached"
  | "document_attachment_removed"
  | "document_deleted";

export type AppActivity = {
  id: string;
  actionType: AppActivityAction;
  entityType: string;
  entityId: string | null;
  subject: string;
  detail: string | null;
  userId: string | null;
  createdAt: string;
};

type AppActivityRow = {
  id: string;
  action_type: AppActivityAction;
  entity_type: string;
  entity_id: string | null;
  subject: string;
  detail: string | null;
  user_id: string | null;
  created_at: string;
};

type RecordActivityInput = {
  actionType: AppActivityAction;
  entityType: string;
  entityId?: string | null;
  subject: string;
  detail?: string | null;
  userId?: string | null;
};

function mapActivityRow(
  row: AppActivityRow
): AppActivity {
  return {
    id: row.id,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    subject: row.subject,
    detail: row.detail,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export async function recordAppActivity({
  actionType,
  entityType,
  entityId,
  subject,
  detail,
  userId,
}: RecordActivityInput) {
  try {
    await initializeDatabase();
    const db = await getDatabase();

    const activeSession =
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

    const resolvedUserId =
      userId?.trim() ||
      activeSession?.user_id ||
      null;

    await db.runAsync(
      `
        INSERT INTO app_activity (
          id,
          action_type,
          entity_type,
          entity_id,
          subject,
          detail,
          user_id,
          created_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          strftime('%Y-%m-%d %H:%M:%f', 'now')
        )
      `,
      Crypto.randomUUID(),
      actionType,
      entityType,
      entityId || null,
      subject.trim() || "App activity",
      detail?.trim() || null,
      resolvedUserId
    );
  } catch (error) {
    // Activity logging must never stop the user's main action.
    console.warn(
      "Unable to record app activity:",
      error
    );
  }
}

export async function getRecentAppActivities(
  limit = 6
): Promise<AppActivity[]> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const safeLimit = Math.max(
    1,
    Math.min(Math.floor(limit), 500)
  );

  const rows =
    await db.getAllAsync<AppActivityRow>(
      `
        SELECT
          id,
          action_type,
          entity_type,
          entity_id,
          subject,
          detail,
          user_id,
          created_at
        FROM app_activity
        ORDER BY created_at DESC, rowid DESC
        LIMIT ?
      `,
      safeLimit
    );

  return rows.map(mapActivityRow);
}
