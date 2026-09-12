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

export type BudgetAllocation = {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  title: string;
  amount: number;
  fiscalYear: number | null;
  notes: string | null;
  isYouthVisible: boolean;
  createdBy: string | null;
  createdAt: string;
};

type BudgetAllocationRow = {
  id: string;
  category_id: string | null;
  category_name: string | null;
  project_id: string | null;
  project_title: string | null;
  title: string;
  amount: number;
  fiscal_year: number | null;
  notes: string | null;
  is_youth_visible: number;
  created_by: string | null;
  created_at: string;
};

type CreateBudgetAllocationInput = {
  categoryId: string;
  projectId?: string | null;
  title: string;
  amount: number;
  fiscalYear?: number | null;
  notes?: string;
  isYouthVisible?: boolean;
  createdBy?: string;
};

function mapRow(
  row: BudgetAllocationRow
): BudgetAllocation {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    projectId: row.project_id,
    projectTitle: row.project_title,
    title: row.title,
    amount: Number(row.amount) || 0,
    fiscalYear:
      row.fiscal_year === null
        ? null
        : Number(row.fiscal_year),
    notes: row.notes,
    isYouthVisible: row.is_youth_visible === 1,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function createBudgetAllocation({
  categoryId,
  projectId,
  title,
  amount,
  fiscalYear,
  notes,
  isYouthVisible = false,
  createdBy,
}: CreateBudgetAllocationInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();
  const cleanNotes = notes?.trim() || null;

  if (!categoryId) {
    throw new Error("CATEGORY_REQUIRED");
  }

  if (!cleanTitle) {
    throw new Error("TITLE_REQUIRED");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  if (
    fiscalYear !== null &&
    fiscalYear !== undefined &&
    (!Number.isInteger(fiscalYear) ||
      fiscalYear < 2000 ||
      fiscalYear > 2100)
  ) {
    throw new Error("INVALID_FISCAL_YEAR");
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
      INSERT INTO budget_allocations (
        id,
        category_id,
        project_id,
        title,
        amount,
        fiscal_year,
        notes,
        is_youth_visible,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    categoryId,
    projectId || null,
    cleanTitle,
    amount,
    fiscalYear ?? null,
    cleanNotes,
    isYouthVisible ? 1 : 0,
    createdBy || null
  );

  await recordAppActivity({
    actionType: "budget_allocation_created",
    entityType: "budget_allocation",
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

export async function getBudgetAllocations():
  Promise<BudgetAllocation[]> {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<BudgetAllocationRow>(
      `
        SELECT
          a.id,
          a.category_id,
          c.name AS category_name,
          a.project_id,
          CASE
            WHEN ? = 1 AND COALESCE(p.is_youth_visible, 0) = 0
              THEN NULL
            ELSE p.title
          END AS project_title,
          a.title,
          a.amount,
          a.fiscal_year,
          CASE WHEN ? = 1 THEN NULL ELSE a.notes END AS notes,
          a.is_youth_visible,
          a.created_by,
          a.created_at
        FROM budget_allocations a
        LEFT JOIN budget_categories c
          ON c.id = a.category_id
        LEFT JOIN projects p
          ON p.id = a.project_id
        WHERE (? = 0 OR a.is_youth_visible = 1)
        ORDER BY
          COALESCE(a.fiscal_year, 0) DESC,
          a.created_at DESC
      `,
      youthMember ? 1 : 0,
      youthMember ? 1 : 0,
      youthMember ? 1 : 0
    );

  return rows.map(mapRow);
}

export async function deleteBudgetAllocation(
  allocationId: string,
  deletedBy?: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const allocation =
    await db.getFirstAsync<{
      id: string;
      title: string;
      amount: number;
    }>(
      `
        SELECT id, title, amount
        FROM budget_allocations
        WHERE id = ?
        LIMIT 1
      `,
      allocationId
    );

  if (!allocation) {
    throw new Error("ALLOCATION_NOT_FOUND");
  }

  const result = await db.runAsync(
    `
      DELETE FROM budget_allocations
      WHERE id = ?
    `,
    allocationId
  );

  if (result.changes === 0) {
    throw new Error("ALLOCATION_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "budget_allocation_deleted",
    entityType: "budget_allocation",
    entityId: allocationId,
    subject: allocation.title,
    detail: `₱${Number(
      allocation.amount
    ).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    userId: deletedBy || null,
  });
}

export async function setBudgetAllocationYouthVisibility(
  allocationId: string,
  isYouthVisible: boolean
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const result = await db.runAsync(
    `
      UPDATE budget_allocations
      SET
        is_youth_visible = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    isYouthVisible ? 1 : 0,
    allocationId
  );

  if (result.changes === 0) {
    throw new Error("ALLOCATION_NOT_FOUND");
  }

  const allocation =
    await db.getFirstAsync<{
      title: string;
    }>(
      `
        SELECT title
        FROM budget_allocations
        WHERE id = ?
        LIMIT 1
      `,
      allocationId
    );

  await recordAppActivity({
    actionType:
      "budget_allocation_updated",
    entityType:
      "budget_allocation",
    entityId: allocationId,
    subject:
      allocation?.title ||
      "Budget allocation",
    detail: isYouthVisible
      ? "Marked public/shareable"
      : "Marked official-only",
  });
}
