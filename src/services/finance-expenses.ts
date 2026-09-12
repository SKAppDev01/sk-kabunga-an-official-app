import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  recordAppActivity,
} from "./app-activity";
import {
  getCurrentAccessUser,
  isYouthMemberRole,
  requireOfficialAccess,
} from "./access";

export type FinanceExpense = {
  id: string;
  title: string;
  amount: number;
  expenseDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  notes: string | null;
  receiptUri: string | null;
  isYouthVisible: boolean;
  createdBy: string | null;
  createdAt: string;
};

type FinanceExpenseRow = {
  id: string;
  title: string;
  amount: number;
  expense_date: string | null;
  category_id: string | null;
  category_name: string | null;
  project_id: string | null;
  project_title: string | null;
  notes: string | null;
  receipt_uri: string | null;
  is_youth_visible: number;
  created_by: string | null;
  created_at: string;
};

type CreateFinanceExpenseInput = {
  title: string;
  amount: number;
  expenseDate?: string;
  categoryId: string;
  projectId?: string | null;
  notes?: string;
  isYouthVisible?: boolean;
  createdBy?: string;
};

function mapExpenseRow(
  row: FinanceExpenseRow
): FinanceExpense {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount) || 0,
    expenseDate: row.expense_date,
    categoryId: row.category_id,
    categoryName: row.category_name,
    projectId: row.project_id,
    projectTitle: row.project_title,
    notes: row.notes,
    receiptUri: row.receipt_uri,
    isYouthVisible: row.is_youth_visible === 1,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function validateOptionalDate(
  value?: string
) {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw new Error("INVALID_DATE");
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
    throw new Error("INVALID_DATE");
  }

  return cleanValue;
}

export async function createFinanceExpense({
  title,
  amount,
  expenseDate,
  categoryId,
  projectId,
  notes,
  isYouthVisible = false,
  createdBy,
}: CreateFinanceExpenseInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();
  const cleanDate =
    validateOptionalDate(expenseDate);
  const cleanNotes =
    notes?.trim() || null;

  if (!cleanTitle) {
    throw new Error("TITLE_REQUIRED");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  if (!categoryId) {
    throw new Error("CATEGORY_REQUIRED");
  }

  const category =
    await db.getFirstAsync<{
      id: string;
      name: string;
    }>(
      `
        SELECT id, name
        FROM budget_categories
        WHERE id = ?
        LIMIT 1
      `,
      categoryId
    );

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  const id = Crypto.randomUUID();

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
        is_youth_visible,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `,
    id,
    cleanTitle,
    amount,
    cleanDate,
    categoryId,
    projectId || null,
    cleanNotes,
    isYouthVisible ? 1 : 0,
    createdBy || null
  );

  await recordAppActivity({
    actionType: "finance_expense_created",
    entityType: "expense",
    entityId: id,
    subject: cleanTitle,
    detail: `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} • ${category.name}`,
    userId: createdBy || null,
  });

  return id;
}

export async function getAllFinanceExpenses():
  Promise<FinanceExpense[]> {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<FinanceExpenseRow>(
      `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.expense_date,
          e.category_id,
          c.name AS category_name,
          e.project_id,
          CASE
            WHEN ? = 1 AND COALESCE(p.is_youth_visible, 0) = 0
              THEN NULL
            ELSE p.title
          END AS project_title,
          CASE WHEN ? = 1 THEN NULL ELSE e.notes END AS notes,
          CASE WHEN ? = 1 THEN NULL ELSE e.receipt_uri END AS receipt_uri,
          e.is_youth_visible,
          e.created_by,
          e.created_at
        FROM expenses e
        LEFT JOIN budget_categories c
          ON c.id = e.category_id
        LEFT JOIN projects p
          ON p.id = e.project_id
        WHERE (? = 0 OR e.is_youth_visible = 1)
        ORDER BY
          COALESCE(
            e.expense_date,
            e.created_at
          ) DESC,
          e.created_at DESC
      `,
      youthMember ? 1 : 0,
      youthMember ? 1 : 0,
      youthMember ? 1 : 0,
      youthMember ? 1 : 0
    );

  return rows.map(mapExpenseRow);
}

export async function getFinanceExpenseTotal() {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      total: number | null;
    }>(
      `
        SELECT SUM(amount) AS total
        FROM expenses
        WHERE (? = 0 OR is_youth_visible = 1)
      `,
      youthMember ? 1 : 0
    );

  return Number(row?.total) || 0;
}


export async function getFinanceExpenseById(
  expenseId: string
): Promise<FinanceExpense | null> {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<FinanceExpenseRow>(
      `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.expense_date,
          e.category_id,
          c.name AS category_name,
          e.project_id,
          CASE
            WHEN ? = 1 AND COALESCE(p.is_youth_visible, 0) = 0
              THEN NULL
            ELSE p.title
          END AS project_title,
          CASE WHEN ? = 1 THEN NULL ELSE e.notes END AS notes,
          CASE WHEN ? = 1 THEN NULL ELSE e.receipt_uri END AS receipt_uri,
          e.is_youth_visible,
          e.created_by,
          e.created_at
        FROM expenses e
        LEFT JOIN budget_categories c
          ON c.id = e.category_id
        LEFT JOIN projects p
          ON p.id = e.project_id
        WHERE e.id = ?
          AND (? = 0 OR e.is_youth_visible = 1)
        LIMIT 1
      `,
      youthMember ? 1 : 0,
      youthMember ? 1 : 0,
      youthMember ? 1 : 0,
      expenseId,
      youthMember ? 1 : 0
    );

  return row ? mapExpenseRow(row) : null;
}


type UpdateFinanceExpenseInput = {
  expenseId: string;
  title: string;
  amount: number;
  expenseDate?: string;
  categoryId: string;
  projectId?: string | null;
  notes?: string;
  isYouthVisible?: boolean;
  updatedBy?: string;
};

export async function updateFinanceExpense({
  expenseId,
  title,
  amount,
  expenseDate,
  categoryId,
  projectId,
  notes,
  isYouthVisible = false,
  updatedBy,
}: UpdateFinanceExpenseInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();
  const cleanDate =
    validateOptionalDate(expenseDate);
  const cleanNotes =
    notes?.trim() || null;

  if (!cleanTitle) {
    throw new Error("TITLE_REQUIRED");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  if (!categoryId) {
    throw new Error("CATEGORY_REQUIRED");
  }

  const category =
    await db.getFirstAsync<{
      id: string;
      name: string;
    }>(
      `
        SELECT id, name
        FROM budget_categories
        WHERE id = ?
        LIMIT 1
      `,
      categoryId
    );

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  const result = await db.runAsync(
    `
      UPDATE expenses
      SET
        title = ?,
        amount = ?,
        expense_date = ?,
        category_id = ?,
        project_id = ?,
        notes = ?,
        is_youth_visible = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    cleanTitle,
    amount,
    cleanDate,
    categoryId,
    projectId || null,
    cleanNotes,
    isYouthVisible ? 1 : 0,
    expenseId
  );

  if (result.changes === 0) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "finance_expense_updated",
    entityType: "expense",
    entityId: expenseId,
    subject: cleanTitle,
    detail: `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} • ${category.name}`,
    userId: updatedBy || null,
  });
}


export async function updateFinanceExpenseReceipt({
  expenseId,
  receiptUri,
  updatedBy,
}: {
  expenseId: string;
  receiptUri: string | null;
  updatedBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const expense =
    await db.getFirstAsync<{
      id: string;
      title: string;
    }>(
      `
        SELECT id, title
        FROM expenses
        WHERE id = ?
        LIMIT 1
      `,
      expenseId
    );

  if (!expense) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  const result = await db.runAsync(
    `
      UPDATE expenses
      SET
        receipt_uri = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    receiptUri,
    expenseId
  );

  if (result.changes === 0) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: receiptUri
      ? "finance_receipt_attached"
      : "finance_receipt_removed",
    entityType: "expense",
    entityId: expenseId,
    subject: expense.title,
    detail: receiptUri
      ? "Receipt photo attached"
      : "Receipt photo removed",
    userId: updatedBy || null,
  });
}
