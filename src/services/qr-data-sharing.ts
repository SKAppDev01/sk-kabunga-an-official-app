import * as Crypto from "expo-crypto";
import nacl from "tweetnacl";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  createDataExportPackage,
  DataPackage,
  DataTableName,
  importNewDataRecords,
  previewDataImport,
} from "./data-sharing";
import {
  addTransferHistory,
} from "./data-transfer-history";

const DEVELOPER_ROOT_PUBLIC_KEY_HEX =
  "dc42b2a717e4e94a5595601914e7543f541b465c81d3bad88d7f40881396767a";

const ORGANIZATION_ID =
  "sk-kabunga-an";

export const PUBLIC_QR_KIND =
  "SKK_PUBLIC_QR_V1";

export const OFFICIAL_QR_KIND =
  "SKK_OFFICIAL_QR_V1";

export const QR_MAX_UTF8_BYTES =
  2100;

const DATA_TABLE_NAMES: DataTableName[] = [
  "projects",
  "project_participants",
  "budget_categories",
  "budget_allocations",
  "expenses",
  "youth",
  "meetings",
  "meeting_attendance",
  "meeting_resolutions",
  "activities",
  "activity_participants",
  "inventory_items",
  "inventory_history",
  "documents",
];

const OFFICIAL_ROLES =
  new Set([
    "Chairperson",
    "Secretary",
    "Treasurer",
    "Kagawad",
  ]);

type OrganizationCertificatePayload = {
  version: number;
  type: "organization_certificate";
  organizationId: string;
  organizationName: string;
  organizationPublicKey: string;
};

type OrganizationCertificate = {
  payload: OrganizationCertificatePayload;
  signature: string;
};

type OrganizationCryptoMaterial = {
  certificate: OrganizationCertificate;
  publicSigningKey: string;
  privateSigningKey: string | null;
  officialDataKey: string;
};

export type PublicQrProject = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  budget: number;
  startDate: string | null;
  endDate: string | null;
};

export type PublicQrBudget = {
  id: string;
  title: string;
  amount: number;
  fiscalYear: number | null;
  projectTitle: string | null;
};

export type PublicQrExpense = {
  id: string;
  title: string;
  amount: number;
  expenseDate: string;
  categoryName: string | null;
  projectTitle: string | null;
};

export type PublicQrPayload = {
  version: 1;
  type: "public_records";
  organizationId: string;
  generatedAt: string;
  projects: PublicQrProject[];
  budget: PublicQrBudget[];
  expenses: PublicQrExpense[];
};

type PublicQrWrapper = {
  kind: typeof PUBLIC_QR_KIND;
  certificate: OrganizationCertificate;
  payload: PublicQrPayload;
  signature: string;
};

type CompactOfficialPackage = {
  version: 1;
  packageId: string;
  generatedAt: string;
  generatedByRole: string;
  recordCount: number;
  data: Partial<
    Record<
      DataTableName,
      Record<string, unknown>[]
    >
  >;
};

type OfficialQrSignedBody = {
  kind: typeof OFFICIAL_QR_KIND;
  certificate: OrganizationCertificate;
  nonce: string;
  ciphertext: string;
};

type OfficialQrWrapper =
  OfficialQrSignedBody & {
    signature: string;
  };

export type PublicQrGeneration = {
  encodedValue: string;
  byteSize: number;
  fitsQr: boolean;
  recordCount: number;
  projectCount: number;
  budgetCount: number;
  expenseCount: number;
};

export type PublicQrSelectableRecord = {
  key: string;
  type:
    | "project"
    | "budget"
    | "expense";
  title: string;
  subtitle: string;
  record:
    | PublicQrProject
    | PublicQrBudget
    | PublicQrExpense;
};

export type SimplifiedPublicQrGeneration = {
  encodedValue: string;
  byteSize: number;
  fitsQr: boolean;
  recordType:
    | "Project"
    | "Budget"
    | "Expense";
  title: string;
};

export type OfficialQrGeneration = {
  encodedValue: string;
  byteSize: number;
  fitsQr: boolean;
  recordCount: number;
};

export type ScannedPublicQr = {
  kind: "public";
  organizationName: string;
  payload: PublicQrPayload;
};

export type ScannedOfficialQr = {
  kind: "official";
  organizationName: string;
  dataPackage: DataPackage;
  preview: Awaited<
    ReturnType<
      typeof previewDataImport
    >
  >;
};

export type ScannedDataQr =
  | ScannedPublicQr
  | ScannedOfficialQr;

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

function utf8ToBytes(
  value: string
) {
  const encoded =
    encodeURIComponent(value);

  const bytes: number[] = [];

  for (
    let index = 0;
    index < encoded.length;
    index += 1
  ) {
    const character =
      encoded[index];

    if (character === "%") {
      bytes.push(
        Number.parseInt(
          encoded.slice(
            index + 1,
            index + 3
          ),
          16
        )
      );

      index += 2;
    } else {
      bytes.push(
        character.charCodeAt(0)
      );
    }
  }

  return new Uint8Array(bytes);
}

function bytesToUtf8(
  bytes: Uint8Array
) {
  let encoded = "";

  for (const byte of bytes) {
    if (
      byte >= 0x30 &&
      byte <= 0x39
    ) {
      encoded +=
        String.fromCharCode(byte);
      continue;
    }

    if (
      (byte >= 0x41 &&
        byte <= 0x5a) ||
      (byte >= 0x61 &&
        byte <= 0x7a) ||
      byte === 0x2d ||
      byte === 0x5f ||
      byte === 0x2e ||
      byte === 0x21 ||
      byte === 0x7e ||
      byte === 0x2a ||
      byte === 0x27 ||
      byte === 0x28 ||
      byte === 0x29
    ) {
      encoded +=
        String.fromCharCode(byte);
    } else {
      encoded +=
        `%${byte
          .toString(16)
          .padStart(2, "0")}`;
    }
  }

  return decodeURIComponent(
    encoded
  );
}

function hexToBytes(
  hex: string
) {
  const clean =
    hex.trim().toLowerCase();

  if (
    clean.length === 0 ||
    clean.length % 2 !== 0 ||
    !/^[0-9a-f]+$/.test(clean)
  ) {
    throw new Error(
      "INVALID_CRYPTO_KEY"
    );
  }

  const bytes =
    new Uint8Array(
      clean.length / 2
    );

  for (
    let index = 0;
    index < clean.length;
    index += 2
  ) {
    bytes[index / 2] =
      Number.parseInt(
        clean.slice(
          index,
          index + 2
        ),
        16
      );
  }

  return bytes;
}

function bytesToHex(
  bytes: Uint8Array
) {
  return Array.from(bytes)
    .map((value) =>
      value
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(
  bytes: Uint8Array
) {
  let output = "";

  for (
    let index = 0;
    index < bytes.length;
    index += 3
  ) {
    const a =
      bytes[index];

    const hasB =
      index + 1 <
      bytes.length;

    const hasC =
      index + 2 <
      bytes.length;

    const b =
      hasB
        ? bytes[index + 1]
        : 0;

    const c =
      hasC
        ? bytes[index + 2]
        : 0;

    const triple =
      (a << 16) |
      (b << 8) |
      c;

    output +=
      BASE64_ALPHABET[
        (triple >> 18) &
          63
      ];

    output +=
      BASE64_ALPHABET[
        (triple >> 12) &
          63
      ];

    output +=
      hasB
        ? BASE64_ALPHABET[
            (triple >> 6) &
              63
          ]
        : "=";

    output +=
      hasC
        ? BASE64_ALPHABET[
            triple & 63
          ]
        : "=";
  }

  return output;
}

function base64ToBytes(
  value: string
) {
  const clean =
    value.replace(
      /\s+/g,
      ""
    );

  if (
    clean.length % 4 !== 0
  ) {
    throw new Error(
      "INVALID_QR_DATA"
    );
  }

  const output: number[] = [];

  for (
    let index = 0;
    index < clean.length;
    index += 4
  ) {
    const chars =
      clean.slice(
        index,
        index + 4
      );

    const indexes =
      chars
        .split("")
        .map((char) =>
          char === "="
            ? 0
            : BASE64_ALPHABET.indexOf(
                char
              )
        );

    if (
      indexes.some(
        (item) => item < 0
      )
    ) {
      throw new Error(
        "INVALID_QR_DATA"
      );
    }

    const triple =
      (indexes[0] << 18) |
      (indexes[1] << 12) |
      (indexes[2] << 6) |
      indexes[3];

    output.push(
      (triple >> 16) &
        255
    );

    if (
      chars[2] !== "="
    ) {
      output.push(
        (triple >> 8) &
          255
      );
    }

    if (
      chars[3] !== "="
    ) {
      output.push(
        triple & 255
      );
    }
  }

  return new Uint8Array(
    output
  );
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

    const result:
      Record<
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

function verifyDetachedSignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string
) {
  try {
    return nacl.sign.detached.verify(
      utf8ToBytes(message),
      hexToBytes(
        signatureHex
      ),
      hexToBytes(
        publicKeyHex
      )
    );
  } catch {
    return false;
  }
}

function verifyDetachedSignatureBase64(
  message: string,
  signatureBase64: string,
  publicKeyHex: string
) {
  try {
    return nacl.sign.detached.verify(
      utf8ToBytes(message),
      base64ToBytes(
        signatureBase64
      ),
      hexToBytes(
        publicKeyHex
      )
    );
  } catch {
    return false;
  }
}

function signDetached(
  message: string,
  privateKeyHex: string
) {
  const privateKey =
    hexToBytes(
      privateKeyHex
    );

  if (
    privateKey.length !== 64
  ) {
    throw new Error(
      "SIGNING_KEY_UNAVAILABLE"
    );
  }

  return bytesToHex(
    nacl.sign.detached(
      utf8ToBytes(message),
      privateKey
    )
  );
}

function verifyCertificate(
  certificate:
    OrganizationCertificate
) {
  const payload =
    certificate?.payload;

  if (
    !payload ||
    payload.version !== 1 ||
    payload.type !==
      "organization_certificate" ||
    payload.organizationId !==
      ORGANIZATION_ID ||
    !payload.organizationName ||
    !payload.organizationPublicKey ||
    !certificate.signature
  ) {
    throw new Error(
      "INVALID_ORGANIZATION_CERTIFICATE"
    );
  }

  const valid =
    verifyDetachedSignature(
      JSON.stringify(payload),
      certificate.signature,
      DEVELOPER_ROOT_PUBLIC_KEY_HEX
    );

  if (!valid) {
    throw new Error(
      "INVALID_ORGANIZATION_CERTIFICATE"
    );
  }

  return payload;
}

async function getCurrentUser() {
  await initializeDatabase();

  const db =
    await getDatabase();

  return db.getFirstAsync<{
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
}

async function requireVerifiedOfficial() {
  const user =
    await getCurrentUser();

  if (
    !user ||
    !normalizeOfficialRole(
      user.role
    ) ||
    user.authorization_level !==
      "verified_official"
  ) {
    throw new Error(
      "VERIFIED_OFFICIAL_REQUIRED"
    );
  }

  return user;
}

async function getOrganizationCryptoMaterial({
  requirePrivateSigningKey = false,
}: {
  requirePrivateSigningKey?: boolean;
} = {}): Promise<
  OrganizationCryptoMaterial
> {
  await requireVerifiedOfficial();

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      public_signing_key: string;
      private_signing_key:
        | string
        | null;
      official_data_key: string;
      certificate_payload: string;
      certificate_signature: string;
    }>(
      `
        SELECT
          public_signing_key,
          private_signing_key,
          official_data_key,
          certificate_payload,
          certificate_signature
        FROM sk_organization
        WHERE id = ?
        LIMIT 1
      `,
      ORGANIZATION_ID
    );

  if (!row) {
    throw new Error(
      "ORGANIZATION_NOT_ESTABLISHED"
    );
  }

  if (
    requirePrivateSigningKey &&
    !row.private_signing_key
  ) {
    throw new Error(
      "SIGNING_KEY_UNAVAILABLE"
    );
  }

  let certificatePayload:
    OrganizationCertificatePayload;

  try {
    certificatePayload =
      JSON.parse(
        row.certificate_payload
      );
  } catch {
    throw new Error(
      "INVALID_ORGANIZATION_CERTIFICATE"
    );
  }

  const certificate:
    OrganizationCertificate = {
      payload:
        certificatePayload,
      signature:
        row.certificate_signature,
    };

  const verified =
    verifyCertificate(
      certificate
    );

  if (
    verified
      .organizationPublicKey
      .toLowerCase() !==
    row.public_signing_key
      .toLowerCase()
  ) {
    throw new Error(
      "INVALID_ORGANIZATION_CERTIFICATE"
    );
  }

  return {
    certificate,
    publicSigningKey:
      row.public_signing_key,
    privateSigningKey:
      row.private_signing_key,
    officialDataKey:
      row.official_data_key,
  };
}

async function getPublicPayload():
  Promise<PublicQrPayload> {
  await requireVerifiedOfficial();

  const db =
    await getDatabase();

  const projectRows =
    await db.getAllAsync<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      budget: number;
      start_date: string | null;
      end_date: string | null;
    }>(
      `
        SELECT
          id,
          title,
          description,
          status,
          budget,
          start_date,
          end_date
        FROM projects
        WHERE is_archived = 0
          AND is_youth_visible = 1
        ORDER BY updated_at DESC
      `
    );

  const budgetRows =
    await db.getAllAsync<{
      id: string;
      title: string;
      amount: number;
      fiscal_year: number | null;
      project_title: string | null;
    }>(
      `
        SELECT
          ba.id,
          ba.title,
          ba.amount,
          ba.fiscal_year,
          p.title AS project_title
        FROM budget_allocations ba
        LEFT JOIN projects p
          ON p.id = ba.project_id
        WHERE ba.is_youth_visible = 1
        ORDER BY ba.updated_at DESC
      `
    );

  const expenseRows =
    await db.getAllAsync<{
      id: string;
      title: string;
      amount: number;
      expense_date: string;
      category_name: string | null;
      project_title: string | null;
    }>(
      `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.expense_date,
          bc.name AS category_name,
          p.title AS project_title
        FROM expenses e
        LEFT JOIN budget_categories bc
          ON bc.id = e.category_id
        LEFT JOIN projects p
          ON p.id = e.project_id
        WHERE e.is_youth_visible = 1
        ORDER BY e.updated_at DESC
      `
    );

  return {
    version: 1,
    type: "public_records",
    organizationId:
      ORGANIZATION_ID,
    generatedAt:
      new Date()
        .toISOString(),
    projects:
      projectRows.map(
        (row) => ({
          id: row.id,
          title: row.title,
          description:
            row.description,
          status: row.status,
          budget:
            Number(
              row.budget
            ) || 0,
          startDate:
            row.start_date,
          endDate:
            row.end_date,
        })
      ),
    budget:
      budgetRows.map(
        (row) => ({
          id: row.id,
          title: row.title,
          amount:
            Number(
              row.amount
            ) || 0,
          fiscalYear:
            row.fiscal_year,
          projectTitle:
            row.project_title,
        })
      ),
    expenses:
      expenseRows.map(
        (row) => ({
          id: row.id,
          title: row.title,
          amount:
            Number(
              row.amount
            ) || 0,
          expenseDate:
            row.expense_date,
          categoryName:
            row.category_name,
          projectTitle:
            row.project_title,
        })
      ),
  };
}

export async function generatePublicDataQr():
  Promise<PublicQrGeneration> {
  const material =
    await getOrganizationCryptoMaterial({
      requirePrivateSigningKey:
        true,
    });

  const payload =
    await getPublicPayload();

  const signature =
    signDetached(
      stableStringify(payload),
      material
        .privateSigningKey!
    );

  const wrapper:
    PublicQrWrapper = {
      kind:
        PUBLIC_QR_KIND,
      certificate:
        material.certificate,
      payload,
      signature,
    };

  const encodedValue =
    JSON.stringify(wrapper);

  const byteSize =
    utf8ToBytes(
      encodedValue
    ).length;

  const recordCount =
    payload.projects.length +
    payload.budget.length +
    payload.expenses.length;

  const fitsQr =
    byteSize <=
      QR_MAX_UTF8_BYTES &&
    recordCount > 0;

  if (fitsQr) {
    await addTransferHistory({
      transferType: "public_qr",
      direction: "outgoing",
      channel: "qr",
      audience: "public",
      recordCount,
      detail:
        `${payload.projects.length} project • ` +
        `${payload.budget.length} budget • ` +
        `${payload.expenses.length} expense`,
    });
  }

  return {
    encodedValue,
    byteSize,
    fitsQr,
    recordCount,
    projectCount:
      payload.projects.length,
    budgetCount:
      payload.budget.length,
    expenseCount:
      payload.expenses.length,
  };
}


type CompactPublicRecord =
  | [
      "p",
      string,
      string,
      number,
      string | null,
      string | null
    ]
  | [
      "b",
      string,
      number,
      number | null,
      string | null
    ]
  | [
      "e",
      string,
      number,
      string,
      string | null,
      string | null
    ];

type CompactPublicQrEnvelope = [
  "P1",
  string,
  string,
  string,
  string,
  CompactPublicRecord,
  string
];

function toCompactPublicRecord(
  item: PublicQrSelectableRecord
): CompactPublicRecord {
  if (item.type === "project") {
    const record =
      item.record as PublicQrProject;

    return [
      "p",
      record.title,
      record.status,
      record.budget,
      record.startDate,
      record.endDate,
    ];
  }

  if (item.type === "budget") {
    const record =
      item.record as PublicQrBudget;

    return [
      "b",
      record.title,
      record.amount,
      record.fiscalYear,
      record.projectTitle,
    ];
  }

  const record =
    item.record as PublicQrExpense;

  return [
    "e",
    record.title,
    record.amount,
    record.expenseDate,
    record.categoryName,
    record.projectTitle,
  ];
}

function publicRecordToPayload(
  generatedAt: string,
  record: CompactPublicRecord
): PublicQrPayload {
  const payload: PublicQrPayload = {
    version: 1,
    type: "public_records",
    organizationId:
      ORGANIZATION_ID,
    generatedAt,
    projects: [],
    budget: [],
    expenses: [],
  };

  if (record[0] === "p") {
    payload.projects.push({
      id: "",
      title: record[1],
      description: null,
      status: record[2],
      budget: record[3],
      startDate: record[4],
      endDate: record[5],
    });
  } else if (record[0] === "b") {
    payload.budget.push({
      id: "",
      title: record[1],
      amount: record[2],
      fiscalYear: record[3],
      projectTitle: record[4],
    });
  } else {
    payload.expenses.push({
      id: "",
      title: record[1],
      amount: record[2],
      expenseDate: record[3],
      categoryName: record[4],
      projectTitle: record[5],
    });
  }

  return payload;
}

export async function getPublicQrSelectableRecords():
  Promise<PublicQrSelectableRecord[]> {
  const payload =
    await getPublicPayload();

  return [
    ...payload.projects.map(
      (record) => ({
        key: `project:${record.id}`,
        type:
          "project" as const,
        title: record.title,
        subtitle:
          `${record.status} • ` +
          `₱${record.budget.toLocaleString("en-PH")}`,
        record,
      })
    ),
    ...payload.budget.map(
      (record) => ({
        key: `budget:${record.id}`,
        type:
          "budget" as const,
        title: record.title,
        subtitle:
          `₱${record.amount.toLocaleString("en-PH")}` +
          (record.projectTitle
            ? ` • ${record.projectTitle}`
            : ""),
        record,
      })
    ),
    ...payload.expenses.map(
      (record) => ({
        key: `expense:${record.id}`,
        type:
          "expense" as const,
        title: record.title,
        subtitle:
          `₱${record.amount.toLocaleString("en-PH")} • ` +
          record.expenseDate,
        record,
      })
    ),
  ];
}

export async function generateSimplifiedPublicDataQr(
  item: PublicQrSelectableRecord
): Promise<SimplifiedPublicQrGeneration> {
  const material =
    await getOrganizationCryptoMaterial({
      requirePrivateSigningKey:
        true,
    });

  const certificatePayload =
    verifyCertificate(
      material.certificate
    );

  const generatedAt =
    new Date().toISOString();

  const compactRecord =
    toCompactPublicRecord(
      item
    );

  const signedPayload = [
    generatedAt,
    compactRecord,
  ];

  const recordSignatureHex =
    signDetached(
      stableStringify(
        signedPayload
      ),
      material.privateSigningKey!
    );

  const envelope:
    CompactPublicQrEnvelope = [
      "P1",
      certificatePayload
        .organizationName,
      bytesToBase64(
        hexToBytes(
          certificatePayload
            .organizationPublicKey
        )
      ),
      bytesToBase64(
        hexToBytes(
          material.certificate
            .signature
        )
      ),
      generatedAt,
      compactRecord,
      bytesToBase64(
        hexToBytes(
          recordSignatureHex
        )
      ),
    ];

  const encodedValue =
    JSON.stringify(envelope);

  const byteSize =
    utf8ToBytes(
      encodedValue
    ).length;

  return {
    encodedValue,
    byteSize,
    fitsQr:
      byteSize <=
      QR_MAX_UTF8_BYTES,
    recordType:
      item.type === "project"
        ? "Project"
        : item.type === "budget"
          ? "Budget"
          : "Expense",
    title: item.title,
  };
}

function tryDecodeSimplifiedPublicQr(
  rawValue: string
): ScannedPublicQr | null {
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        rawValue.trim()
      );
  } catch {
    return null;
  }

  if (
    !Array.isArray(parsed) ||
    parsed[0] !== "P1" ||
    parsed.length !== 7
  ) {
    return null;
  }

  const [
    _kind,
    organizationName,
    publicKeyBase64,
    certificateSignatureBase64,
    generatedAt,
    compactRecord,
    recordSignatureBase64,
  ] = parsed;

  if (
    typeof organizationName !==
      "string" ||
    typeof publicKeyBase64 !==
      "string" ||
    typeof certificateSignatureBase64 !==
      "string" ||
    typeof generatedAt !==
      "string" ||
    !Array.isArray(
      compactRecord
    ) ||
    typeof recordSignatureBase64 !==
      "string"
  ) {
    throw new Error(
      "INVALID_PUBLIC_QR"
    );
  }

  const publicKeyHex =
    bytesToHex(
      base64ToBytes(
        publicKeyBase64
      )
    );

  const certificate:
    OrganizationCertificate = {
      payload: {
        version: 1,
        type:
          "organization_certificate",
        organizationId:
          ORGANIZATION_ID,
        organizationName,
        organizationPublicKey:
          publicKeyHex,
      },
      signature:
        bytesToHex(
          base64ToBytes(
            certificateSignatureBase64
          )
        ),
    };

  const certificatePayload =
    verifyCertificate(
      certificate
    );

  const valid =
    verifyDetachedSignatureBase64(
      stableStringify([
        generatedAt,
        compactRecord,
      ]),
      recordSignatureBase64,
      certificatePayload
        .organizationPublicKey
    );

  if (!valid) {
    throw new Error(
      "INVALID_PUBLIC_QR_SIGNATURE"
    );
  }

  const tag =
    compactRecord[0];

  if (
    tag !== "p" &&
    tag !== "b" &&
    tag !== "e"
  ) {
    throw new Error(
      "INVALID_PUBLIC_QR"
    );
  }

  const payload =
    publicRecordToPayload(
      generatedAt,
      compactRecord as
        CompactPublicRecord
    );

  return {
    kind: "public",
    organizationName,
    payload,
  };
}

function compactOfficialPackage(
  dataPackage: DataPackage
): CompactOfficialPackage {
  const data:
    CompactOfficialPackage["data"] =
      {};

  for (
    const tableName of
      DATA_TABLE_NAMES
  ) {
    const rows =
      dataPackage.data[
        tableName
      ];

    if (
      rows &&
      rows.length > 0
    ) {
      data[tableName] =
        rows;
    }
  }

  return {
    version: 1,
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
    data,
  };
}

function expandOfficialPackage(
  compact:
    CompactOfficialPackage
): DataPackage {
  const data =
    {} as DataPackage["data"];

  for (
    const tableName of
      DATA_TABLE_NAMES
  ) {
    data[tableName] =
      compact.data[
        tableName
      ] || [];
  }

  return {
    kind:
      "SKK_DATA_V1",
    manifest: {
      packageVersion: 1,
      packageId:
        compact.packageId,
      kind: "export",
      audience:
        "officials",
      organizationId:
        ORGANIZATION_ID,
      generatedAt:
        compact.generatedAt,
      generatedByRole:
        compact.generatedByRole,
      recordCount:
        compact.recordCount,
    },
    data,
  };
}

export async function generateOfficialDataQr():
  Promise<OfficialQrGeneration> {
  const material =
    await getOrganizationCryptoMaterial({
      requirePrivateSigningKey:
        true,
    });

  const dataPackage =
    await createDataExportPackage();

  const compact =
    compactOfficialPackage(
      dataPackage
    );

  const key =
    hexToBytes(
      material.officialDataKey
    );

  if (key.length !== 32) {
    throw new Error(
      "INVALID_OFFICIAL_DATA_KEY"
    );
  }

  const nonce =
    Crypto.getRandomBytes(
      nacl.secretbox.nonceLength
    );

  const plaintext =
    utf8ToBytes(
      JSON.stringify(compact)
    );

  const ciphertext =
    nacl.secretbox(
      plaintext,
      nonce,
      key
    );

  const body:
    OfficialQrSignedBody = {
      kind:
        OFFICIAL_QR_KIND,
      certificate:
        material.certificate,
      nonce:
        bytesToBase64(
          nonce
        ),
      ciphertext:
        bytesToBase64(
          ciphertext
        ),
    };

  const signature =
    signDetached(
      stableStringify(body),
      material
        .privateSigningKey!
    );

  const wrapper:
    OfficialQrWrapper = {
      ...body,
      signature,
    };

  const encodedValue =
    JSON.stringify(wrapper);

  const byteSize =
    utf8ToBytes(
      encodedValue
    ).length;

  const fitsQr =
    byteSize <=
      QR_MAX_UTF8_BYTES &&
    dataPackage.manifest
      .recordCount > 0;

  if (fitsQr) {
    await addTransferHistory({
      transferType: "official_qr",
      direction: "outgoing",
      channel: "qr",
      audience: "officials",
      packageId:
        dataPackage.manifest.packageId,
      recordCount:
        dataPackage.manifest.recordCount,
      detail:
        "Encrypted Officials QR generated",
    });
  }

  return {
    encodedValue,
    byteSize,
    fitsQr,
    recordCount:
      dataPackage.manifest
        .recordCount,
  };
}

function parseJsonObject(
  rawValue: string
) {
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        rawValue.trim()
      );
  } catch {
    throw new Error(
      "UNRECOGNIZED_QR"
    );
  }

  if (
    !parsed ||
    typeof parsed !==
      "object"
  ) {
    throw new Error(
      "UNRECOGNIZED_QR"
    );
  }

  return parsed as Record<
    string,
    unknown
  >;
}

function parsePublicWrapper(
  parsed:
    Record<string, unknown>
): PublicQrWrapper {
  if (
    parsed.kind !==
      PUBLIC_QR_KIND ||
    !parsed.certificate ||
    !parsed.payload ||
    typeof parsed.signature !==
      "string"
  ) {
    throw new Error(
      "INVALID_PUBLIC_QR"
    );
  }

  return parsed as
    unknown as PublicQrWrapper;
}

function validatePublicPayload(
  payload: PublicQrPayload
) {
  if (
    payload.version !== 1 ||
    payload.type !==
      "public_records" ||
    payload.organizationId !==
      ORGANIZATION_ID ||
    !payload.generatedAt ||
    !Array.isArray(
      payload.projects
    ) ||
    !Array.isArray(
      payload.budget
    ) ||
    !Array.isArray(
      payload.expenses
    )
  ) {
    throw new Error(
      "INVALID_PUBLIC_QR"
    );
  }
}

async function readOfficialDataKeyForReceive(
  certificate:
    OrganizationCertificate
) {
  await requireVerifiedOfficial();

  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      public_signing_key: string;
      official_data_key: string;
    }>(
      `
        SELECT
          public_signing_key,
          official_data_key
        FROM sk_organization
        WHERE id = ?
        LIMIT 1
      `,
      ORGANIZATION_ID
    );

  if (!row) {
    throw new Error(
      "ORGANIZATION_NOT_ESTABLISHED"
    );
  }

  const certificatePayload =
    verifyCertificate(
      certificate
    );

  if (
    certificatePayload
      .organizationPublicKey
      .toLowerCase() !==
    row.public_signing_key
      .toLowerCase()
  ) {
    throw new Error(
      "OFFICIAL_QR_DIFFERENT_ORGANIZATION"
    );
  }

  return row.official_data_key;
}

export async function decodeScannedDataQr(
  rawValue: string
): Promise<ScannedDataQr> {
  const simplifiedPublic =
    tryDecodeSimplifiedPublicQr(
      rawValue
    );

  if (simplifiedPublic) {
    const publicRecordCount =
      simplifiedPublic
        .payload.projects.length +
      simplifiedPublic
        .payload.budget.length +
      simplifiedPublic
        .payload.expenses.length;

    await addTransferHistory({
      transferType: "public_qr",
      direction: "incoming",
      channel: "qr",
      audience: "public",
      recordCount:
        publicRecordCount,
      detail:
        "Public QR verified and opened read-only",
    });

    return simplifiedPublic;
  }

  const parsed =
    parseJsonObject(
      rawValue
    );

  if (
    parsed.kind ===
      PUBLIC_QR_KIND
  ) {
    const wrapper =
      parsePublicWrapper(
        parsed
      );

    const certificatePayload =
      verifyCertificate(
        wrapper.certificate
      );

    validatePublicPayload(
      wrapper.payload
    );

    const valid =
      verifyDetachedSignature(
        stableStringify(
          wrapper.payload
        ),
        wrapper.signature,
        certificatePayload
          .organizationPublicKey
      );

    if (!valid) {
      throw new Error(
        "INVALID_PUBLIC_QR_SIGNATURE"
      );
    }

    const publicRecordCount =
      wrapper.payload.projects.length +
      wrapper.payload.budget.length +
      wrapper.payload.expenses.length;

    await addTransferHistory({
      transferType: "public_qr",
      direction: "incoming",
      channel: "qr",
      audience: "public",
      recordCount:
        publicRecordCount,
      detail:
        "Public QR verified and opened read-only",
    });

    return {
      kind: "public",
      organizationName:
        certificatePayload
          .organizationName,
      payload:
        wrapper.payload,
    };
  }

  if (
    parsed.kind ===
      OFFICIAL_QR_KIND
  ) {
    const wrapper =
      parsed as
        unknown as OfficialQrWrapper;

    if (
      !wrapper.certificate ||
      typeof wrapper.nonce !==
        "string" ||
      typeof wrapper.ciphertext !==
        "string" ||
      typeof wrapper.signature !==
        "string"
    ) {
      throw new Error(
        "INVALID_OFFICIAL_QR"
      );
    }

    const certificatePayload =
      verifyCertificate(
        wrapper.certificate
      );

    const body:
      OfficialQrSignedBody = {
        kind:
          OFFICIAL_QR_KIND,
        certificate:
          wrapper.certificate,
        nonce:
          wrapper.nonce,
        ciphertext:
          wrapper.ciphertext,
      };

    const valid =
      verifyDetachedSignature(
        stableStringify(body),
        wrapper.signature,
        certificatePayload
          .organizationPublicKey
      );

    if (!valid) {
      throw new Error(
        "INVALID_OFFICIAL_QR_SIGNATURE"
      );
    }

    const officialDataKey =
      await readOfficialDataKeyForReceive(
        wrapper.certificate
      );

    const key =
      hexToBytes(
        officialDataKey
      );

    if (key.length !== 32) {
      throw new Error(
        "INVALID_OFFICIAL_DATA_KEY"
      );
    }

    const nonce =
      base64ToBytes(
        wrapper.nonce
      );

    const ciphertext =
      base64ToBytes(
        wrapper.ciphertext
      );

    const plaintext =
      nacl.secretbox.open(
        ciphertext,
        nonce,
        key
      );

    if (!plaintext) {
      throw new Error(
        "OFFICIAL_QR_DECRYPT_FAILED"
      );
    }

    let compact:
      CompactOfficialPackage;

    try {
      compact =
        JSON.parse(
          bytesToUtf8(
            plaintext
          )
        );
    } catch {
      throw new Error(
        "INVALID_OFFICIAL_QR"
      );
    }

    if (
      compact.version !== 1 ||
      !compact.packageId ||
      !compact.generatedAt ||
      !compact.generatedByRole ||
      !Number.isFinite(
        compact.recordCount
      ) ||
      !compact.data ||
      typeof compact.data !==
        "object"
    ) {
      throw new Error(
        "INVALID_OFFICIAL_QR"
      );
    }

    const dataPackage =
      expandOfficialPackage(
        compact
      );

    const preview =
      await previewDataImport(
        dataPackage
      );

    await addTransferHistory({
      transferType: "official_qr",
      direction: "incoming",
      channel: "qr",
      audience: "officials",
      packageId:
        dataPackage.manifest.packageId,
      recordCount:
        dataPackage.manifest.recordCount,
      detail:
        `${preview.newRecords} new • ` +
        `${preview.duplicateRecords} duplicate • ` +
        `${preview.conflictingRecords} conflict`,
    });

    return {
      kind: "official",
      organizationName:
        certificatePayload
          .organizationName,
      dataPackage,
      preview,
    };
  }

  throw new Error(
    "UNRECOGNIZED_QR"
  );
}

export async function importScannedOfficialQr(
  dataPackage: DataPackage
) {
  return importNewDataRecords(
    dataPackage,
    "qr"
  );
}
