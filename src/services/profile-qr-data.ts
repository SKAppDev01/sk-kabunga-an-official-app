export const PROFILE_QR_TYPE = "sklocal.profile" as const;
export const PROFILE_QR_VERSION = 1 as const;

export type ProfileQrSource = {
  profileId: string;
  fullName: string;
  birthDate: string;
  sex: string;
  purokSitio: string;
  contactNumber?: string | null;
  educationStatus?: string | null;
  employmentStatus?: string | null;
  youthClassification?: string | null;
};

export type ProfileQrPayload = {
  type: typeof PROFILE_QR_TYPE;
  version: typeof PROFILE_QR_VERSION;
  profileId: string;
  fullName: string;
  birthDate: string;
  sex: string;
  purokSitio: string;
  educationStatus?: string;
  employmentStatus?: string;
  youthClassification?: string;
};

function cleanOptional(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

export function isProfileQrReady(
  profile: Pick<
    ProfileQrSource,
    "profileId" | "fullName" | "birthDate" | "sex" | "purokSitio"
  >
) {
  return Boolean(
    profile.profileId.trim() &&
      profile.fullName.trim() &&
      profile.birthDate.trim() &&
      profile.sex.trim() &&
      profile.purokSitio.trim()
  );
}

export function buildProfileQrPayload(
  profile: ProfileQrSource
) {
  if (!isProfileQrReady(profile)) {
    throw new Error("PROFILE_INCOMPLETE");
  }

  const payload: ProfileQrPayload = {
    type: PROFILE_QR_TYPE,
    version: PROFILE_QR_VERSION,
    profileId: profile.profileId.trim(),
    fullName: profile.fullName.trim(),
    birthDate: profile.birthDate.trim(),
    sex: profile.sex.trim(),
    purokSitio: profile.purokSitio.trim(),
  };

  const educationStatus = cleanOptional(
    profile.educationStatus
  );
  const employmentStatus = cleanOptional(
    profile.employmentStatus
  );
  const youthClassification = cleanOptional(
    profile.youthClassification
  );

  if (educationStatus) {
    payload.educationStatus = educationStatus;
  }

  if (employmentStatus) {
    payload.employmentStatus = employmentStatus;
  }

  if (youthClassification) {
    payload.youthClassification = youthClassification;
  }

  return JSON.stringify(payload);
}

export function parseProfileQrPayload(
  rawValue: string
): ProfileQrPayload | null {
  try {
    const parsed = JSON.parse(rawValue) as Partial<ProfileQrPayload>;

    if (
      parsed.type !== PROFILE_QR_TYPE ||
      parsed.version !== PROFILE_QR_VERSION ||
      typeof parsed.profileId !== "string" ||
      typeof parsed.fullName !== "string" ||
      typeof parsed.birthDate !== "string" ||
      typeof parsed.sex !== "string" ||
      typeof parsed.purokSitio !== "string"
    ) {
      return null;
    }

    const payload: ProfileQrPayload = {
      type: PROFILE_QR_TYPE,
      version: PROFILE_QR_VERSION,
      profileId: parsed.profileId.trim(),
      fullName: parsed.fullName.trim(),
      birthDate: parsed.birthDate.trim(),
      sex: parsed.sex.trim(),
      purokSitio: parsed.purokSitio.trim(),
    };

    if (!isProfileQrReady(payload)) {
      return null;
    }

    if (typeof parsed.educationStatus === "string") {
      const value = parsed.educationStatus.trim();
      if (value) payload.educationStatus = value;
    }

    if (typeof parsed.employmentStatus === "string") {
      const value = parsed.employmentStatus.trim();
      if (value) payload.employmentStatus = value;
    }

    if (typeof parsed.youthClassification === "string") {
      const value = parsed.youthClassification.trim();
      if (value) payload.youthClassification = value;
    }

    return payload;
  } catch {
    return null;
  }
}
