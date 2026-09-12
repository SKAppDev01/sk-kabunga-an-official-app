import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  recordAppActivity,
} from "./app-activity";
import { requireOfficialAccess } from "./access";

export type ProjectExpense = {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  expenseDate: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
};

type CreateProjectExpenseInput = {
  projectId: string;
  title: string;
  amount: number;
  expenseDate?: string;
  notes?: string;
  createdBy?: string;
};

type ProjectExpenseRow = {
  id: string;
  project_id: string;
  title: string;
  amount: number;
  expense_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

function mapExpenseRow(
  row: ProjectExpenseRow
): ProjectExpense {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    amount: Number(row.amount) || 0,
    expenseDate: row.expense_date,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function validateOptionalDate(value?: string) {
  const cleanValue = value?.trim();

  if (!cleanValue) return null;

  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(cleanValue)) {
    throw new Error("INVALID_DATE");
  }

  const [year, month, day] =
    cleanValue.split("-").map(Number);
  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("INVALID_DATE");
  }

  return cleanValue;
}

export async function createProjectExpense({
  projectId,
  title,
  amount,
  expenseDate,
  notes,
  createdBy,
}: CreateProjectExpenseInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();
  const cleanNotes = notes?.trim() || null;
  const cleanDate = validateOptionalDate(expenseDate);

  if (!cleanTitle) {
    throw new Error("TITLE_REQUIRED");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const id = Crypto.randomUUID();

  // Project expenses now write directly into the central Finance expenses table.
  await db.runAsync(
    `
      INSERT INTO expenses (
        id,
        title,
        amount,
        expense_date,
        category_id,
        project_id,
        notes,
        receipt_uri,
        created_by
      )
      VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, ?)
    `,
    id,
    cleanTitle,
    amount,
    cleanDate,
    projectId,
    cleanNotes,
    createdBy || null
  );

  await recordAppActivity({
    actionType: "project_expense_added",
    entityType: "expense",
    entityId: id,
    subject: cleanTitle,
    detail: `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    userId: createdBy || null,
  });

  return id;
}

export async function getProjectExpenses(
  projectId: string
): Promise<ProjectExpense[]> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<ProjectExpenseRow>(
      `
        SELECT
          id,
          project_id,
          title,
          amount,
          expense_date,
          notes,
          created_by,
          created_at
        FROM expenses
        WHERE project_id = ?
        ORDER BY
          COALESCE(expense_date, created_at) DESC,
          created_at DESC
      `,
      projectId
    );

  return rows.map(mapExpenseRow);
}

export async function getProjectExpenseTotal(
  projectId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    total: number | null;
  }>(
    `
      SELECT SUM(amount) AS total
      FROM expenses
      WHERE project_id = ?
    `,
    projectId
  );

  return Number(row?.total) || 0;
}
