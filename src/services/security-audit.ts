import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  requireOfficialAccess,
} from "./access";

export type SecurityAccountSummary = {
  id: string;
  fullName: string | null;
  username: string;
  role: string | null;
  authorizationLevel: string;
  passwordProtected: boolean;
  recoveryConfigured: boolean;
  accountCreatedAt: string;
  accountUpdatedAt: string;
};

export type TraceabilityModule = {
  key: string;
  label: string;
  total: number;
  attributed: number;
  unattributed: number;
};

export type TraceabilitySummary = {
  totalRecords: number;
  attributedRecords: number;
  unattributedRecords: number;
  modules: TraceabilityModule[];
};

export type SecurityAuditEvent = {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  subject: string;
  detail: string | null;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  createdAt: string;
};

export type SecurityAuditOverview = {
  account: SecurityAccountSummary;
  traceability: TraceabilitySummary;
  recentActivity: SecurityAuditEvent[];
  transferHistoryCount: number;
};

type TraceableTableConfig = {
  key: string;
  label: string;
  table: string;
};

const TRACEABLE_TABLES:
  TraceableTableConfig[] = [
    {
      key: "projects",
      label: "Projects",
      table: "projects",
    },
    {
      key: "budget_allocations",
      label: "Budget Allocations",
      table: "budget_allocations",
    },
    {
      key: "expenses",
      label: "Expenses",
      table: "expenses",
    },
    {
      key: "youth",
      label: "Youth Registry",
      table: "youth",
    },
    {
      key: "meetings",
      label: "Meetings",
      table: "meetings",
    },
    {
      key: "activities",
      label: "Activities",
      table: "activities",
    },
    {
      key: "inventory_items",
      label: "Inventory",
      table: "inventory_items",
    },
    {
      key: "documents",
      label: "Documents",
      table: "documents",
    },
  ];

async function getCurrentAccount():
  Promise<SecurityAccountSummary> {
  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      id: string;
      full_name: string | null;
      username: string;
      role: string | null;
      authorization_level: string;
      password_hash: string | null;
      recovery_question: string | null;
      recovery_answer_hash:
        | string
        | null;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT
          u.id,
          u.full_name,
          u.username,
          u.role,
          u.authorization_level,
          u.password_hash,
          u.recovery_question,
          u.recovery_answer_hash,
          u.created_at,
          u.updated_at
        FROM app_session s
        INNER JOIN users u
          ON u.id = s.user_id
        WHERE s.id = 1
          AND u.is_active = 1
        LIMIT 1
      `
    );

  if (!row) {
    throw new Error(
      "NO_ACTIVE_ACCOUNT"
    );
  }

  return {
    id: row.id,
    fullName:
      row.full_name,
    username:
      row.username,
    role: row.role,
    authorizationLevel:
      row.authorization_level,
    passwordProtected:
      Boolean(
        row.password_hash
      ),
    recoveryConfigured:
      Boolean(
        row.recovery_question &&
        row.recovery_answer_hash
      ),
    accountCreatedAt:
      row.created_at,
    accountUpdatedAt:
      row.updated_at,
  };
}

async function getTraceability():
  Promise<TraceabilitySummary> {
  const db =
    await getDatabase();

  const modules:
    TraceabilityModule[] = [];

  let totalRecords = 0;
  let attributedRecords = 0;

  for (
    const config of
      TRACEABLE_TABLES
  ) {
    const row =
      await db.getFirstAsync<{
        total: number;
        attributed: number;
      }>(
        `
          SELECT
            COUNT(*) AS total,
            SUM(
              CASE
                WHEN created_by IS NOT NULL
                  AND TRIM(created_by) <> ''
                THEN 1
                ELSE 0
              END
            ) AS attributed
          FROM ${config.table}
        `
      );

    const total =
      Number(
        row?.total
      ) || 0;

    const attributed =
      Number(
        row?.attributed
      ) || 0;

    const unattributed =
      Math.max(
        0,
        total - attributed
      );

    totalRecords += total;
    attributedRecords +=
      attributed;

    modules.push({
      key: config.key,
      label: config.label,
      total,
      attributed,
      unattributed,
    });
  }

  return {
    totalRecords,
    attributedRecords,
    unattributedRecords:
      Math.max(
        0,
        totalRecords -
          attributedRecords
      ),
    modules,
  };
}

async function getRecentAuditActivity(
  limit = 12
) {
  const db =
    await getDatabase();

  const rows =
    await db.getAllAsync<{
      id: string;
      action_type: string;
      entity_type: string;
      entity_id: string | null;
      subject: string;
      detail: string | null;
      user_id: string | null;
      user_name: string | null;
      user_role: string | null;
      created_at: string;
    }>(
      `
        SELECT
          a.id,
          a.action_type,
          a.entity_type,
          a.entity_id,
          a.subject,
          a.detail,
          a.user_id,
          u.full_name AS user_name,
          u.role AS user_role,
          a.created_at
        FROM app_activity a
        LEFT JOIN users u
          ON u.id = a.user_id
        ORDER BY
          a.created_at DESC,
          a.rowid DESC
        LIMIT ?
      `,
      Math.max(
        1,
        Math.min(
          50,
          Math.floor(limit)
        )
      )
    );

  return rows.map(
    (row): SecurityAuditEvent => ({
      id: row.id,
      actionType:
        row.action_type,
      entityType:
        row.entity_type,
      entityId:
        row.entity_id,
      subject:
        row.subject,
      detail:
        row.detail,
      userId:
        row.user_id,
      userName:
        row.user_name,
      userRole:
        row.user_role,
      createdAt:
        row.created_at,
    })
  );
}

async function getTransferHistoryCount() {
  const db =
    await getDatabase();

  try {
    const row =
      await db.getFirstAsync<{
        count: number;
      }>(
        `
          SELECT COUNT(*) AS count
          FROM data_transfer_history
        `
      );

    return (
      Number(
        row?.count
      ) || 0
    );
  } catch {
    // Phase 13 overview should still open if an older
    // database has not initialized the Phase 12 history
    // table yet.
    return 0;
  }
}

export async function getSecurityAuditOverview():
  Promise<SecurityAuditOverview> {
  await requireOfficialAccess();
  await initializeDatabase();

  const [
    account,
    traceability,
    recentActivity,
    transferHistoryCount,
  ] =
    await Promise.all([
      getCurrentAccount(),
      getTraceability(),
      getRecentAuditActivity(),
      getTransferHistoryCount(),
    ]);

  return {
    account,
    traceability,
    recentActivity,
    transferHistoryCount,
  };
}
