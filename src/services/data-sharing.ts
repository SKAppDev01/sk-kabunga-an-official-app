import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  addTransferHistory,
  TransferChannel,
} from "./data-transfer-history";

export const DATA_PACKAGE_VERSION = 1;

export const DATA_PACKAGE_KIND =
  "SKK_DATA_V1";

export const SK_ORGANIZATION_ID =
  "sk-kabunga-an";

export type DataTransferKind =
  "export";

export type DataTransferAudience =
  "officials";

export type DataTableName =
  | "projects"
  | "project_participants"
  | "budget_categories"
  | "budget_allocations"
  | "expenses"
  | "youth"
  | "meetings"
  | "meeting_attendance"
  | "meeting_resolutions"
  | "activities"
  | "activity_participants"
  | "inventory_items"
  | "inventory_history"
  | "documents";

export type DataPackageManifest = {
  packageVersion: number;
  packageId: string;
  kind: DataTransferKind;
  audience: DataTransferAudience;
  organizationId: string;
  generatedAt: string;
  generatedByRole: string;
  recordCount: number;
};

export type DataPackage = {
  kind: typeof DATA_PACKAGE_KIND;
  manifest: DataPackageManifest;
  data: Record<
    DataTableName,
    Record<string, unknown>[]
  >;
};

export type ExportTableSummary = {
  table: DataTableName;
  label: string;
  count: number;
};

export type ExportSummary = {
  totalRecords: number;
  tables: ExportTableSummary[];
};

export type ImportTablePreview = {
  table: DataTableName;
  label: string;
  total: number;
  newRecords: number;
  duplicateRecords: number;
  conflictingRecords: number;
};

export type DataImportPreview = {
  packageId: string;
  generatedAt: string;
  generatedByRole: string;
  recordCount: number;
  newRecords: number;
  duplicateRecords: number;
  conflictingRecords: number;
  alreadyImported: boolean;
  tables: ImportTablePreview[];
};

export type DataImportResult = {
  importedRecords: number;
  duplicateRecords: number;
  conflictingRecords: number;
  failedRecords: number;
};

type TableConfig = {
  table: DataTableName;
  label: string;
  columns: string[];
};

const TABLES: TableConfig[] = [
  {
    table: "projects",
    label: "Projects",
    columns: [
      "id",
      "title",
      "description",
      "status",
      "budget",
      "start_date",
      "end_date",
      "is_archived",
      "archived_at",
      "is_youth_visible",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "youth",
    label: "Youth Registry",
    columns: [
      "id",
      "profile_id",
      "full_name",
      "birthday",
      "sex",
      "purok_sitio",
      "contact_number",
      "education",
      "employment_status",
      "youth_classification",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "budget_categories",
    label: "Budget Categories",
    columns: [
      "id",
      "name",
      "description",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "activities",
    label: "Activities",
    columns: [
      "id",
      "title",
      "activity_date",
      "activity_time",
      "location",
      "status",
      "description",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "meetings",
    label: "Meetings",
    columns: [
      "id",
      "title",
      "meeting_date",
      "meeting_time",
      "location",
      "status",
      "agenda",
      "minutes",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "inventory_items",
    label: "Inventory Items",
    columns: [
      "id",
      "item_name",
      "description",
      "quantity",
      "available_quantity",
      "condition",
      "status",
      "notes",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "project_participants",
    label: "Project Participants",
    columns: [
      "id",
      "project_id",
      "youth_id",
      "participant_name",
      "participant_role",
      "contact_number",
      "notes",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "budget_allocations",
    label: "Budget Allocations",
    columns: [
      "id",
      "category_id",
      "project_id",
      "title",
      "amount",
      "fiscal_year",
      "notes",
      "is_youth_visible",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "expenses",
    label: "Expenses",
    columns: [
      "id",
      "title",
      "amount",
      "expense_date",
      "category_id",
      "project_id",
      "activity_id",
      "notes",
      "is_youth_visible",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "meeting_attendance",
    label: "Meeting Attendance",
    columns: [
      "id",
      "meeting_id",
      "youth_id",
      "attendee_name",
      "attendee_role",
      "attendance_status",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "meeting_resolutions",
    label: "Meeting Resolutions",
    columns: [
      "id",
      "meeting_id",
      "resolution_number",
      "title",
      "details",
      "status",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "activity_participants",
    label: "Activity Participants",
    columns: [
      "id",
      "activity_id",
      "youth_id",
      "participant_name",
      "contact_number",
      "notes",
      "attendance_status",
      "created_at",
      "updated_at",
    ],
  },
  {
    table: "inventory_history",
    label: "Inventory History",
    columns: [
      "id",
      "item_id",
      "action_type",
      "quantity",
      "borrower_name",
      "contact_number",
      "due_date",
      "related_history_id",
      "details",
      "returned_quantity",
      "created_at",
    ],
  },
  {
    table: "documents",
    label: "Documents",
    columns: [
      "id",
      "document_type",
      "document_number",
      "document_date",
      "title",
      "description",
      "status",
      "related_project_id",
      "attachment_name",
      "attachment_mime_type",
      "created_at",
      "updated_at",
    ],
  },
];

const TABLE_MAP =
  new Map(
    TABLES.map(
      (config) => [
        config.table,
        config,
      ]
    )
  );

const OFFICIAL_ROLES =
  new Set([
    "Chairperson",
    "Secretary",
    "Treasurer",
    "Kagawad",
  ]);

function normalizeOfficialRole(
  role: string | null
) {
  if (!role) {
    return null;
  }

  const normalized =
    role
      .replace(/^SK\s+/i, "")
      .trim();

  return OFFICIAL_ROLES.has(
    normalized
  )
    ? normalized
    : null;
}

async function getVerifiedOfficial() {
  await initializeDatabase();
  const db = await getDatabase();

  const user =
    await db.getFirstAsync<{
      id: string;
      role: string | null;
      authorization_level: string;
    }>(
      `
        SELECT
          u.id,
          u.role,
          u.authorization_level
        FROM app_session s
        INNER JOIN users u
          ON u.id = s.user_id
        WHERE s.id = 1
          AND u.is_active = 1
        LIMIT 1
      `
    );

  const normalizedRole =
    normalizeOfficialRole(
      user?.role || null
    );

  if (
    !user ||
    !normalizedRole ||
    user.authorization_level !==
      "verified_official"
  ) {
    throw new Error(
      "VERIFIED_OFFICIAL_REQUIRED"
    );
  }

  return {
    id: user.id,
    role: normalizedRole,
  };
}

function stableNormalize(
  value: unknown
): unknown {
  if (Array.isArray(value)) {
    return value.map(
      stableNormalize
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const source =
      value as Record<
        string,
        unknown
      >;

    const result: Record<
      string,
      unknown
    > = {};

    Object.keys(source)
      .sort()
      .forEach((key) => {
        result[key] =
          stableNormalize(
            source[key]
          );
      });

    return result;
  }

  return value;
}

function stableStringify(
  value: unknown
) {
  return JSON.stringify(
    stableNormalize(value)
  );
}

function getSafePackageFileName() {
  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  return (
    `SK-Kabunga-an-Export-` +
    `${timestamp}.skdata`
  );
}

function assertPackageShape(
  value: unknown
): DataPackage {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "INVALID_DATA_PACKAGE"
    );
  }

  const packageValue =
    value as Partial<DataPackage>;

  if (
    packageValue.kind !==
      DATA_PACKAGE_KIND ||
    !packageValue.manifest ||
    !packageValue.data
  ) {
    throw new Error(
      "INVALID_DATA_PACKAGE"
    );
  }

  const manifest =
    packageValue.manifest;

  if (
    manifest.packageVersion !==
      DATA_PACKAGE_VERSION ||
    manifest.kind !== "export" ||
    manifest.audience !==
      "officials" ||
    manifest.organizationId !==
      SK_ORGANIZATION_ID ||
    !manifest.packageId ||
    !manifest.generatedAt
  ) {
    throw new Error(
      "INVALID_DATA_PACKAGE"
    );
  }

  for (const config of TABLES) {
    const rows =
      packageValue.data[
        config.table
      ];

    if (!Array.isArray(rows)) {
      throw new Error(
        "INVALID_DATA_PACKAGE"
      );
    }

    for (const row of rows) {
      if (
        !row ||
        typeof row !==
          "object" ||
        typeof (
          row as Record<
            string,
            unknown
          >
        ).id !== "string"
      ) {
        throw new Error(
          "INVALID_DATA_PACKAGE"
        );
      }
    }
  }

  return packageValue as DataPackage;
}

async function exportTable(
  table: DataTableName,
  columns: string[]
) {
  const db = await getDatabase();

  const columnSql =
    columns.join(", ");

  return db.getAllAsync<
    Record<string, unknown>
  >(
    `
      SELECT ${columnSql}
      FROM ${table}
      ORDER BY created_at ASC
    `
  );
}

export async function getDataExportSummary():
  Promise<ExportSummary> {
  await getVerifiedOfficial();

  const db = await getDatabase();

  const tables:
    ExportTableSummary[] = [];

  let totalRecords = 0;

  for (const config of TABLES) {
    const row =
      await db.getFirstAsync<{
        count: number;
      }>(
        `
          SELECT COUNT(*) AS count
          FROM ${config.table}
        `
      );

    const count =
      Number(
        row?.count
      ) || 0;

    tables.push({
      table: config.table,
      label: config.label,
      count,
    });

    totalRecords += count;
  }

  return {
    totalRecords,
    tables,
  };
}

export async function createDataExportPackage():
  Promise<DataPackage> {
  const official =
    await getVerifiedOfficial();

  const data =
    {} as Record<
      DataTableName,
      Record<string, unknown>[]
    >;

  let recordCount = 0;

  for (const config of TABLES) {
    const rows =
      await exportTable(
        config.table,
        config.columns
      );

    data[config.table] =
      rows;

    recordCount +=
      rows.length;
  }

  return {
    kind: DATA_PACKAGE_KIND,
    manifest: {
      packageVersion:
        DATA_PACKAGE_VERSION,
      packageId:
        Crypto.randomUUID(),
      kind: "export",
      audience: "officials",
      organizationId:
        SK_ORGANIZATION_ID,
      generatedAt:
        new Date()
          .toISOString(),
      generatedByRole:
        official.role,
      recordCount,
    },
    data,
  };
}

export async function saveDataExportPackage(
  dataPackage: DataPackage
) {
  const permission =
    await FileSystem
      .StorageAccessFramework
      .requestDirectoryPermissionsAsync();

  const fileName =
    getSafePackageFileName();

  if (!permission.granted) {
    return {
      saved: false as const,
      fileName,
    };
  }

  const destination =
    await FileSystem
      .StorageAccessFramework
      .createFileAsync(
        permission.directoryUri,
        fileName,
        "application/json"
      );

  await FileSystem
    .writeAsStringAsync(
      destination,
      JSON.stringify(
        dataPackage
      ),
      {
        encoding:
          FileSystem
            .EncodingType
            .UTF8,
      }
    );

  await addTransferHistory({
    transferType: "export",
    direction: "outgoing",
    channel: "file",
    audience: "officials",
    packageId:
      dataPackage.manifest.packageId,
    recordCount:
      dataPackage.manifest.recordCount,
    detail:
      `Saved ${fileName}`,
  });

  return {
    saved: true as const,
    fileName,
    uri: destination,
  };
}

export async function shareDataExportPackage(
  dataPackage: DataPackage
) {
  const canShare =
    await Sharing
      .isAvailableAsync();

  if (!canShare) {
    throw new Error(
      "SHARING_NOT_AVAILABLE"
    );
  }

  if (
    !FileSystem.cacheDirectory
  ) {
    throw new Error(
      "CACHE_DIRECTORY_UNAVAILABLE"
    );
  }

  const fileName =
    getSafePackageFileName();

  const uri =
    FileSystem.cacheDirectory +
    fileName;

  await FileSystem
    .writeAsStringAsync(
      uri,
      JSON.stringify(
        dataPackage
      ),
      {
        encoding:
          FileSystem
            .EncodingType
            .UTF8,
      }
    );

  try {
    await Sharing.shareAsync(
      uri,
      {
        mimeType:
          "application/json",
        dialogTitle:
          "Share SK Data Export",
      }
    );

    await addTransferHistory({
      transferType: "export",
      direction: "outgoing",
      channel: "share",
      audience: "officials",
      packageId:
        dataPackage.manifest.packageId,
      recordCount:
        dataPackage.manifest.recordCount,
      detail:
        "Android share sheet opened for .skdata export",
    });
  } finally {
    await FileSystem
      .deleteAsync(
        uri,
        {
          idempotent: true,
        }
      )
      .catch(() => {});
  }
}

export async function pickDataImportPackage() {
  await getVerifiedOfficial();

  const result =
    await DocumentPicker
      .getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

  if (
    result.canceled ||
    !result.assets?.[0]
  ) {
    return null;
  }

  const asset =
    result.assets[0];

  const raw =
    await FileSystem
      .readAsStringAsync(
        asset.uri,
        {
          encoding:
            FileSystem
              .EncodingType
              .UTF8,
        }
      );

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(raw);
  } catch {
    throw new Error(
      "INVALID_DATA_PACKAGE"
    );
  }

  const dataPackage =
    assertPackageShape(
      parsed
    );

  const countedRecords =
    TABLES.reduce(
      (total, config) =>
        total +
        dataPackage.data[
          config.table
        ].length,
      0
    );

  if (
    countedRecords !==
    dataPackage.manifest
      .recordCount
  ) {
    throw new Error(
      "INVALID_DATA_PACKAGE"
    );
  }

  return {
    fileName:
      asset.name ||
      "SK data package",
    dataPackage,
  };
}

async function getLocalRowById(
  config: TableConfig,
  id: string
) {
  const db = await getDatabase();

  const columnSql =
    config.columns.join(", ");

  return db.getFirstAsync<
    Record<string, unknown>
  >(
    `
      SELECT ${columnSql}
      FROM ${config.table}
      WHERE id = ?
      LIMIT 1
    `,
    id
  );
}

async function findLocalBudgetCategoryByName(
  name: string
) {
  const db = await getDatabase();

  return db.getFirstAsync<{
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `
      SELECT
        id,
        name,
        description,
        created_at,
        updated_at
      FROM budget_categories
      WHERE name = ?
        COLLATE NOCASE
      LIMIT 1
    `,
    name
  );
}

async function isPackageAlreadyImported(
  packageId: string
) {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<{
      value: string | null;
    }>(
      `
        SELECT value
        FROM app_metadata
        WHERE key = ?
        LIMIT 1
      `,
      `imported_data_package:${packageId}`
    );

  return Boolean(row);
}

export async function previewDataImport(
  dataPackage: DataPackage
): Promise<DataImportPreview> {
  await getVerifiedOfficial();

  assertPackageShape(
    dataPackage
  );

  const tables:
    ImportTablePreview[] = [];

  let newRecords = 0;
  let duplicateRecords = 0;
  let conflictingRecords = 0;

  for (const config of TABLES) {
    const packageRows =
      dataPackage.data[
        config.table
      ];

    let tableNew = 0;
    let tableDuplicate = 0;
    let tableConflict = 0;

    for (const packageRow of packageRows) {
      const id =
        String(
          packageRow.id
        );

      const localRow =
        await getLocalRowById(
          config,
          id
        );

      if (localRow) {
        if (
          stableStringify(
            localRow
          ) ===
          stableStringify(
            getRowForInsert(
              config,
              packageRow,
              new Map()
            )
          )
        ) {
          tableDuplicate += 1;
        } else {
          tableConflict += 1;
        }

        continue;
      }

      if (
        config.table ===
          "budget_categories" &&
        typeof packageRow.name ===
          "string"
      ) {
        const categoryByName =
          await findLocalBudgetCategoryByName(
            packageRow.name
          );

        if (categoryByName) {
          tableDuplicate += 1;
          continue;
        }
      }

      tableNew += 1;
    }

    tables.push({
      table: config.table,
      label: config.label,
      total:
        packageRows.length,
      newRecords:
        tableNew,
      duplicateRecords:
        tableDuplicate,
      conflictingRecords:
        tableConflict,
    });

    newRecords +=
      tableNew;

    duplicateRecords +=
      tableDuplicate;

    conflictingRecords +=
      tableConflict;
  }

  return {
    packageId:
      dataPackage.manifest
        .packageId,
    generatedAt:
      dataPackage.manifest
        .generatedAt,
    generatedByRole:
      dataPackage.manifest
        .generatedByRole,
    recordCount:
      dataPackage.manifest
        .recordCount,
    newRecords,
    duplicateRecords,
    conflictingRecords,
    alreadyImported:
      await isPackageAlreadyImported(
        dataPackage.manifest
          .packageId
      ),
    tables,
  };
}

function getRowForInsert(
  config: TableConfig,
  packageRow:
    Record<string, unknown>,
  categoryIdMap:
    Map<string, string>
) {
  const row:
    Record<string, unknown> =
      {};

  for (const column of config.columns) {
    let value =
      packageRow[column];

    if (
      column ===
        "category_id" &&
      typeof value === "string"
    ) {
      value =
        categoryIdMap.get(
          value
        ) || value;
    }

    row[column] =
      value ?? null;
  }

  return row;
}

async function insertRow(
  config: TableConfig,
  row:
    Record<string, unknown>
) {
  const db = await getDatabase();

  const columns =
    config.columns;

  const placeholders =
    columns
      .map(() => "?")
      .join(", ");

  const values =
    columns.map(
      (column) =>
        row[column] ?? null
    );

  await db.runAsync(
    `
      INSERT INTO ${config.table} (
        ${columns.join(", ")}
      )
      VALUES (${placeholders})
    `,
    ...(values as any[])
  );
}

async function buildBudgetCategoryIdMap(
  dataPackage: DataPackage
) {
  const map =
    new Map<
      string,
      string
    >();

  for (
    const packageRow of
      dataPackage.data
        .budget_categories
  ) {
    const importedId =
      String(
        packageRow.id
      );

    const byId =
      await getLocalRowById(
        TABLE_MAP.get(
          "budget_categories"
        )!,
        importedId
      );

    if (byId) {
      map.set(
        importedId,
        importedId
      );
      continue;
    }

    if (
      typeof packageRow.name ===
        "string"
    ) {
      const byName =
        await findLocalBudgetCategoryByName(
          packageRow.name
        );

      if (byName) {
        map.set(
          importedId,
          byName.id
        );
        continue;
      }
    }

    map.set(
      importedId,
      importedId
    );
  }

  return map;
}

export async function importNewDataRecords(
  dataPackage: DataPackage,
  sourceChannel: TransferChannel = "file"
): Promise<DataImportResult> {
  const official =
    await getVerifiedOfficial();

  assertPackageShape(
    dataPackage
  );

  const preview =
    await previewDataImport(
      dataPackage
    );

  const categoryIdMap =
    await buildBudgetCategoryIdMap(
      dataPackage
    );

  const db = await getDatabase();

  let importedRecords = 0;
  let duplicateRecords = 0;
  let conflictingRecords = 0;
  let failedRecords = 0;

  await db.withTransactionAsync(
    async () => {
      for (const config of TABLES) {
        const packageRows =
          dataPackage.data[
            config.table
          ];

        for (const packageRow of packageRows) {
          const importedId =
            String(
              packageRow.id
            );

          const localRow =
            await getLocalRowById(
              config,
              importedId
            );

          if (localRow) {
            if (
              stableStringify(
                localRow
              ) ===
              stableStringify(
                packageRow
              )
            ) {
              duplicateRecords += 1;
            } else {
              conflictingRecords += 1;
            }

            continue;
          }

          if (
            config.table ===
              "budget_categories" &&
            typeof packageRow.name ===
              "string"
          ) {
            const categoryByName =
              await findLocalBudgetCategoryByName(
                packageRow.name
              );

            if (categoryByName) {
              duplicateRecords += 1;

              categoryIdMap.set(
                importedId,
                categoryByName.id
              );

              continue;
            }
          }

          try {
            const row =
              getRowForInsert(
                config,
                packageRow,
                categoryIdMap
              );

            await insertRow(
              config,
              row
            );

            importedRecords += 1;
          } catch (error) {
            console.error(
              `Import failed for ${config.table} ${importedId}:`,
              error
            );

            failedRecords += 1;
          }
        }
      }

      await db.runAsync(
        `
          INSERT INTO app_metadata (
            key,
            value
          )
          VALUES (?, ?)

          ON CONFLICT(key)
          DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
        `,
        `imported_data_package:${dataPackage.manifest.packageId}`,
        JSON.stringify({
          importedAt:
            new Date()
              .toISOString(),
          importedByUserId:
            official.id,
          importedRecords,
          conflicts:
            conflictingRecords,
          failedRecords,
        })
      );
    }
  );

  const finalDuplicateRecords =
    Math.max(
      duplicateRecords,
      preview.duplicateRecords
    );

  const finalConflictingRecords =
    Math.max(
      conflictingRecords,
      preview.conflictingRecords
    );

  await addTransferHistory({
    transferType: "import",
    direction: "incoming",
    channel: sourceChannel,
    audience: "officials",
    packageId:
      dataPackage.manifest.packageId,
    recordCount: importedRecords,
    detail:
      `${importedRecords} imported • ` +
      `${finalDuplicateRecords} duplicate • ` +
      `${finalConflictingRecords} conflict • ` +
      `${failedRecords} failed`,
  });

  return {
    importedRecords,
    duplicateRecords:
      finalDuplicateRecords,
    conflictingRecords:
      finalConflictingRecords,
    failedRecords,
  };
}


/* ------------------------------------------------------------------
   DEVICE DATABASE BACKUP + RESTORE
   ------------------------------------------------------------------ */

export const BACKUP_PACKAGE_VERSION = 1;

export const BACKUP_PACKAGE_KIND =
  "SKK_BACKUP_V1";

export type BackupTableSnapshot = {
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

export type BackupSnapshot = {
  tables: BackupTableSnapshot[];
};

export type BackupPackageManifest = {
  packageVersion: number;
  packageId: string;
  organizationId: string;
  generatedAt: string;
  generatedByRole: string;
  tableCount: number;
  recordCount: number;
  checksumSha256: string;
};

export type BackupPackage = {
  kind: typeof BACKUP_PACKAGE_KIND;
  manifest: BackupPackageManifest;
  snapshot: BackupSnapshot;
};

export type BackupTableSummary = {
  name: string;
  count: number;
};

export type BackupSummary = {
  tableCount: number;
  recordCount: number;
  tables: BackupTableSummary[];
};

export type RestorePreview = {
  packageId: string;
  generatedAt: string;
  generatedByRole: string;
  tableCount: number;
  recordCount: number;
  tables: BackupTableSummary[];
};

export type RestoreResult = {
  restoredTables: number;
  restoredRecords: number;
};

type SqliteTableInfoRow = {
  name: string;
};

type SqliteColumnInfoRow = {
  name: string;
};

const BACKUP_EXCLUDED_TABLES =
  new Set([
    "app_session",
    "data_transfer_history",
  ]);

function quoteSqlIdentifier(
  value: string
) {
  return (
    '"' +
    value.replace(
      /"/g,
      '""'
    ) +
    '"'
  );
}

async function getBackupTableNames() {
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<
      SqliteTableInfoRow
    >(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name ASC
      `
    );

  return rows
    .map((row) => row.name)
    .filter(
      (name) =>
        !BACKUP_EXCLUDED_TABLES.has(
          name
        )
    );
}

async function getTableColumns(
  tableName: string
) {
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<
      SqliteColumnInfoRow
    >(
      `PRAGMA table_info(${quoteSqlIdentifier(
        tableName
      )})`
    );

  return rows.map(
    (row) => row.name
  );
}

async function createBackupSnapshot():
  Promise<BackupSnapshot> {
  await getVerifiedOfficial();

  const db = await getDatabase();

  const tableNames =
    await getBackupTableNames();

  const tables:
    BackupTableSnapshot[] = [];

  for (const tableName of tableNames) {
    const columns =
      await getTableColumns(
        tableName
      );

    const rows =
      await db.getAllAsync<
        Record<string, unknown>
      >(
        `
          SELECT *
          FROM ${quoteSqlIdentifier(
            tableName
          )}
        `
      );

    tables.push({
      name: tableName,
      columns,
      rows,
    });
  }

  return {
    tables,
  };
}

async function getSnapshotChecksum(
  snapshot: BackupSnapshot
) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm
      .SHA256,
    stableStringify(snapshot)
  );
}

function getSafeBackupFileName() {
  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  return (
    `SK-Kabunga-an-Backup-` +
    `${timestamp}.skbackup`
  );
}

function assertBackupPackageShape(
  value: unknown
): BackupPackage {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "INVALID_BACKUP_PACKAGE"
    );
  }

  const backup =
    value as Partial<BackupPackage>;

  if (
    backup.kind !==
      BACKUP_PACKAGE_KIND ||
    !backup.manifest ||
    !backup.snapshot ||
    !Array.isArray(
      backup.snapshot.tables
    )
  ) {
    throw new Error(
      "INVALID_BACKUP_PACKAGE"
    );
  }

  if (
    backup.manifest
      .packageVersion !==
      BACKUP_PACKAGE_VERSION ||
    backup.manifest
      .organizationId !==
      SK_ORGANIZATION_ID ||
    !backup.manifest
      .packageId ||
    !backup.manifest
      .generatedAt ||
    !backup.manifest
      .checksumSha256
  ) {
    throw new Error(
      "INVALID_BACKUP_PACKAGE"
    );
  }

  for (
    const table of
      backup.snapshot.tables
  ) {
    if (
      !table ||
      typeof table.name !==
        "string" ||
      !Array.isArray(
        table.columns
      ) ||
      !Array.isArray(
        table.rows
      )
    ) {
      throw new Error(
        "INVALID_BACKUP_PACKAGE"
      );
    }
  }

  return backup as BackupPackage;
}

export async function getBackupSummary():
  Promise<BackupSummary> {
  await getVerifiedOfficial();

  const db = await getDatabase();

  const tableNames =
    await getBackupTableNames();

  const tables:
    BackupTableSummary[] = [];

  let recordCount = 0;

  for (const tableName of tableNames) {
    const result =
      await db.getFirstAsync<{
        count: number;
      }>(
        `
          SELECT COUNT(*) AS count
          FROM ${quoteSqlIdentifier(
            tableName
          )}
        `
      );

    const count =
      Number(
        result?.count
      ) || 0;

    tables.push({
      name: tableName,
      count,
    });

    recordCount += count;
  }

  return {
    tableCount:
      tables.length,
    recordCount,
    tables,
  };
}

export async function createBackupPackage():
  Promise<BackupPackage> {
  const official =
    await getVerifiedOfficial();

  const snapshot =
    await createBackupSnapshot();

  const recordCount =
    snapshot.tables.reduce(
      (total, table) =>
        total +
        table.rows.length,
      0
    );

  const checksumSha256 =
    await getSnapshotChecksum(
      snapshot
    );

  return {
    kind:
      BACKUP_PACKAGE_KIND,
    manifest: {
      packageVersion:
        BACKUP_PACKAGE_VERSION,
      packageId:
        Crypto.randomUUID(),
      organizationId:
        SK_ORGANIZATION_ID,
      generatedAt:
        new Date()
          .toISOString(),
      generatedByRole:
        official.role,
      tableCount:
        snapshot.tables.length,
      recordCount,
      checksumSha256,
    },
    snapshot,
  };
}

export async function saveBackupPackage(
  backupPackage: BackupPackage
) {
  const permission =
    await FileSystem
      .StorageAccessFramework
      .requestDirectoryPermissionsAsync();

  const fileName =
    getSafeBackupFileName();

  if (!permission.granted) {
    return {
      saved: false as const,
      fileName,
    };
  }

  const destination =
    await FileSystem
      .StorageAccessFramework
      .createFileAsync(
        permission.directoryUri,
        fileName,
        "application/json"
      );

  await FileSystem
    .writeAsStringAsync(
      destination,
      JSON.stringify(
        backupPackage
      ),
      {
        encoding:
          FileSystem
            .EncodingType
            .UTF8,
      }
    );

  await addTransferHistory({
    transferType: "backup",
    direction: "outgoing",
    channel: "file",
    audience: "device",
    packageId:
      backupPackage.manifest.packageId,
    recordCount:
      backupPackage.manifest.recordCount,
    detail:
      `Saved ${fileName}`,
  });

  return {
    saved: true as const,
    fileName,
    uri: destination,
  };
}

export async function shareBackupPackage(
  backupPackage: BackupPackage
) {
  const canShare =
    await Sharing
      .isAvailableAsync();

  if (!canShare) {
    throw new Error(
      "SHARING_NOT_AVAILABLE"
    );
  }

  if (
    !FileSystem.cacheDirectory
  ) {
    throw new Error(
      "CACHE_DIRECTORY_UNAVAILABLE"
    );
  }

  const fileName =
    getSafeBackupFileName();

  const uri =
    FileSystem.cacheDirectory +
    fileName;

  await FileSystem
    .writeAsStringAsync(
      uri,
      JSON.stringify(
        backupPackage
      ),
      {
        encoding:
          FileSystem
            .EncodingType
            .UTF8,
      }
    );

  try {
    await Sharing.shareAsync(
      uri,
      {
        mimeType:
          "application/json",
        dialogTitle:
          "Share SK Database Backup",
      }
    );

    await addTransferHistory({
      transferType: "backup",
      direction: "outgoing",
      channel: "share",
      audience: "device",
      packageId:
        backupPackage.manifest.packageId,
      recordCount:
        backupPackage.manifest.recordCount,
      detail:
        "Android share sheet opened for .skbackup file",
    });
  } finally {
    await FileSystem
      .deleteAsync(
        uri,
        {
          idempotent: true,
        }
      )
      .catch(() => {});
  }
}

export async function pickBackupPackage() {
  await getVerifiedOfficial();

  const result =
    await DocumentPicker
      .getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

  if (
    result.canceled ||
    !result.assets?.[0]
  ) {
    return null;
  }

  const asset =
    result.assets[0];

  const raw =
    await FileSystem
      .readAsStringAsync(
        asset.uri,
        {
          encoding:
            FileSystem
              .EncodingType
              .UTF8,
        }
      );

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(raw);
  } catch {
    throw new Error(
      "INVALID_BACKUP_PACKAGE"
    );
  }

  const backupPackage =
    assertBackupPackageShape(
      parsed
    );

  const checksum =
    await getSnapshotChecksum(
      backupPackage.snapshot
    );

  if (
    checksum !==
      backupPackage.manifest
        .checksumSha256
  ) {
    throw new Error(
      "BACKUP_CHECKSUM_MISMATCH"
    );
  }

  const countedRecords =
    backupPackage.snapshot
      .tables.reduce(
        (total, table) =>
          total +
          table.rows.length,
        0
      );

  if (
    countedRecords !==
      backupPackage.manifest
        .recordCount ||
    backupPackage.snapshot
      .tables.length !==
      backupPackage.manifest
        .tableCount
  ) {
    throw new Error(
      "INVALID_BACKUP_PACKAGE"
    );
  }

  return {
    fileName:
      asset.name ||
      "SK database backup",
    backupPackage,
  };
}

export async function previewBackupRestore(
  backupPackage: BackupPackage
): Promise<RestorePreview> {
  await getVerifiedOfficial();

  assertBackupPackageShape(
    backupPackage
  );

  const checksum =
    await getSnapshotChecksum(
      backupPackage.snapshot
    );

  if (
    checksum !==
      backupPackage.manifest
        .checksumSha256
  ) {
    throw new Error(
      "BACKUP_CHECKSUM_MISMATCH"
    );
  }

  const currentTableNames =
    new Set(
      await getBackupTableNames()
    );

  for (
    const table of
      backupPackage.snapshot
        .tables
  ) {
    if (
      !currentTableNames.has(
        table.name
      )
    ) {
      throw new Error(
        "BACKUP_SCHEMA_INCOMPATIBLE"
      );
    }

    const currentColumns =
      new Set(
        await getTableColumns(
          table.name
        )
      );

    for (
      const column of
        table.columns
    ) {
      if (
        !currentColumns.has(
          column
        )
      ) {
        throw new Error(
          "BACKUP_SCHEMA_INCOMPATIBLE"
        );
      }
    }
  }

  return {
    packageId:
      backupPackage.manifest
        .packageId,
    generatedAt:
      backupPackage.manifest
        .generatedAt,
    generatedByRole:
      backupPackage.manifest
        .generatedByRole,
    tableCount:
      backupPackage.manifest
        .tableCount,
    recordCount:
      backupPackage.manifest
        .recordCount,
    tables:
      backupPackage.snapshot
        .tables.map(
          (table) => ({
            name: table.name,
            count:
              table.rows.length,
          })
        ),
  };
}

async function insertBackupRow(
  tableName: string,
  columns: string[],
  row:
    Record<string, unknown>
) {
  const db = await getDatabase();

  const placeholders =
    columns
      .map(() => "?")
      .join(", ");

  const values =
    columns.map(
      (column) =>
        row[column] ?? null
    );

  await db.runAsync(
    `
      INSERT INTO ${quoteSqlIdentifier(
        tableName
      )} (
        ${columns
          .map(
            quoteSqlIdentifier
          )
          .join(", ")}
      )
      VALUES (${placeholders})
    `,
    ...(values as any[])
  );
}

export async function restoreBackupPackage(
  backupPackage: BackupPackage
): Promise<RestoreResult> {
  const official =
    await getVerifiedOfficial();

  await previewBackupRestore(
    backupPackage
  );

  const db = await getDatabase();

  const tables =
    backupPackage.snapshot
      .tables;

  let restoredTables = 0;
  let restoredRecords = 0;

  await db.execAsync(
    "PRAGMA foreign_keys = OFF;"
  );

  try {
    await db.withTransactionAsync(
      async () => {
        for (
          const table of
            [...tables].reverse()
        ) {
          await db.runAsync(
            `
              DELETE FROM ${quoteSqlIdentifier(
                table.name
              )}
            `
          );
        }

        for (const table of tables) {
          for (
            const row of
              table.rows
          ) {
            await insertBackupRow(
              table.name,
              table.columns,
              row
            );

            restoredRecords += 1;
          }

          restoredTables += 1;
        }

        /*
          Session state is deliberately not part of a backup.
          Force a fresh login after restore so a restored account
          must authenticate again on this device.
        */
        await db.runAsync(
          "DELETE FROM app_session"
        );
      }
    );
  } finally {
    await db.execAsync(
      "PRAGMA foreign_keys = ON;"
    );
  }

  await addTransferHistory({
    transferType: "restore",
    direction: "incoming",
    channel: "file",
    audience: "device",
    packageId:
      backupPackage.manifest.packageId,
    recordCount: restoredRecords,
    detail:
      `${restoredTables} table(s) restored`,
    userId:
      official.id,
  });

  return {
    restoredTables,
    restoredRecords,
  };
}

