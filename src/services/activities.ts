import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  requireOfficialAccess,
} from "./access";
import {
  recordAppActivity,
} from "./app-activity";
import {
  getYouthById,
} from "./youth";

export type ActivityStatus =
  | "Planned"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

export type ActivityRecord = {
  id: string;
  title: string;
  activityDate: string;
  activityTime: string | null;
  location: string | null;
  status: ActivityStatus;
  description: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type ActivityRow = {
  id: string;
  title: string;
  activity_date: string;
  activity_time: string | null;
  location: string | null;
  status: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};


export type CreateActivityInput = {
  title: string;
  activityDate: string;
  activityTime?: string;
  location?: string;
  status?: ActivityStatus;
  description?: string;
  createdBy?: string;
};

function normalizeStatus(
  value: string
): ActivityStatus {
  switch (value) {
    case "Ongoing":
    case "Completed":
    case "Cancelled":
      return value;
    default:
      return "Planned";
  }
}

function mapActivityRow(
  row: ActivityRow
): ActivityRecord {
  return {
    id: row.id,
    title: row.title,
    activityDate:
      row.activity_date,
    activityTime:
      row.activity_time,
    location: row.location,
    status:
      normalizeStatus(row.status),
    description:
      row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActivitiesList() {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<ActivityRow>(
      `
        SELECT
          id,
          title,
          activity_date,
          activity_time,
          location,
          status,
          description,
          created_by,
          created_at,
          updated_at
        FROM activities
        ORDER BY
          CASE
            WHEN status = 'Cancelled'
              THEN 3
            WHEN status = 'Completed'
              THEN 2
            WHEN status = 'Ongoing'
              THEN 0
            ELSE 1
          END ASC,
          activity_date ASC,
          COALESCE(
            activity_time,
            ''
          ) ASC,
          created_at DESC
      `
    );

  return rows.map(
    mapActivityRow
  );
}

export async function getActivityById(
  activityId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<ActivityRow>(
      `
        SELECT
          id,
          title,
          activity_date,
          activity_time,
          location,
          status,
          description,
          created_by,
          created_at,
          updated_at
        FROM activities
        WHERE id = ?
        LIMIT 1
      `,
      activityId
    );

  return row
    ? mapActivityRow(row)
    : null;
}

function validateStorageDate(
  value: string
) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    throw new Error(
      "INVALID_ACTIVITY_DATE"
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(
      "INVALID_ACTIVITY_DATE"
    );
  }

  return value;
}

function validateStorageTime(
  value?: string
) {
  const clean = value?.trim();

  if (!clean) {
    return null;
  }

  const match = clean.match(
    /^(\d{2}):(\d{2})$/
  );

  if (!match) {
    throw new Error(
      "INVALID_ACTIVITY_TIME"
    );
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(
      "INVALID_ACTIVITY_TIME"
    );
  }

  return clean;
}

export async function createActivityRecord({
  title,
  activityDate,
  activityTime,
  location,
  status = "Planned",
  description,
  createdBy,
}: CreateActivityInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error(
      "ACTIVITY_TITLE_REQUIRED"
    );
  }

  const cleanDate =
    validateStorageDate(
      activityDate
    );

  const cleanTime =
    validateStorageTime(
      activityTime
    );

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO activities (
        id,
        title,
        activity_date,
        activity_time,
        location,
        status,
        description,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    cleanTitle,
    cleanDate,
    cleanTime,
    location?.trim() || null,
    status,
    description?.trim() || null,
    createdBy?.trim() || null
  );

  await recordAppActivity({
    actionType: "activity_created",
    entityType: "activity",
    entityId: id,
    subject: cleanTitle,
    detail:
      `${cleanDate}` +
      (cleanTime
        ? ` • ${cleanTime}`
        : ""),
    userId:
      createdBy?.trim() || null,
  });

  return id;
}

export type ActivityAttendanceStatus =
  | "Not Marked"
  | "Present"
  | "Absent"
  | "Excused";

export type ActivityParticipantRecord = {
  id: string;
  activityId: string;
  youthId: string | null;
  participantName: string;
  contactNumber: string | null;
  notes: string | null;
  attendanceStatus: ActivityAttendanceStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type ActivityParticipantRow = {
  id: string;
  activity_id: string;
  youth_id: string | null;
  participant_name: string;
  contact_number: string | null;
  notes: string | null;
  attendance_status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityExpenseRecord = {
  id: string;
  title: string;
  amount: number;
  expenseDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  notes: string | null;
  createdAt: string;
};

type ActivityExpenseRow = {
  id: string;
  title: string;
  amount: number;
  expense_date: string | null;
  category_id: string | null;
  category_name: string | null;
  notes: string | null;
  created_at: string;
};

export type ActivityRecordSummary = {
  participantCount: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  notMarkedCount: number;
  expenseCount: number;
  totalExpenses: number;
};

function normalizeAttendanceStatus(
  value: string
): ActivityAttendanceStatus {
  switch (value) {
    case "Present":
    case "Absent":
    case "Excused":
      return value;
    default:
      return "Not Marked";
  }
}

function mapParticipantRow(
  row: ActivityParticipantRow
): ActivityParticipantRecord {
  return {
    id: row.id,
    activityId: row.activity_id,
    youthId: row.youth_id,
    participantName:
      row.participant_name,
    contactNumber:
      row.contact_number,
    notes: row.notes,
    attendanceStatus:
      normalizeAttendanceStatus(
        row.attendance_status
      ),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExpenseRow(
  row: ActivityExpenseRow
): ActivityExpenseRecord {
  return {
    id: row.id,
    title: row.title,
    amount:
      Number(row.amount) || 0,
    expenseDate:
      row.expense_date,
    categoryId:
      row.category_id,
    categoryName:
      row.category_name,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

async function touchActivity(
  activityId: string
) {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE activities
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    activityId
  );
}

export async function getActivityParticipants(
  activityId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<ActivityParticipantRow>(
      `
        SELECT
          id,
          activity_id,
          youth_id,
          participant_name,
          contact_number,
          notes,
          attendance_status,
          created_by,
          created_at,
          updated_at
        FROM activity_participants
        WHERE activity_id = ?
        ORDER BY
          participant_name COLLATE NOCASE ASC,
          created_at ASC
      `,
      activityId
    );

  return rows.map(
    mapParticipantRow
  );
}

export async function addActivityParticipant({
  activityId,
  youthId,
  participantName,
  contactNumber,
  notes,
  attendanceStatus = "Not Marked",
  createdBy,
}: {
  activityId: string;
  youthId?: string;
  participantName: string;
  contactNumber?: string;
  notes?: string;
  attendanceStatus?: ActivityAttendanceStatus;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanName =
    participantName.trim();

  if (!cleanName) {
    throw new Error(
      "PARTICIPANT_NAME_REQUIRED"
    );
  }

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO activity_participants (
        id,
        activity_id,
        youth_id,
        participant_name,
        contact_number,
        notes,
        attendance_status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    activityId,
    youthId?.trim() || null,
    cleanName,
    contactNumber?.trim() || null,
    notes?.trim() || null,
    attendanceStatus,
    createdBy?.trim() || null
  );

  await touchActivity(activityId);

  await recordAppActivity({
    actionType:
      "activity_participant_added",
    entityType:
      "activity_participant",
    entityId: id,
    subject: cleanName,
    detail: "Added to activity participants",
    userId:
      createdBy?.trim() || null,
  });

  return id;
}

export async function markYouthPresentAtActivity({
  activityId,
  youthId,
  createdBy,
}: {
  activityId: string;
  youthId: string;
  createdBy?: string;
}): Promise<
  "created" |
  "updated" |
  "already-present"
> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const youth =
    await getYouthById(youthId);

  if (!youth) {
    throw new Error("YOUTH_NOT_FOUND");
  }

  const existing =
    await db.getFirstAsync<{
      id: string;
      youth_id: string | null;
      attendance_status: string;
    }>(
      `
        SELECT
          id,
          youth_id,
          attendance_status
        FROM activity_participants
        WHERE activity_id = ?
          AND (
            youth_id = ?
            OR (
              youth_id IS NULL
              AND participant_name = ? COLLATE NOCASE
            )
          )
        ORDER BY
          CASE WHEN youth_id = ? THEN 0 ELSE 1 END
        LIMIT 1
      `,
      activityId,
      youthId,
      youth.fullName,
      youthId
    );

  if (existing) {
    if (
      normalizeAttendanceStatus(
        existing.attendance_status
      ) === "Present"
    ) {
      if (existing.youth_id !== youthId) {
        await db.runAsync(
          `
            UPDATE activity_participants
            SET
              youth_id = ?,
              participant_name = ?,
              contact_number = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          youthId,
          youth.fullName,
          youth.contactNumber,
          existing.id
        );

        await touchActivity(activityId);
      }

      return "already-present";
    }

    await db.runAsync(
      `
        UPDATE activity_participants
        SET
          youth_id = ?,
          participant_name = ?,
          contact_number = ?,
          attendance_status = 'Present',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      youthId,
      youth.fullName,
      youth.contactNumber,
      existing.id
    );

    await touchActivity(activityId);

    await recordAppActivity({
      actionType:
        "activity_attendance_updated",
      entityType:
        "activity_participant",
      entityId: existing.id,
      subject: youth.fullName,
      detail:
        "Attendance marked Present by Profile QR",
      userId:
        createdBy?.trim() || null,
    });

    return "updated";
  }

  await addActivityParticipant({
    activityId,
    youthId,
    participantName: youth.fullName,
    contactNumber:
      youth.contactNumber || undefined,
    attendanceStatus: "Present",
    createdBy,
  });

  return "created";
}

export async function deleteActivityParticipant(
  participantId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const record =
    await db.getFirstAsync<{
      activity_id: string;
      participant_name: string;
    }>(
      `
        SELECT
          activity_id,
          participant_name
        FROM activity_participants
        WHERE id = ?
        LIMIT 1
      `,
      participantId
    );

  if (!record) {
    return;
  }

  await db.runAsync(
    `
      DELETE FROM activity_participants
      WHERE id = ?
    `,
    participantId
  );

  await touchActivity(
    record.activity_id
  );

  await recordAppActivity({
    actionType:
      "activity_participant_removed",
    entityType:
      "activity_participant",
    entityId: participantId,
    subject:
      record.participant_name,
    detail:
      "Removed from activity participants",
  });
}

export async function updateActivityAttendanceStatus(
  participantId: string,
  status: ActivityAttendanceStatus
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const record =
    await db.getFirstAsync<{
      activity_id: string;
      participant_name: string;
    }>(
      `
        SELECT
          activity_id,
          participant_name
        FROM activity_participants
        WHERE id = ?
        LIMIT 1
      `,
      participantId
    );

  if (!record) {
    throw new Error(
      "PARTICIPANT_NOT_FOUND"
    );
  }

  await db.runAsync(
    `
      UPDATE activity_participants
      SET
        attendance_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    status,
    participantId
  );

  await touchActivity(
    record.activity_id
  );

  await recordAppActivity({
    actionType:
      "activity_attendance_updated",
    entityType:
      "activity_participant",
    entityId: participantId,
    subject:
      record.participant_name,
    detail:
      `Attendance status: ${status}`,
  });
}

export async function getActivityExpenses(
  activityId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<ActivityExpenseRow>(
      `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.expense_date,
          e.category_id,
          c.name AS category_name,
          e.notes,
          e.created_at
        FROM expenses e
        LEFT JOIN budget_categories c
          ON c.id = e.category_id
        WHERE e.activity_id = ?
        ORDER BY
          COALESCE(
            e.expense_date,
            e.created_at
          ) DESC,
          e.created_at DESC
      `,
      activityId
    );

  return rows.map(
    mapExpenseRow
  );
}

function validateOptionalExpenseDate(
  value?: string
) {
  const clean = value?.trim();

  if (!clean) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      clean
    )
  ) {
    throw new Error(
      "INVALID_EXPENSE_DATE"
    );
  }

  const [year, month, day] =
    clean.split("-").map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      "INVALID_EXPENSE_DATE"
    );
  }

  return clean;
}

export async function addActivityExpense({
  activityId,
  title,
  amount,
  expenseDate,
  categoryId,
  notes,
  createdBy,
}: {
  activityId: string;
  title: string;
  amount: number;
  expenseDate?: string;
  categoryId: string;
  notes?: string;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle =
    title.trim();

  if (!cleanTitle) {
    throw new Error(
      "EXPENSE_TITLE_REQUIRED"
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "INVALID_EXPENSE_AMOUNT"
    );
  }

  if (!categoryId) {
    throw new Error(
      "CATEGORY_REQUIRED"
    );
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
    throw new Error(
      "CATEGORY_NOT_FOUND"
    );
  }

  const cleanDate =
    validateOptionalExpenseDate(
      expenseDate
    );

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
        activity_id,
        notes,
        receipt_uri,
        created_by
      )
      VALUES (
        ?, ?, ?, ?, ?, NULL, ?, ?, NULL, ?
      )
    `,
    id,
    cleanTitle,
    amount,
    cleanDate,
    categoryId,
    activityId,
    notes?.trim() || null,
    createdBy?.trim() || null
  );

  await touchActivity(activityId);

  await recordAppActivity({
    actionType:
      "finance_expense_created",
    entityType: "expense",
    entityId: id,
    subject: cleanTitle,
    detail:
      `₱${amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} • ${category.name} • Activity expense`,
    userId:
      createdBy?.trim() || null,
  });

  return id;
}

export async function getActivityRecordSummary(
  activityId: string
): Promise<ActivityRecordSummary> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const participants =
    await db.getFirstAsync<{
      total: number;
      present_count: number;
      absent_count: number;
      excused_count: number;
      not_marked_count: number;
    }>(
      `
        SELECT
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN attendance_status = 'Present'
              THEN 1 ELSE 0
            END
          ) AS present_count,
          SUM(
            CASE
              WHEN attendance_status = 'Absent'
              THEN 1 ELSE 0
            END
          ) AS absent_count,
          SUM(
            CASE
              WHEN attendance_status = 'Excused'
              THEN 1 ELSE 0
            END
          ) AS excused_count,
          SUM(
            CASE
              WHEN attendance_status = 'Not Marked'
              THEN 1 ELSE 0
            END
          ) AS not_marked_count
        FROM activity_participants
        WHERE activity_id = ?
      `,
      activityId
    );

  const expenses =
    await db.getFirstAsync<{
      total: number | null;
      count: number;
    }>(
      `
        SELECT
          SUM(amount) AS total,
          COUNT(*) AS count
        FROM expenses
        WHERE activity_id = ?
      `,
      activityId
    );

  return {
    participantCount:
      Number(participants?.total || 0),
    presentCount:
      Number(
        participants?.present_count || 0
      ),
    absentCount:
      Number(
        participants?.absent_count || 0
      ),
    excusedCount:
      Number(
        participants?.excused_count || 0
      ),
    notMarkedCount:
      Number(
        participants?.not_marked_count || 0
      ),
    expenseCount:
      Number(expenses?.count || 0),
    totalExpenses:
      Number(expenses?.total || 0),
  };
}

