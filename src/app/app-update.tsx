import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  checkForGitHubApkUpdate,
  checkForOtaUpdate,
  downloadApk,
  fetchOtaUpdate,
  getCurrentAppVersion,
  installDownloadedApk,
  type GitHubUpdateCheck,
  type NativeUpdateInfo,
  type OtaUpdateCheck,
  reloadToOtaUpdate,
} from "../services/app-updater";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type ScreenState =
  | "checking"
  | "ready"
  | "downloading"
  | "installing"
  | "ota-downloading"
  | "ota-ready"
  | "error";

export default function AppUpdateScreen() {
  const [screenState, setScreenState] =
    useState<ScreenState>("checking");
  const [nativeCheck, setNativeCheck] =
    useState<GitHubUpdateCheck | null>(null);
  const [otaCheck, setOtaCheck] =
    useState<OtaUpdateCheck | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState(0);
  const [errorMessage, setErrorMessage] =
    useState("");

  const currentVersion = getCurrentAppVersion();

  const checkForUpdates = useCallback(async () => {
    setScreenState("checking");
    setDownloadProgress(0);
    setErrorMessage("");

    try {
      const githubResult =
        await checkForGitHubApkUpdate();
      setNativeCheck(githubResult);

      if (githubResult.status === "available") {
        setOtaCheck(null);
        setScreenState("ready");
        return;
      }

      const easResult = await checkForOtaUpdate();
      setOtaCheck(easResult);
      setScreenState("ready");
    } catch (error) {
      console.error("Manual app update check failed:", error);
      setErrorMessage(
        "Unable to check for updates. Check your internet connection and try again."
      );
      setScreenState("error");
    }
  }, []);

  useEffect(() => {
    void checkForUpdates();
  }, [checkForUpdates]);

  async function handleDownloadAndInstall(
    update: NativeUpdateInfo
  ) {
    try {
      setScreenState("downloading");
      setDownloadProgress(0);

      const apkUri = await downloadApk(
        update,
        setDownloadProgress
      );

      setScreenState("installing");
      await installDownloadedApk(apkUri);
      setScreenState("ready");
    } catch (error) {
      console.error("APK update failed:", error);
      setScreenState("error");
      setErrorMessage(
        "The APK could not be downloaded or opened. If Android asks, allow this app to install unknown apps and try again."
      );
    }
  }

  async function handleOtaDownload() {
    try {
      setScreenState("ota-downloading");
      const downloaded = await fetchOtaUpdate();

      if (!downloaded) {
        setScreenState("ready");
        Alert.alert(
          "No Update Downloaded",
          "There is no compatible EAS update to download right now."
        );
        return;
      }

      setScreenState("ota-ready");
    } catch (error) {
      console.error("OTA update download failed:", error);
      setScreenState("error");
      setErrorMessage(
        "The compatible app update could not be downloaded. Please try again."
      );
    }
  }

  function handleRestartToOta() {
    void reloadToOtaUpdate();
  }

  const nativeUpdate =
    nativeCheck?.status === "available"
      ? nativeCheck.update
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>App Updates</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.versionCard}>
          <View style={styles.updateIcon}>
            <Ionicons
              name="cloud-download-outline"
              size={28}
              color={colors.primary}
            />
          </View>

          <View style={styles.versionContent}>
            <Text style={styles.versionLabel}>
              Installed Version
            </Text>
            <Text style={styles.versionValue}>
              v{currentVersion}
            </Text>
          </View>
        </View>

        {screenState === "checking" ? (
          <View style={styles.stateCard}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
            <Text style={styles.stateTitle}>
              Checking for updates...
            </Text>
            <Text style={styles.stateText}>
              Checking GitHub Releases and compatible EAS updates.
            </Text>
          </View>
        ) : null}

        {nativeUpdate ? (
          <View style={styles.releaseCard}>
            <View style={styles.releaseHeader}>
              <View style={styles.releaseBadge}>
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.releaseBadgeText}>
                  New APK Release
                </Text>
              </View>

              <Text style={styles.releaseVersion}>
                v{nativeUpdate.version}
              </Text>
            </View>

            <Text style={styles.releaseTitle}>
              {nativeUpdate.title}
            </Text>

            <Text style={styles.releaseMeta}>
              {formatBytes(nativeUpdate.sizeBytes)}
              {nativeUpdate.publishedAt
                ? ` • ${formatReleaseDate(
                    nativeUpdate.publishedAt
                  )}`
                : ""}
            </Text>

            <Text style={styles.notesHeading}>
              Release Notes
            </Text>
            <Text style={styles.releaseNotes}>
              {nativeUpdate.notes}
            </Text>

            {screenState === "downloading" ? (
              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(
                          downloadProgress * 100
                        )}%` as `${number}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Downloading... {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
            ) : null}

            <Pressable
              disabled={
                screenState === "downloading" ||
                screenState === "installing"
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                (screenState === "downloading" ||
                  screenState === "installing") &&
                  styles.disabledButton,
              ]}
              onPress={() =>
                void handleDownloadAndInstall(nativeUpdate)
              }
            >
              {screenState === "downloading" ||
              screenState === "installing" ? (
                <ActivityIndicator
                  size="small"
                  color={colors.white}
                />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.white}
                />
              )}
              <Text style={styles.primaryButtonText}>
                {screenState === "installing"
                  ? "Opening Installer..."
                  : "Download & Install"}
              </Text>
            </Pressable>

            <Text style={styles.installNote}>
              Android will ask you to confirm the installation. Your existing local app data stays on this device when the APK is signed with the same app key.
            </Text>
          </View>
        ) : null}

        {!nativeUpdate &&
        screenState !== "checking" &&
        screenState !== "error" ? (
          <View style={styles.stateCard}>
            <Ionicons
              name={
                otaCheck?.status === "available" ||
                screenState === "ota-ready"
                  ? "cloud-download-outline"
                  : "checkmark-circle-outline"
              }
              size={34}
              color={
                otaCheck?.status === "available" ||
                screenState === "ota-ready"
                  ? colors.primary
                  : colors.success
              }
            />

            <Text style={styles.stateTitle}>
              {otaCheck?.status === "available" ||
              screenState === "ota-ready"
                ? "Compatible update available"
                : "You're up to date"}
            </Text>

            <Text style={styles.stateText}>
              {otaCheck?.status === "available" ||
              screenState === "ota-ready"
                ? "A JavaScript/assets update can be applied without installing a new APK."
                : getNoUpdateMessage(nativeCheck, otaCheck)}
            </Text>

            {otaCheck?.status === "available" &&
            screenState !== "ota-ready" ? (
              <Pressable
                disabled={screenState === "ota-downloading"}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                  screenState === "ota-downloading" &&
                    styles.disabledButton,
                ]}
                onPress={() => void handleOtaDownload()}
              >
                {screenState === "ota-downloading" ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.white}
                  />
                ) : (
                  <Ionicons
                    name="cloud-download-outline"
                    size={20}
                    color={colors.white}
                  />
                )}
                <Text style={styles.primaryButtonText}>
                  Download App Update
                </Text>
              </Pressable>
            ) : null}

            {screenState === "ota-ready" ? (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleRestartToOta}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.primaryButtonText}>
                  Restart to Apply Update
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {screenState === "error" ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={colors.danger}
            />
            <View style={styles.errorTextWrap}>
              <Text style={styles.errorTitle}>
                Update check failed
              </Text>
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
          onPress={() => void checkForUpdates()}
          disabled={screenState === "checking"}
        >
          <Ionicons
            name="refresh-outline"
            size={19}
            color={colors.primary}
          />
          <Text style={styles.secondaryButtonText}>
            Check Again
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatBytes(value: number) {
  if (!value || value < 1) return "APK download";
  const megabytes = value / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function formatReleaseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getNoUpdateMessage(
  nativeCheck: GitHubUpdateCheck | null,
  otaCheck: OtaUpdateCheck | null
) {
  if (nativeCheck?.status === "no-apk") {
    return `GitHub has v${nativeCheck.latestVersion}, but that release does not contain an APK asset yet.`;
  }

  if (nativeCheck?.status === "no-release") {
    return "No published GitHub APK release exists yet. The app will keep checking future releases.";
  }

  if (otaCheck?.status === "unavailable" && __DEV__) {
    return "The GitHub APK check is current. EAS Update checks are disabled while using the development server.";
  }

  return "No newer GitHub APK or compatible EAS update is available right now.";
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  versionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    elevation: 2,
  },
  updateIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  versionContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  versionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  versionValue: {
    marginTop: 2,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  stateCard: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  stateTitle: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  releaseCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    elevation: 2,
  },
  releaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  releaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  releaseBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  releaseVersion: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  releaseTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  releaseMeta: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  notesHeading: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  releaseNotes: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  progressSection: {
    marginTop: spacing.lg,
  },
  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  progressText: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 50,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  disabledButton: {
    opacity: 0.65,
  },
  installNote: {
    marginTop: spacing.md,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  errorTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  errorTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
  },
  errorText: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  secondaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.72,
  },
});
