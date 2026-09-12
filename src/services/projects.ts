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

export type ProjectStatus =
  | "Planned"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

export type LocalProject = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  budget: number;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  isYouthVisible: boolean;
  createdAt: string;
};

type CreateProjectInput = {
  title: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  isYouthVisible?: boolean;
  createdBy?: string;
};

type UpdateProjectInput = {
  projectId: string;
  title: string;
  description?: string;
  budget?: number;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  isYouthVisible?: boolean;
};

type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  is_archived: number;
  archived_at: string | null;
  is_youth_visible: number;
  created_at: string;
};

const VALID_STATUSES: ProjectStatus[] = [
  "Planned",
  "Ongoing",
  "Completed",
  "Cancelled",
];

function mapProjectRow(
  row: ProjectRow
): LocalProject {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    budget: Number(row.budget) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    createdBy: row.created_by,
    isArchived: row.is_archived === 1,
    archivedAt: row.archived_at,
    isYouthVisible: row.is_youth_visible === 1,
    createdAt: row.created_at,
  };
}

function normalizeOptionalDate(
  value?: string
): string | null {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw new Error("INVALID_DATE");
  }

  const [year, month, day] = cleanValue
    .split("-")
    .map(Number);

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

function validateDateRange(
  startDate: string | null,
  endDate: string | null
) {
  if (
    startDate &&
    endDate &&
    endDate < startDate
  ) {
    throw new Error("INVALID_DATE_RANGE");
  }
}

export async function createLocalProject({
  title,
  description,
  budget = 0,
  startDate,
  endDate,
  isYouthVisible = false,
  createdBy,
}: CreateProjectInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();
  const cleanDescription =
    description?.trim() || null;

  if (!cleanTitle) {
    throw new Error("TITLE_REQUIRED");
  }

  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error("INVALID_BUDGET");
  }

  const cleanStartDate =
    normalizeOptionalDate(startDate);
  const cleanEndDate =
    normalizeOptionalDate(endDate);

  validateDateRange(
    cleanStartDate,
    cleanEndDate
  );

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO projects (
        id,
        title,
        description,
        status,
        budget,
        start_date,
        end_date,
        created_by,
        is_archived,
        is_youth_visible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `,
    id,
    cleanTitle,
    cleanDescription,
    "Planned",
    budget,
    cleanStartDate,
    cleanEndDate,
    createdBy || null,
    isYouthVisible ? 1 : 0
  );

  await recordAppActivity({
    actionType: "project_created",
    entityType: "project",
    entityId: id,
    subject: cleanTitle,
    detail: "Project created",
    userId: createdBy || null,
  });

  return id;
}

export async function getAllLocalProjects():
  Promise<LocalProject[]> {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<ProjectRow>(
      `
        SELECT
          id,
          title,
          description,
          status,
          budget,
          start_date,
          end_date,
          created_by,
          is_archived,
          archived_at,
          is_youth_visible,
          created_at
        FROM projects
        WHERE is_archived = 0
          AND (? = 0 OR is_youth_visible = 1)
        ORDER BY created_at DESC
      `,
      youthMember ? 1 : 0
    );

  return rows.map(mapProjectRow);
}

export async function getAllArchivedProjects():
  Promise<LocalProject[]> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<ProjectRow>(
      `
        SELECT
          id,
          title,
          description,
          status,
          budget,
          start_date,
          end_date,
          created_by,
          is_archived,
          archived_at,
          is_youth_visible,
          created_at
        FROM projects
        WHERE is_archived = 1
        ORDER BY archived_at DESC, created_at DESC
      `
    );

  return rows.map(mapProjectRow);
}

export async function getLocalProjectById(
  projectId: string
): Promise<LocalProject | null> {
  const user = await getCurrentAccessUser();
  const youthMember = isYouthMemberRole(user.role);

  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<ProjectRow>(
      `
        SELECT
          id,
          title,
          description,
          status,
          budget,
          start_date,
          end_date,
          created_by,
          is_archived,
          archived_at,
          is_youth_visible,
          created_at
        FROM projects
        WHERE id = ?
          AND (? = 0 OR is_youth_visible = 1)
        LIMIT 1
      `,
      projectId,
      youthMember ? 1 : 0
    );

  if (!row) {
    return null;
  }

  return mapProjectRow(row);
}

export async function updateLocalProject({
  projectId,
  title,
  description,
  budget = 0,
  status,
  startDate,
  endDate,
  isYouthVisible = false,
}: UpdateProjectInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();
  const cleanDescription =
    description?.trim() || null;

  if (!cleanTitle) {
    throw new Error("TITLE_REQUIRED");
  }

  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error("INVALID_BUDGET");
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }

  const cleanStartDate =
    normalizeOptionalDate(startDate);
  const cleanEndDate =
    normalizeOptionalDate(endDate);

  validateDateRange(
    cleanStartDate,
    cleanEndDate
  );

  const result = await db.runAsync(
    `
      UPDATE projects
      SET
        title = ?,
        description = ?,
        budget = ?,
        status = ?,
        start_date = ?,
        end_date = ?,
        is_youth_visible = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    cleanTitle,
    cleanDescription,
    budget,
    status,
    cleanStartDate,
    cleanEndDate,
    isYouthVisible ? 1 : 0,
    projectId
  );

  if (result.changes === 0) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "project_updated",
    entityType: "project",
    entityId: projectId,
    subject: cleanTitle,
    detail: `Status: ${status}`,
  });
}

export async function archiveLocalProject(
  projectId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const project =
    await getLocalProjectById(projectId);

  const result = await db.runAsync(
    `
      UPDATE projects
      SET
        is_archived = 1,
        archived_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    projectId
  );

  if (result.changes === 0) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "project_archived",
    entityType: "project",
    entityId: projectId,
    subject: project?.title || "Project",
    detail: "Project archived",
  });
}

export async function restoreLocalProject(
  projectId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const project =
    await getLocalProjectById(projectId);

  const result = await db.runAsync(
    `
      UPDATE projects
      SET
        is_archived = 0,
        archived_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    projectId
  );

  if (result.changes === 0) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "project_restored",
    entityType: "project",
    entityId: projectId,
    subject: project?.title || "Project",
    detail: "Project restored",
  });
}

export async function deleteLocalProject(
  projectId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const project =
    await getLocalProjectById(projectId);

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const activityId = Crypto.randomUUID();

  // Keep permanent deletion and its audit entry atomic.
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `DELETE FROM projects WHERE id = ?`,
      projectId
    );

    if (result.changes === 0) {
      throw new Error("PROJECT_NOT_FOUND");
    }

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
          'project_deleted',
          'project',
          ?,
          ?,
          'Project permanently deleted',
          (
            SELECT user_id
            FROM app_session
            WHERE id = 1
            LIMIT 1
          ),
          strftime('%Y-%m-%d %H:%M:%f', 'now')
        )
      `,
      activityId,
      projectId,
      project.title
    );
  });
}
