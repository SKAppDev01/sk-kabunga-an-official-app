import * as Crypto from "expo-crypto";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  recordAppActivity,
} from "./app-activity";
import { requireOfficialAccess } from "./access";

export type ProjectParticipant = {
  id: string;
  projectId: string;
  youthId: string | null;
  participantName: string;
  participantRole: string | null;
  contactNumber: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
};

type ParticipantRow = {
  id: string;
  project_id: string;
  youth_id: string | null;
  participant_name: string;
  participant_role: string | null;
  contact_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

function mapRow(row: ParticipantRow): ProjectParticipant {
  return {
    id: row.id,
    projectId: row.project_id,
    youthId: row.youth_id,
    participantName: row.participant_name,
    participantRole: row.participant_role,
    contactNumber: row.contact_number,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function createProjectParticipant(input: {
  projectId: string;
  participantName: string;
  participantRole?: string;
  contactNumber?: string;
  notes?: string;
  createdBy?: string;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const name = input.participantName.trim();

  if (!name) {
    throw new Error("PARTICIPANT_NAME_REQUIRED");
  }

  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO project_participants (
      id,
      project_id,
      youth_id,
      participant_name,
      participant_role,
      contact_number,
      notes,
      created_by
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
    id,
    input.projectId,
    name,
    input.participantRole?.trim() || null,
    input.contactNumber?.trim() || null,
    input.notes?.trim() || null,
    input.createdBy || null
  );

  await recordAppActivity({
    actionType: "project_participant_added",
    entityType: "project_participant",
    entityId: id,
    subject: name,
    detail: input.participantRole?.trim()
      ? `Added as ${input.participantRole.trim()}`
      : "Added to project participants",
    userId: input.createdBy || null,
  });

  return id;
}

export async function getProjectParticipants(
  projectId: string
): Promise<ProjectParticipant[]> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows = await db.getAllAsync<ParticipantRow>(
    `SELECT
      id,
      project_id,
      youth_id,
      participant_name,
      participant_role,
      contact_number,
      notes,
      created_by,
      created_at
    FROM project_participants
    WHERE project_id = ?
    ORDER BY participant_name COLLATE NOCASE ASC`,
    projectId
  );

  return rows.map(mapRow);
}

export async function getProjectParticipantCount(
  projectId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM project_participants
     WHERE project_id = ?`,
    projectId
  );

  return Number(row?.count) || 0;
}

export async function removeProjectParticipant(
  participantId: string,
  removedBy?: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const participant = await db.getFirstAsync<ParticipantRow>(
    `SELECT
      id,
      project_id,
      youth_id,
      participant_name,
      participant_role,
      contact_number,
      notes,
      created_by,
      created_at
    FROM project_participants
    WHERE id = ?
    LIMIT 1`,
    participantId
  );

  if (!participant) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  const result = await db.runAsync(
    `DELETE FROM project_participants WHERE id = ?`,
    participantId
  );

  if (result.changes === 0) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  await recordAppActivity({
    actionType: "project_participant_removed",
    entityType: "project_participant",
    entityId: participantId,
    subject: participant.participant_name,
    detail: "Removed from project participants",
    userId: removedBy || null,
  });
}
