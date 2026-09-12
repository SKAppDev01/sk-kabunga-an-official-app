import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  recordAppActivity,
} from "./app-activity";
import { requireOfficialAccess } from "./access";

export type BudgetCategory = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string | null;
  createdAt: string;
};

type BudgetCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

type CreateBudgetCategoryInput = {
  name: string;
  description?: string;
  createdBy?: string;
};

function mapCategoryRow(
  row: BudgetCategoryRow
): BudgetCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function createBudgetCategory({
  name,
  description,
  createdBy,
}: CreateBudgetCategoryInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanName = name.trim();
  const cleanDescription =
    description?.trim() || null;

  if (!cleanName) {
    throw new Error("CATEGORY_NAME_REQUIRED");
  }

  const duplicate =
    await db.getFirstAsync<{ id: string }>(
      `
        SELECT id
        FROM budget_categories
        WHERE name = ? COLLATE NOCASE
        LIMIT 1
      `,
      cleanName
    );

  if (duplicate) {
    throw new Error("CATEGORY_ALREADY_EXISTS");
  }

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO budget_categories (
        id,
        name,
        description,
        created_by
      )
      VALUES (?, ?, ?, ?)
    `,
    id,
    cleanName,
    cleanDescription,
    createdBy || null
  );

  await recordAppActivity({
    actionType: "budget_category_created",
    entityType: "budget_category",
    entityId: id,
    subject: cleanName,
    detail: "Budget category created",
    userId: createdBy || null,
  });

  return id;
}

export async function getBudgetCategories():
  Promise<BudgetCategory[]> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<BudgetCategoryRow>(
      `
        SELECT
          id,
          name,
          description,
          created_by,
          created_at
        FROM budget_categories
        ORDER BY name COLLATE NOCASE ASC
      `
    );

  return rows.map(mapCategoryRow);
}

export async function deleteBudgetCategory(
  categoryId: string,
  deletedBy?: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const category =
    await db.getFirstAsync<BudgetCategoryRow>(
      `
        SELECT
          id,
          name,
          description,
          created_by,
          created_at
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
      DELETE FROM budget_categories
      WHERE id = ?
    `,
    categoryId
  );

  if (result.changes === 0) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "budget_category_deleted",
    entityType: "budget_category",
    entityId: categoryId,
    subject: category.name,
    detail: "Budget category deleted",
    userId: deletedBy || null,
  });
}
