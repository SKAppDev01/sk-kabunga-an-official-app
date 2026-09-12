import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  getCurrentAccessUser,
  isYouthMemberRole,
} from "./access";

export type FinanceSummary = {
  totalAllocated: number;
  totalExpenses: number;
  remainingBalance: number;
  categoryCount: number;
  allocationCount: number;
  expenseCount: number;
};

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const visibilityValue = youthMember ? 1 : 0;

  const [allocationRow, expenseRow, categoryRow] =
    await Promise.all([
      db.getFirstAsync<{
        total: number | null;
        count: number;
      }>(
        `
          SELECT
            SUM(amount) AS total,
            COUNT(*) AS count
          FROM budget_allocations
          WHERE (? = 0 OR is_youth_visible = 1)
        `,
        visibilityValue
      ),
      db.getFirstAsync<{
        total: number | null;
        count: number;
      }>(
        `
          SELECT
            SUM(amount) AS total,
            COUNT(*) AS count
          FROM expenses
          WHERE (? = 0 OR is_youth_visible = 1)
        `,
        visibilityValue
      ),
      youthMember
        ? db.getFirstAsync<{ count: number }>(
            `
              SELECT COUNT(DISTINCT category_id) AS count
              FROM (
                SELECT category_id
                FROM budget_allocations
                WHERE is_youth_visible = 1
                  AND category_id IS NOT NULL

                UNION

                SELECT category_id
                FROM expenses
                WHERE is_youth_visible = 1
                  AND category_id IS NOT NULL
              )
            `
          )
        : db.getFirstAsync<{ count: number }>(`
            SELECT COUNT(*) AS count
            FROM budget_categories
          `),
    ]);

  const totalAllocated =
    Number(allocationRow?.total) || 0;
  const totalExpenses =
    Number(expenseRow?.total) || 0;

  return {
    totalAllocated,
    totalExpenses,
    remainingBalance:
      totalAllocated - totalExpenses,
    categoryCount:
      Number(categoryRow?.count) || 0,
    allocationCount:
      Number(allocationRow?.count) || 0,
    expenseCount:
      Number(expenseRow?.count) || 0,
  };
}

export type FinanceCategoryBalance = {
  categoryId: string;
  categoryName: string;
  allocated: number;
  expenses: number;
  remaining: number;
};

export type FinanceBalanceBreakdown = {
  totalAllocated: number;
  totalExpenses: number;
  remainingBalance: number;
  utilizationPercent: number;
  uncategorizedExpenses: number;
  categories: FinanceCategoryBalance[];
};

type FinanceCategoryBalanceRow = {
  category_id: string;
  category_name: string;
  allocated: number | null;
  expenses: number | null;
};

export async function getFinanceBalanceBreakdown():
  Promise<FinanceBalanceBreakdown> {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const visibilityValue = youthMember ? 1 : 0;

  const [summary, categoryRows, uncategorizedRow] =
    await Promise.all([
      getFinanceSummary(),

      db.getAllAsync<FinanceCategoryBalanceRow>(
        `
          SELECT
            c.id AS category_id,
            c.name AS category_name,

            COALESCE(
              (
                SELECT SUM(a.amount)
                FROM budget_allocations a
                WHERE a.category_id = c.id
                  AND (? = 0 OR a.is_youth_visible = 1)
              ),
              0
            ) AS allocated,

            COALESCE(
              (
                SELECT SUM(e.amount)
                FROM expenses e
                WHERE e.category_id = c.id
                  AND (? = 0 OR e.is_youth_visible = 1)
              ),
              0
            ) AS expenses

          FROM budget_categories c
          WHERE
            ? = 0
            OR EXISTS (
              SELECT 1
              FROM budget_allocations a
              WHERE a.category_id = c.id
                AND a.is_youth_visible = 1
            )
            OR EXISTS (
              SELECT 1
              FROM expenses e
              WHERE e.category_id = c.id
                AND e.is_youth_visible = 1
            )
          ORDER BY c.name COLLATE NOCASE ASC
        `,
        visibilityValue,
        visibilityValue,
        visibilityValue
      ),

      db.getFirstAsync<{
        total: number | null;
      }>(
        `
          SELECT SUM(amount) AS total
          FROM expenses
          WHERE category_id IS NULL
            AND (? = 0 OR is_youth_visible = 1)
        `,
        visibilityValue
      ),
    ]);

  const utilizationPercent =
    summary.totalAllocated > 0
      ? (summary.totalExpenses /
          summary.totalAllocated) *
        100
      : summary.totalExpenses > 0
        ? 100
        : 0;

  return {
    totalAllocated:
      summary.totalAllocated,
    totalExpenses:
      summary.totalExpenses,
    remainingBalance:
      summary.remainingBalance,
    utilizationPercent,
    uncategorizedExpenses:
      Number(uncategorizedRow?.total) || 0,
    categories: categoryRows.map((row) => {
      const allocated =
        Number(row.allocated) || 0;
      const expenses =
        Number(row.expenses) || 0;

      return {
        categoryId: row.category_id,
        categoryName: row.category_name,
        allocated,
        expenses,
        remaining:
          allocated - expenses,
      };
    }),
  };
}
