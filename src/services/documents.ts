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

export type DocumentType =
  | "Resolution"
  | "Purchase Request"
  | "Voucher"
  | "Liquidation Record"
  | "Other SK Document";

export type DocumentStatus =
  | "Draft"
  | "Final"
  | "Archived";

export type DocumentRecord = {
  id: string;
  documentType: DocumentType;
  documentNumber: string | null;
  documentDate: string;
  title: string;
  description: string | null;
  status: DocumentStatus;
  relatedProjectId: string | null;
  relatedProjectTitle: string | null;
  attachmentUri: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type DocumentRow = {
  id: string;
  document_type: string;
  document_number: string | null;
  document_date: string;
  title: string;
  description: string | null;
  status: string;
  related_project_id: string | null;
  related_project_title: string | null;
  attachment_uri: string | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};


export type CreateDocumentInput = {
  documentType: DocumentType;
  documentNumber?: string;
  documentDate: string;
  title: string;
  description?: string;
  status?: DocumentStatus;
  relatedProjectId?: string;
  attachmentUri?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  createdBy?: string;
};

function normalizeDocumentType(
  value: string
): DocumentType {
  switch (value) {
    case "Resolution":
    case "Purchase Request":
    case "Voucher":
    case "Liquidation Record":
      return value;
    default:
      return "Other SK Document";
  }
}

function normalizeDocumentStatus(
  value: string
): DocumentStatus {
  switch (value) {
    case "Final":
    case "Archived":
      return value;
    default:
      return "Draft";
  }
}

function mapDocumentRow(
  row: DocumentRow
): DocumentRecord {
  return {
    id: row.id,
    documentType:
      normalizeDocumentType(
        row.document_type
      ),
    documentNumber:
      row.document_number,
    documentDate:
      row.document_date,
    title: row.title,
    description:
      row.description,
    status:
      normalizeDocumentStatus(
        row.status
      ),
    relatedProjectId:
      row.related_project_id,
    relatedProjectTitle:
      row.related_project_title,
    attachmentUri:
      row.attachment_uri,
    attachmentName:
      row.attachment_name,
    attachmentMimeType:
      row.attachment_mime_type,
    createdBy:
      row.created_by,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}

export async function getDocumentsList() {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<DocumentRow>(
      `
        SELECT
          d.id,
          d.document_type,
          d.document_number,
          d.document_date,
          d.title,
          d.description,
          d.status,
          d.related_project_id,
          p.title AS related_project_title,
          d.attachment_uri,
          d.attachment_name,
          d.attachment_mime_type,
          d.created_by,
          d.created_at,
          d.updated_at
        FROM documents d
        LEFT JOIN projects p
          ON p.id = d.related_project_id
        ORDER BY
          d.document_date DESC,
          d.created_at DESC
      `
    );

  return rows.map(
    mapDocumentRow
  );
}

export async function getDocumentById(
  documentId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<DocumentRow>(
      `
        SELECT
          d.id,
          d.document_type,
          d.document_number,
          d.document_date,
          d.title,
          d.description,
          d.status,
          d.related_project_id,
          p.title AS related_project_title,
          d.attachment_uri,
          d.attachment_name,
          d.attachment_mime_type,
          d.created_by,
          d.created_at,
          d.updated_at
        FROM documents d
        LEFT JOIN projects p
          ON p.id = d.related_project_id
        WHERE d.id = ?
        LIMIT 1
      `,
      documentId
    );

  return row
    ? mapDocumentRow(row)
    : null;
}

function validateDocumentDate(
  value: string
) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    throw new Error(
      "INVALID_DOCUMENT_DATE"
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

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
      "INVALID_DOCUMENT_DATE"
    );
  }

  return value;
}

export async function createDocument({
  documentType,
  documentNumber,
  documentDate,
  title,
  description,
  status = "Draft",
  relatedProjectId,
  attachmentUri,
  attachmentName,
  attachmentMimeType,
  createdBy,
}: CreateDocumentInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle =
    title.trim();

  if (!cleanTitle) {
    throw new Error(
      "DOCUMENT_TITLE_REQUIRED"
    );
  }

  const cleanDate =
    validateDocumentDate(
      documentDate
    );

  const id = Crypto.randomUUID();

  await db.runAsync(
    `
      INSERT INTO documents (
        id,
        document_type,
        document_number,
        document_date,
        title,
        description,
        status,
        related_project_id,
        attachment_uri,
        attachment_name,
        attachment_mime_type,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    documentType,
    documentNumber?.trim() || null,
    cleanDate,
    cleanTitle,
    description?.trim() || null,
    status,
    relatedProjectId?.trim() || null,
    attachmentUri?.trim() || null,
    attachmentName?.trim() || null,
    attachmentMimeType?.trim() || null,
    createdBy?.trim() || null
  );

  await recordAppActivity({
    actionType: "document_created",
    entityType: "document",
    entityId: id,
    subject: cleanTitle,
    detail:
      `${documentType} • ${status}`,
    userId:
      createdBy?.trim() || null,
  });

  return id;
}

export type UpdateDocumentInput = {
  documentId: string;
  documentType: DocumentType;
  documentNumber?: string;
  documentDate: string;
  title: string;
  description?: string;
  status: DocumentStatus;
  relatedProjectId?: string;
};

export async function updateDocument({
  documentId,
  documentType,
  documentNumber,
  documentDate,
  title,
  description,
  status,
  relatedProjectId,
}: UpdateDocumentInput) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const cleanTitle =
    title.trim();

  if (!cleanTitle) {
    throw new Error(
      "DOCUMENT_TITLE_REQUIRED"
    );
  }

  const cleanDate =
    validateDocumentDate(
      documentDate
    );

  const result =
    await db.runAsync(
      `
        UPDATE documents
        SET
          document_type = ?,
          document_number = ?,
          document_date = ?,
          title = ?,
          description = ?,
          status = ?,
          related_project_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      documentType,
      documentNumber?.trim() || null,
      cleanDate,
      cleanTitle,
      description?.trim() || null,
      status,
      relatedProjectId?.trim() || null,
      documentId
    );

  if (result.changes === 0) {
    throw new Error(
      "DOCUMENT_NOT_FOUND"
    );
  }

  await recordAppActivity({
    actionType: "document_updated",
    entityType: "document",
    entityId: documentId,
    subject: cleanTitle,
    detail:
      `${documentType} • ${status}`,
  });
}

export async function updateDocumentAttachment({
  documentId,
  attachmentUri,
  attachmentName,
  attachmentMimeType,
}: {
  documentId: string;
  attachmentUri: string;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
}) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const document =
    await db.getFirstAsync<{
      title: string;
    }>(
      `
        SELECT title
        FROM documents
        WHERE id = ?
        LIMIT 1
      `,
      documentId
    );

  const result =
    await db.runAsync(
      `
        UPDATE documents
        SET
          attachment_uri = ?,
          attachment_name = ?,
          attachment_mime_type = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      attachmentUri,
      attachmentName?.trim() || null,
      attachmentMimeType?.trim() || null,
      documentId
    );

  if (result.changes === 0) {
    throw new Error(
      "DOCUMENT_NOT_FOUND"
    );
  }

  await recordAppActivity({
    actionType:
      "document_attachment_attached",
    entityType: "document",
    entityId: documentId,
    subject:
      document?.title || "Document",
    detail:
      attachmentName?.trim()
        ? `Attachment: ${attachmentName.trim()}`
        : "Document attachment updated",
  });
}

export async function clearDocumentAttachment(
  documentId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const document =
    await db.getFirstAsync<{
      title: string;
    }>(
      `
        SELECT title
        FROM documents
        WHERE id = ?
        LIMIT 1
      `,
      documentId
    );

  const result =
    await db.runAsync(
      `
        UPDATE documents
        SET
          attachment_uri = NULL,
          attachment_name = NULL,
          attachment_mime_type = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      documentId
    );

  if (result.changes === 0) {
    throw new Error(
      "DOCUMENT_NOT_FOUND"
    );
  }

  await recordAppActivity({
    actionType:
      "document_attachment_removed",
    entityType: "document",
    entityId: documentId,
    subject:
      document?.title || "Document",
    detail: "Document attachment removed",
  });
}

export async function deleteDocument(
  documentId: string
) {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const document =
    await db.getFirstAsync<{
      title: string;
    }>(
      `
        SELECT title
        FROM documents
        WHERE id = ?
        LIMIT 1
      `,
      documentId
    );

  const result =
    await db.runAsync(
      `
        DELETE FROM documents
        WHERE id = ?
      `,
      documentId
    );

  if (result.changes === 0) {
    throw new Error(
      "DOCUMENT_NOT_FOUND"
    );
  }

  await recordAppActivity({
    actionType: "document_deleted",
    entityType: "document",
    entityId: documentId,
    subject:
      document?.title || "Document",
    detail: "Document deleted",
  });
}

