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

export type MeetingStatus =
  | "Scheduled"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

export type MeetingRecord = {
  id: string;
  title: string;
  meetingDate: string;
  meetingTime: string | null;
  location: string | null;
  status: MeetingStatus;
  agenda: string | null;
  minutes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type MeetingRow = {
  id: string;
  title: string;
  meeting_date: string;
  meeting_time: string | null;
  location: string | null;
  status: string;
  agenda: string | null;
  minutes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};


export type CreateMeetingInput = {
  title: string;
  meetingDate: string;
  meetingTime?: string;
  location?: string;
  status?: MeetingStatus;
  createdBy?: string;
};

function normalizeStatus(
  status: string
): MeetingStatus {
  switch (status) {
    case "Ongoing":
    case "Completed":
    case "Cancelled":
      return status;
    default:
      return "Scheduled";
  }
}

function mapMeetingRow(
  row: MeetingRow
): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    meetingDate: row.meeting_date,
    meetingTime: row.meeting_time,
    location: row.location,
    status: normalizeStatus(row.status),
    agenda: row.agenda,
    minutes: row.minutes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMeetingsList() {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<MeetingRow>(
      `
        SELECT
          id,
          title,
          meeting_date,
          meeting_time,
          location,
          status,
          agenda,
          minutes,
          created_by,
          created_at,
          updated_at
        FROM meetings
        ORDER BY
          CASE
            WHEN status = 'Cancelled' THEN 2
            WHEN status = 'Completed' THEN 1
            ELSE 0
          END ASC,
          meeting_date ASC,
          COALESCE(meeting_time, '') ASC,
          created_at DESC
      `
    );

  return rows.map(mapMeetingRow);
}

export async function getMeetingById(
  meetingId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<MeetingRow>(
      `
        SELECT
          id,
          title,
          meeting_date,
          meeting_time,
          location,
          status,
          agenda,
          minutes,
          created_by,
          created_at,
          updated_at
        FROM meetings
        WHERE id = ?
        LIMIT 1
      `,
      meetingId
    );

  return row
    ? mapMeetingRow(row)
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
      "INVALID_MEETING_DATE"
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
      "INVALID_MEETING_DATE"
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
      "INVALID_MEETING_TIME"
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
      "INVALID_MEETING_TIME"
    );
  }

  return clean;
}

export async function createMeetingRecord({
  title,
  meetingDate,
  meetingTime,
  location,
  status = "Scheduled",
  createdBy,
}: CreateMeetingInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error(
      "MEETING_TITLE_REQUIRED"
    );
  }

  const cleanDate =
    validateStorageDate(
      meetingDate
    );

  const cleanTime =
    validateStorageTime(
      meetingTime
    );

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO meetings (
        id,
        title,
        meeting_date,
        meeting_time,
        location,
        status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    cleanTitle,
    cleanDate,
    cleanTime,
    location?.trim() || null,
    status,
    createdBy?.trim() || null
  );

  await recordAppActivity({
    actionType: "meeting_created",
    entityType: "meeting",
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

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Excused";

export type MeetingAttendanceRecord = {
  id: string;
  meetingId: string;
  attendeeName: string;
  attendeeRole: string | null;
  attendanceStatus: AttendanceStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type MeetingAttendanceRow = {
  id: string;
  meeting_id: string;
  attendee_name: string;
  attendee_role: string | null;
  attendance_status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ResolutionStatus =
  | "Draft"
  | "Approved"
  | "Rejected";

export type MeetingResolutionRecord = {
  id: string;
  meetingId: string;
  resolutionNumber: string | null;
  title: string;
  details: string | null;
  status: ResolutionStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type MeetingResolutionRow = {
  id: string;
  meeting_id: string;
  resolution_number: string | null;
  title: string;
  details: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingSectionSummary = {
  hasAgenda: boolean;
  attendanceCount: number;
  presentCount: number;
  hasMinutes: boolean;
  resolutionCount: number;
};

function normalizeAttendanceStatus(
  value: string
): AttendanceStatus {
  switch (value) {
    case "Absent":
    case "Excused":
      return value;
    default:
      return "Present";
  }
}

function normalizeResolutionStatus(
  value: string
): ResolutionStatus {
  switch (value) {
    case "Approved":
    case "Rejected":
      return value;
    default:
      return "Draft";
  }
}

function mapAttendanceRow(
  row: MeetingAttendanceRow
): MeetingAttendanceRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    attendeeName: row.attendee_name,
    attendeeRole: row.attendee_role,
    attendanceStatus:
      normalizeAttendanceStatus(
        row.attendance_status
      ),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapResolutionRow(
  row: MeetingResolutionRow
): MeetingResolutionRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    resolutionNumber:
      row.resolution_number,
    title: row.title,
    details: row.details,
    status:
      normalizeResolutionStatus(
        row.status
      ),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function touchMeeting(
  meetingId: string
) {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE meetings
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    meetingId
  );
}

async function getMeetingAuditTitle(
  meetingId: string
) {
  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      title: string;
    }>(
      `
        SELECT title
        FROM meetings
        WHERE id = ?
        LIMIT 1
      `,
      meetingId
    );

  return row?.title || "Meeting";
}

export async function updateMeetingAgenda(
  meetingId: string,
  agenda: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const result = await db.runAsync(
    `
      UPDATE meetings
      SET
        agenda = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    agenda.trim() || null,
    meetingId
  );

  if (result.changes === 0) {
    throw new Error(
      "MEETING_NOT_FOUND"
    );
  }

  await recordAppActivity({
    actionType:
      "meeting_agenda_updated",
    entityType: "meeting",
    entityId: meetingId,
    subject:
      await getMeetingAuditTitle(
        meetingId
      ),
    detail: "Meeting agenda updated",
  });
}

export async function updateMeetingMinutes(
  meetingId: string,
  minutes: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const result = await db.runAsync(
    `
      UPDATE meetings
      SET
        minutes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    minutes.trim() || null,
    meetingId
  );

  if (result.changes === 0) {
    throw new Error(
      "MEETING_NOT_FOUND"
    );
  }

  await recordAppActivity({
    actionType:
      "meeting_minutes_updated",
    entityType: "meeting",
    entityId: meetingId,
    subject:
      await getMeetingAuditTitle(
        meetingId
      ),
    detail: "Meeting minutes updated",
  });
}

export async function getMeetingAttendance(
  meetingId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<MeetingAttendanceRow>(
      `
        SELECT
          id,
          meeting_id,
          attendee_name,
          attendee_role,
          attendance_status,
          created_by,
          created_at,
          updated_at
        FROM meeting_attendance
        WHERE meeting_id = ?
        ORDER BY
          attendee_name COLLATE NOCASE ASC,
          created_at ASC
      `,
      meetingId
    );

  return rows.map(
    mapAttendanceRow
  );
}

export async function addMeetingAttendance({
  meetingId,
  attendeeName,
  attendeeRole,
  attendanceStatus = "Present",
  createdBy,
}: {
  meetingId: string;
  attendeeName: string;
  attendeeRole?: string;
  attendanceStatus?: AttendanceStatus;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanName =
    attendeeName.trim();

  if (!cleanName) {
    throw new Error(
      "ATTENDEE_NAME_REQUIRED"
    );
  }

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO meeting_attendance (
        id,
        meeting_id,
        attendee_name,
        attendee_role,
        attendance_status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    id,
    meetingId,
    cleanName,
    attendeeRole?.trim() || null,
    attendanceStatus,
    createdBy?.trim() || null
  );

  await touchMeeting(meetingId);

  await recordAppActivity({
    actionType:
      "meeting_attendance_added",
    entityType:
      "meeting_attendance",
    entityId: id,
    subject: cleanName,
    detail:
      `${await getMeetingAuditTitle(
        meetingId
      )} • ${attendanceStatus}`,
    userId:
      createdBy?.trim() || null,
  });

  return id;
}

export async function updateMeetingAttendanceStatus(
  attendanceId: string,
  status: AttendanceStatus
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      meeting_id: string;
      attendee_name: string;
    }>(
      `
        SELECT
          meeting_id,
          attendee_name
        FROM meeting_attendance
        WHERE id = ?
        LIMIT 1
      `,
      attendanceId
    );

  if (!row) {
    throw new Error(
      "ATTENDANCE_NOT_FOUND"
    );
  }

  await db.runAsync(
    `
      UPDATE meeting_attendance
      SET
        attendance_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    status,
    attendanceId
  );

  await touchMeeting(
    row.meeting_id
  );

  await recordAppActivity({
    actionType:
      "meeting_attendance_updated",
    entityType:
      "meeting_attendance",
    entityId: attendanceId,
    subject:
      row.attendee_name,
    detail:
      `Attendance status: ${status}`,
  });
}

export async function deleteMeetingAttendance(
  attendanceId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      meeting_id: string;
      attendee_name: string;
    }>(
      `
        SELECT
          meeting_id,
          attendee_name
        FROM meeting_attendance
        WHERE id = ?
        LIMIT 1
      `,
      attendanceId
    );

  if (!row) {
    return;
  }

  await db.runAsync(
    `
      DELETE FROM meeting_attendance
      WHERE id = ?
    `,
    attendanceId
  );

  await touchMeeting(
    row.meeting_id
  );

  await recordAppActivity({
    actionType:
      "meeting_attendance_deleted",
    entityType:
      "meeting_attendance",
    entityId: attendanceId,
    subject:
      row.attendee_name,
    detail: "Meeting attendee removed",
  });
}

export async function getMeetingResolutions(
  meetingId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<MeetingResolutionRow>(
      `
        SELECT
          id,
          meeting_id,
          resolution_number,
          title,
          details,
          status,
          created_by,
          created_at,
          updated_at
        FROM meeting_resolutions
        WHERE meeting_id = ?
        ORDER BY
          created_at ASC
      `,
      meetingId
    );

  return rows.map(
    mapResolutionRow
  );
}

export async function addMeetingResolution({
  meetingId,
  resolutionNumber,
  title,
  details,
  status = "Draft",
  createdBy,
}: {
  meetingId: string;
  resolutionNumber?: string;
  title: string;
  details?: string;
  status?: ResolutionStatus;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle =
    title.trim();

  if (!cleanTitle) {
    throw new Error(
      "RESOLUTION_TITLE_REQUIRED"
    );
  }

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO meeting_resolutions (
        id,
        meeting_id,
        resolution_number,
        title,
        details,
        status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    meetingId,
    resolutionNumber?.trim() || null,
    cleanTitle,
    details?.trim() || null,
    status,
    createdBy?.trim() || null
  );

  await touchMeeting(meetingId);

  await recordAppActivity({
    actionType:
      "meeting_resolution_added",
    entityType:
      "meeting_resolution",
    entityId: id,
    subject: cleanTitle,
    detail:
      `${await getMeetingAuditTitle(
        meetingId
      )} • ${status}`,
    userId:
      createdBy?.trim() || null,
  });

  return id;
}

export async function updateMeetingResolutionStatus(
  resolutionId: string,
  status: ResolutionStatus
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      meeting_id: string;
      title: string;
    }>(
      `
        SELECT
          meeting_id,
          title
        FROM meeting_resolutions
        WHERE id = ?
        LIMIT 1
      `,
      resolutionId
    );

  if (!row) {
    throw new Error(
      "RESOLUTION_NOT_FOUND"
    );
  }

  await db.runAsync(
    `
      UPDATE meeting_resolutions
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    status,
    resolutionId
  );

  await touchMeeting(
    row.meeting_id
  );

  await recordAppActivity({
    actionType:
      "meeting_resolution_updated",
    entityType:
      "meeting_resolution",
    entityId: resolutionId,
    subject: row.title,
    detail:
      `Resolution status: ${status}`,
  });
}

export async function deleteMeetingResolution(
  resolutionId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      meeting_id: string;
      title: string;
    }>(
      `
        SELECT
          meeting_id,
          title
        FROM meeting_resolutions
        WHERE id = ?
        LIMIT 1
      `,
      resolutionId
    );

  if (!row) {
    return;
  }

  await db.runAsync(
    `
      DELETE FROM meeting_resolutions
      WHERE id = ?
    `,
    resolutionId
  );

  await touchMeeting(
    row.meeting_id
  );

  await recordAppActivity({
    actionType:
      "meeting_resolution_deleted",
    entityType:
      "meeting_resolution",
    entityId: resolutionId,
    subject: row.title,
    detail: "Meeting resolution removed",
  });
}

export async function getMeetingSectionSummary(
  meetingId: string
): Promise<MeetingSectionSummary> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const meeting =
    await db.getFirstAsync<{
      agenda: string | null;
      minutes: string | null;
    }>(
      `
        SELECT agenda, minutes
        FROM meetings
        WHERE id = ?
        LIMIT 1
      `,
      meetingId
    );

  if (!meeting) {
    throw new Error(
      "MEETING_NOT_FOUND"
    );
  }

  const attendance =
    await db.getFirstAsync<{
      total: number;
      present_count: number;
    }>(
      `
        SELECT
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN attendance_status = 'Present'
              THEN 1
              ELSE 0
            END
          ) AS present_count
        FROM meeting_attendance
        WHERE meeting_id = ?
      `,
      meetingId
    );

  const resolutions =
    await db.getFirstAsync<{
      total: number;
    }>(
      `
        SELECT COUNT(*) AS total
        FROM meeting_resolutions
        WHERE meeting_id = ?
      `,
      meetingId
    );

  return {
    hasAgenda:
      Boolean(
        meeting.agenda?.trim()
      ),
    attendanceCount:
      Number(
        attendance?.total || 0
      ),
    presentCount:
      Number(
        attendance?.present_count || 0
      ),
    hasMinutes:
      Boolean(
        meeting.minutes?.trim()
      ),
    resolutionCount:
      Number(
        resolutions?.total || 0
      ),
  };
}

