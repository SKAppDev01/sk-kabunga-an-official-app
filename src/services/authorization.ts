import nacl from "tweetnacl";

import {
  getDatabase,
  initializeDatabase,
} from "../database/database";

export const AUTH_LEVEL_PUBLIC = "public";
export const AUTH_LEVEL_UNVERIFIED = "unverified";
export const AUTH_LEVEL_VERIFIED_OFFICIAL =
  "verified_official";

export const YOUTH_MEMBER_ROLE =
  "SK Youth Member";

export const OFFICIAL_ROLES = [
  "Chairperson",
  "Secretary",
  "Treasurer",
  "Kagawad",
] as const;

export type OfficialRole =
  (typeof OFFICIAL_ROLES)[number];

const DEVELOPER_ROOT_PUBLIC_KEY_HEX =
  "dc42b2a717e4e94a5595601914e7543f541b465c81d3bad88d7f40881396767a";

const ORGANIZATION_ID =
  "sk-kabunga-an";

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

type FoundingPayload = {
  version: number;
  type: "founding_official";
  certificate: OrganizationCertificate;
  organizationSecretKey: string;
  officialDataKey: string;
  // Legacy V1 field. The Founding credential proves bootstrap authority,
  // while the actual SK position is selected by the verified founding user.
  foundingRole: string;
  bootstrapId: string;
  issuedAt: string;
};

type FoundingWrapper = {
  kind: "SKK_FOUNDING_V1";
  payload: FoundingPayload;
  signature: string;
};

export type StoredOrganization = {
  id: string;
  name: string;
  publicSigningKey: string;
  hasPrivateSigningKey: boolean;
  establishedBy: string | null;
  createdAt: string;
};

export function isOfficialRole(
  role: string | null | undefined
): boolean {
  if (!role) {
    return false;
  }

  const normalized =
    role.replace(/^SK\s+/i, "").trim();

  return OFFICIAL_ROLES.includes(
    normalized as OfficialRole
  );
}

export function normalizeOfficialRole(
  role: string
): OfficialRole | null {
  const normalized =
    role.replace(/^SK\s+/i, "").trim();

  if (
    OFFICIAL_ROLES.includes(
      normalized as OfficialRole
    )
  ) {
    return normalized as OfficialRole;
  }

  return null;
}

export function isVerifiedOfficialAccount(
  role: string | null | undefined,
  authorizationLevel:
    | string
    | null
    | undefined
) {
  return (
    isOfficialRole(role) &&
    authorizationLevel ===
      AUTH_LEVEL_VERIFIED_OFFICIAL
  );
}

function hexToBytes(hex: string) {
  const clean = hex.trim().toLowerCase();

  if (
    clean.length === 0 ||
    clean.length % 2 !== 0 ||
    !/^[0-9a-f]+$/.test(clean)
  ) {
    throw new Error("INVALID_HEX");
  }

  const bytes = new Uint8Array(
    clean.length / 2
  );

  for (
    let index = 0;
    index < clean.length;
    index += 2
  ) {
    bytes[index / 2] = Number.parseInt(
      clean.slice(index, index + 2),
      16
    );
  }

  return bytes;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((value) =>
      value.toString(16).padStart(2, "0")
    )
    .join("");
}

function utf8ToBytes(value: string) {
  const encoded =
    encodeURIComponent(value);

  const bytes: number[] = [];

  for (
    let index = 0;
    index < encoded.length;
    index += 1
  ) {
    const character = encoded[index];

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

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

function verifyDetachedSignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string
) {
  try {
    return nacl.sign.detached.verify(
      utf8ToBytes(message),
      hexToBytes(signatureHex),
      hexToBytes(publicKeyHex)
    );
  } catch {
    return false;
  }
}

function parseFoundingWrapper(
  rawValue: string
): FoundingWrapper {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue.trim());
  } catch {
    throw new Error(
      "INVALID_FOUNDING_AUTHORIZATION"
    );
  }

  const wrapper =
    parsed as Partial<FoundingWrapper>;

  if (
    wrapper.kind !== "SKK_FOUNDING_V1" ||
    !wrapper.payload ||
    !wrapper.signature
  ) {
    throw new Error(
      "INVALID_FOUNDING_AUTHORIZATION"
    );
  }

  const payload = wrapper.payload;

  if (
    payload.version !== 1 ||
    payload.type !== "founding_official" ||
    !payload.foundingRole ||
    !payload.bootstrapId ||
    !payload.organizationSecretKey ||
    !payload.officialDataKey ||
    !payload.certificate
  ) {
    throw new Error(
      "INVALID_FOUNDING_AUTHORIZATION"
    );
  }

  return wrapper as FoundingWrapper;
}

function verifyOrganizationCertificate(
  certificate: OrganizationCertificate
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

  const isValid =
    verifyDetachedSignature(
      stableStringify(payload),
      certificate.signature,
      DEVELOPER_ROOT_PUBLIC_KEY_HEX
    );

  if (!isValid) {
    throw new Error(
      "INVALID_ORGANIZATION_CERTIFICATE"
    );
  }

  return payload;
}

export async function getStoredOrganization():
  Promise<StoredOrganization | null> {
  await initializeDatabase();
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    public_signing_key: string;
    private_signing_key: string | null;
    established_by: string | null;
    created_at: string;
  }>(
    `
      SELECT
        id,
        name,
        public_signing_key,
        private_signing_key,
        established_by,
        created_at
      FROM sk_organization
      WHERE id = ?
      LIMIT 1
    `,
    ORGANIZATION_ID
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    publicSigningKey:
      row.public_signing_key,
    hasPrivateSigningKey:
      Boolean(row.private_signing_key),
    establishedBy:
      row.established_by,
    createdAt: row.created_at,
  };
}

export async function establishFoundingOfficial({
  userId,
  fullName,
  selectedRole,
  authorizationData,
}: {
  userId: string;
  fullName: string;
  selectedRole: string;
  authorizationData: string;
}) {
  await initializeDatabase();
  const db = await getDatabase();

  const cleanFullName =
    fullName.trim();

  const officialRole =
    normalizeOfficialRole(
      selectedRole
    );

  if (!officialRole) {
    throw new Error(
      "INVALID_OFFICIAL_ROLE"
    );
  }

  if (!cleanFullName) {
    throw new Error(
      "FULL_NAME_REQUIRED"
    );
  }

  const wrapper =
    parseFoundingWrapper(
      authorizationData
    );

  const foundingPayloadValid =
    verifyDetachedSignature(
      stableStringify(wrapper.payload),
      wrapper.signature,
      DEVELOPER_ROOT_PUBLIC_KEY_HEX
    );

  if (!foundingPayloadValid) {
    throw new Error(
      "INVALID_FOUNDING_AUTHORIZATION"
    );
  }

  const certificatePayload =
    verifyOrganizationCertificate(
      wrapper.payload.certificate
    );

  const secretKeyBytes =
    hexToBytes(
      wrapper.payload.organizationSecretKey
    );

  if (secretKeyBytes.length !== 64) {
    throw new Error(
      "INVALID_FOUNDING_AUTHORIZATION"
    );
  }

  const keyPair =
    nacl.sign.keyPair.fromSecretKey(
      secretKeyBytes
    );

  if (
    bytesToHex(keyPair.publicKey) !==
    certificatePayload.organizationPublicKey.toLowerCase()
  ) {
    throw new Error(
      "INVALID_FOUNDING_AUTHORIZATION"
    );
  }

  const existingOrganization =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM sk_organization
        WHERE id = ?
        LIMIT 1
      `,
      ORGANIZATION_ID
    );

  if (existingOrganization) {
    throw new Error(
      "FOUNDING_ALREADY_COMPLETED"
    );
  }

  const user =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM users
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `,
      userId
    );

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  await db.withTransactionAsync(
    async () => {
      await db.runAsync(
        `
          INSERT INTO sk_organization (
            id,
            name,
            public_signing_key,
            private_signing_key,
            official_data_key,
            certificate_payload,
            certificate_signature,
            bootstrap_id,
            established_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        certificatePayload.organizationId,
        certificatePayload.organizationName,
        certificatePayload.organizationPublicKey,
        wrapper.payload.organizationSecretKey,
        wrapper.payload.officialDataKey,
        stableStringify(
          certificatePayload
        ),
        wrapper.payload.certificate.signature,
        wrapper.payload.bootstrapId,
        userId
      );

      await db.runAsync(
        `
          UPDATE users
          SET
            full_name = ?,
            role = ?,
            authorization_level = ?,
            authorized_by = 'deployment_admin',
            authorized_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        cleanFullName,
        officialRole,
        AUTH_LEVEL_VERIFIED_OFFICIAL,
        userId
      );
    }
  );

  return {
    id: userId,
    fullName: cleanFullName,
    role: officialRole,
    authorizationLevel:
      AUTH_LEVEL_VERIFIED_OFFICIAL,
  };
}
