import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

const GITHUB_OWNER = "SKAppDev01";
const GITHUB_REPO = "sk-kabunga-an-official-app";
const GITHUB_LATEST_RELEASE_URL =
  `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const APK_MIME_TYPE =
  "application/vnd.android.package-archive";

export type NativeUpdateInfo = {
  currentVersion: string;
  version: string;
  tag: string;
  title: string;
  notes: string;
  publishedAt: string | null;
  releaseUrl: string;
  apkName: string;
  downloadUrl: string;
  sizeBytes: number;
};

export type GitHubUpdateCheck =
  | {
      status: "available";
      update: NativeUpdateInfo;
    }
  | {
      status: "up-to-date";
      currentVersion: string;
      latestVersion: string;
    }
  | {
      status: "no-release";
      currentVersion: string;
    }
  | {
      status: "no-apk";
      currentVersion: string;
      latestVersion: string;
      releaseUrl: string;
    };

export type OtaUpdateCheck =
  | { status: "available" }
  | { status: "up-to-date" }
  | {
      status: "unavailable";
      reason: string;
    };

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
  content_type?: string;
  size?: number;
  state?: string;
};

type GitHubRelease = {
  tag_name: string;
  name?: string | null;
  body?: string | null;
  html_url: string;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string | null;
  assets?: GitHubReleaseAsset[];
};

function parseVersion(value: string) {
  const normalized = value
    .trim()
    .replace(/^v/i, "")
    .split(/[+-]/, 1)[0];

  if (!/^\d+(?:\.\d+)*$/.test(normalized)) {
    return null;
  }

  return normalized.split(".").map(Number);
}

function normalizeVersion(value: string) {
  const parsed = parseVersion(value);

  if (!parsed) {
    return value.trim().replace(/^v/i, "");
  }

  return parsed.join(".");
}

export function compareVersions(
  left: string,
  right: string
) {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);

  if (!leftParts || !rightParts) {
    return left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  const length = Math.max(
    leftParts.length,
    rightParts.length
  );

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

export function getCurrentAppVersion() {
  return Constants.expoConfig?.version?.trim() || "0.0.0";
}

export async function checkForGitHubApkUpdate(): Promise<GitHubUpdateCheck> {
  const currentVersion = getCurrentAppVersion();

  const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (response.status === 404) {
    return {
      status: "no-release",
      currentVersion,
    };
  }

  if (!response.ok) {
    throw new Error(
      `GITHUB_RELEASE_CHECK_FAILED:${response.status}`
    );
  }

  const release = (await response.json()) as GitHubRelease;
  const latestVersion = normalizeVersion(release.tag_name);

  if (release.draft || release.prerelease) {
    return {
      status: "no-release",
      currentVersion,
    };
  }

  if (
    compareVersions(latestVersion, currentVersion) <= 0
  ) {
    return {
      status: "up-to-date",
      currentVersion,
      latestVersion,
    };
  }

  const apkAsset = (release.assets ?? []).find(
    (asset) =>
      asset.state !== "deleted" &&
      asset.name.toLowerCase().endsWith(".apk")
  );

  if (!apkAsset) {
    return {
      status: "no-apk",
      currentVersion,
      latestVersion,
      releaseUrl: release.html_url,
    };
  }

  return {
    status: "available",
    update: {
      currentVersion,
      version: latestVersion,
      tag: release.tag_name,
      title:
        release.name?.trim() ||
        `SK Kabunga-an ${release.tag_name}`,
      notes:
        release.body?.trim() ||
        "A new version of the app is available.",
      publishedAt: release.published_at ?? null,
      releaseUrl: release.html_url,
      apkName: apkAsset.name,
      downloadUrl: apkAsset.browser_download_url,
      sizeBytes: apkAsset.size ?? 0,
    },
  };
}

export async function downloadApk(
  update: NativeUpdateInfo,
  onProgress?: (progress: number) => void
) {
  if (Platform.OS !== "android") {
    throw new Error("APK_DOWNLOAD_ANDROID_ONLY");
  }

  if (!FileSystem.cacheDirectory) {
    throw new Error("APK_CACHE_DIRECTORY_UNAVAILABLE");
  }

  const safeName = update.apkName.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
  const destination =
    `${FileSystem.cacheDirectory}${safeName}`;

  await FileSystem.deleteAsync(destination, {
    idempotent: true,
  });

  const task = FileSystem.createDownloadResumable(
    update.downloadUrl,
    destination,
    {},
    (progress) => {
      const expected =
        progress.totalBytesExpectedToWrite;

      if (expected > 0) {
        onProgress?.(
          Math.min(
            1,
            progress.totalBytesWritten / expected
          )
        );
      }
    }
  );

  const result = await task.downloadAsync();

  if (!result?.uri) {
    throw new Error("APK_DOWNLOAD_FAILED");
  }

  onProgress?.(1);
  return result.uri;
}

export async function installDownloadedApk(
  fileUri: string
) {
  if (Platform.OS !== "android") {
    throw new Error("APK_INSTALL_ANDROID_ONLY");
  }

  const contentUri =
    await FileSystem.getContentUriAsync(fileUri);

  await IntentLauncher.startActivityAsync(
    "android.intent.action.VIEW",
    {
      data: contentUri,
      type: APK_MIME_TYPE,
      flags: 1,
    }
  );
}

export async function checkForOtaUpdate(): Promise<OtaUpdateCheck> {
  if (__DEV__) {
    return {
      status: "unavailable",
      reason: "OTA updates are disabled in development mode.",
    };
  }

  if (!Updates.isEnabled) {
    return {
      status: "unavailable",
      reason: "EAS Update is not enabled in this build.",
    };
  }

  try {
    const result = await Updates.checkForUpdateAsync();

    return result.isAvailable
      ? { status: "available" }
      : { status: "up-to-date" };
  } catch (error) {
    return {
      status: "unavailable",
      reason: String(error),
    };
  }
}

export async function fetchOtaUpdate() {
  if (__DEV__ || !Updates.isEnabled) {
    return false;
  }

  const result = await Updates.fetchUpdateAsync();
  return result.isNew;
}

export async function reloadToOtaUpdate() {
  await Updates.reloadAsync();
}
