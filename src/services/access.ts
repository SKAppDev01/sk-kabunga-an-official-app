import { getCurrentSessionUser, SessionUser } from "./session";

export const YOUTH_MEMBER_ROLE = "SK Youth Member";

export const OFFICIAL_ROLES = [
  "Chairperson",
  "Secretary",
  "Treasurer",
  "Kagawad",
  "SK Chairperson",
  "SK Secretary",
  "SK Treasurer",
  "SK Kagawad",
] as const;

export function isYouthMemberRole(
  role: string | null | undefined
) {
  return role === YOUTH_MEMBER_ROLE;
}

export function isOfficialRole(
  role: string | null | undefined
) {
  return OFFICIAL_ROLES.includes(
    role as (typeof OFFICIAL_ROLES)[number]
  );
}

export async function getCurrentAccessUser():
  Promise<SessionUser> {
  const user = await getCurrentSessionUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  return user;
}

export async function requireOfficialAccess() {
  const user =
    await getCurrentAccessUser();

  if (!isOfficialRole(user.role)) {
    throw new Error("ACCESS_DENIED");
  }

  if (
    user.authorizationLevel !==
      "verified_official"
  ) {
    throw new Error(
      "VERIFIED_OFFICIAL_REQUIRED"
    );
  }

  return user;
}

export async function requireVerifiedOfficialAccess() {
  return requireOfficialAccess();
}
