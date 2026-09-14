import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import QRScanner from "../components/QRScanner";
import {
  establishFoundingOfficial,
} from "../services/authorization";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type Mode =
  | "instructions"
  | "scanner"
  | "manual";

export default function FoundingOfficialSetupScreen() {
  const params =
    useLocalSearchParams<{
      userId?: string;
      username?: string;
      fullName?: string;
      selectedRole?: string;
    }>();

  const userId =
    typeof params.userId === "string"
      ? params.userId
      : "";

  const username =
    typeof params.username === "string"
      ? params.username
      : "";

  const fullName =
    typeof params.fullName === "string"
      ? params.fullName
      : "";

  const selectedRole =
    typeof params.selectedRole === "string"
      ? params.selectedRole
      : "";

  const [permission, requestPermission] =
    useCameraPermissions();

  const [mode, setMode] =
    useState<Mode>("instructions");

  const [manualValue, setManualValue] =
    useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [hasScanned, setHasScanned] =
    useState(false);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [torchEnabled, setTorchEnabled] =
    useState(false);

  const [scannerSession, setScannerSession] =
    useState(0);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function processAuthorization(
    authorizationData: string
  ) {
    if (
      isProcessing ||
      !authorizationData.trim()
    ) {
      return false;
    }

    try {
      setIsProcessing(true);
      setError("");
      setSuccess("");

      await establishFoundingOfficial({
        userId,
        fullName,
        selectedRole,
        authorizationData:
          authorizationData.trim(),
      });

      setSuccess(
        `Founding authorization verified. This account is now a verified SK ${selectedRole}.`
      );

      setMode("instructions");

      setTimeout(() => {
        router.replace("/home");
      }, 1200);

      return true;
    } catch (processError) {
      console.error(
        "Founding authorization error:",
        processError
      );

      const message =
        processError instanceof Error
          ? processError.message
          : "";

      if (
        message ===
        "INVALID_OFFICIAL_ROLE"
      ) {
        setError(
          "Please go back and select a valid SK position."
        );
      } else if (
        message ===
        "FOUNDING_ALREADY_COMPLETED"
      ) {
        setError(
          "Founding setup has already been completed on this device."
        );
      } else if (
        message === "USER_NOT_FOUND"
      ) {
        setError(
          "This account could not be found. Please sign in again."
        );
      } else {
        setError(
          "This is not a valid SK Kabunga-an Founding Official authorization."
        );
      }

      setHasScanned(false);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }

  async function openScanner() {
    setError("");
    setSuccess("");

    if (!permission?.granted) {
      const result =
        await requestPermission();

      if (!result.granted) {
        setError(
          "Camera permission is required to scan the Founding Official QR."
        );
        return;
      }
    }

    setHasScanned(false);
    setCameraReady(false);
    setTorchEnabled(false);
    setScannerSession(
      (current) => current + 1
    );
    setMode("scanner");
  }

  if (mode === "scanner") {
    return (
      <QRScanner
        title="Scan Founding Official QR"
        hint="Only QR codes fully inside the frame will scan"
        errorMessage={error}
        onClose={() => {
          setHasScanned(false);
          setCameraReady(false);
          setTorchEnabled(false);
          setError("");
          setMode("instructions");
        }}
        onScan={async (data) =>
          processAuthorization(data)
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Founding Official
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {(
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.foundingIcon}
          >
            <Ionicons
              name="key-outline"
              size={42}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>
            Establish the first verified official
          </Text>

          <Text style={styles.description}>
            This one-time setup establishes the
            trusted SK Kabunga-an organization on
            this device and verifies the current
            account as the selected SK official.
          </Text>

          <View style={styles.identityBox}>
            <Text style={styles.identityLabel}>
              Founding account
            </Text>

            <Text style={styles.identityName}>
              {fullName ||
                "Name not available"}
            </Text>

            {username ? (
              <Text style={styles.identityUsername}>
                @{username}
              </Text>
            ) : null}

            <View style={styles.roleRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.roleText}>
                Position after verification:{" "}
                {selectedRole ||
                  "Not selected"}
              </Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Ionicons
              name="warning-outline"
              size={21}
              color={colors.warning}
            />

            <Text style={styles.warningText}>
              The Founding Official QR is a private
              deployment credential. Do not post it
              in group chats or social media.
            </Text>
          </View>

          {mode === "manual" ? (
            <>
              <Text style={styles.label}>
                Founding Authorization Code
              </Text>

              <TextInput
                style={styles.codeInput}
                value={manualValue}
                onChangeText={(value) => {
                  setManualValue(value);
                  setError("");
                }}
                placeholder="Paste the private authorization text here"
                placeholderTextColor={
                  colors.textMuted
                }
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isProcessing}
              />

              {error ? (
                <Text style={styles.errorText}>
                  {error}
                </Text>
              ) : null}

              {success ? (
                <Text
                  style={styles.successText}
                >
                  {success}
                </Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed &&
                    !isProcessing &&
                    styles.pressed,
                  isProcessing &&
                    styles.disabled,
                ]}
                onPress={() =>
                  processAuthorization(
                    manualValue
                  )
                }
                disabled={isProcessing}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isProcessing
                    ? "Verifying..."
                    : "Verify Authorization"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setMode(
                    "instructions"
                  );
                  setError("");
                }}
                disabled={isProcessing}
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Back
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              {error ? (
                <Text style={styles.errorText}>
                  {error}
                </Text>
              ) : null}

              {success ? (
                <Text
                  style={styles.successText}
                >
                  {success}
                </Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={openScanner}
                disabled={isProcessing}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={21}
                  color={colors.white}
                />

                <Text
                  style={[
                    styles.primaryButtonText,
                    styles.buttonTextWithIcon,
                  ]}
                >
                  Scan Founding QR
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setMode("manual");
                  setError("");
                }}
                disabled={isProcessing}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={19}
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.secondaryButtonText,
                    styles.buttonTextWithIcon,
                  ]}
                >
                  Paste Authorization Code
                </Text>
              </Pressable>
            </>
          )}

          <Text style={styles.footer}>
            This authorization establishes the first
            trusted official on this device. The first
            official may be Chairperson, Secretary,
            Treasurer, or Kagawad.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
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
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  headerSpacer: {
    width: 44,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  foundingIcon: {
    width: 76,
    height: 76,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 38,
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  title: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  description: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },

  identityBox: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  identityLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  identityName: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  identityUsername: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },

  roleText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight:
      typography.fontWeight.medium,
  },

  warningBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 12,
    backgroundColor:
      "rgba(217,119,6,0.05)",
  },

  warningText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  label: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  codeInput: {
    minHeight: 150,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: 11,
    lineHeight: 16,
    color: colors.text,
    textAlignVertical: "top",
  },

  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.danger,
  },

  successText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.success,
  },

  primaryButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  primaryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  secondaryButton: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },

  secondaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  buttonTextWithIcon: {
    marginLeft: spacing.sm,
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.6,
  },

  footer: {
    marginTop: spacing.xl,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: "center",
  },

  simpleScanner: {
    flex: 1,
    backgroundColor: colors.black,
  },

  simpleCamera: {
    flex: 1,
    width: "100%",
  },

  referenceOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  topControls: {
    position: "absolute",
    top: 46,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  flashButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    backgroundColor:
      "rgba(0,0,0,0.62)",
  },

  flashText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  closeButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },

  closeText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  controlPressed: {
    opacity: 0.7,
  },

  scanWindowWrap: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    top: "43%",
    alignItems: "center",
  },

  scanWindow: {
    width: "100%",
    maxWidth: 350,
    aspectRatio: 1.6,
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: 22,
    backgroundColor:
      "rgba(255,255,255,0.02)",
  },

  scanHint: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    top: "68%",
    alignItems: "center",
  },

  scanHintText: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
    backgroundColor:
      "rgba(0,0,0,0.58)",
    textAlign: "center",
  },

  cameraStatusPill: {
    position: "absolute",
    alignSelf: "center",
    top: "32%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor:
      "rgba(0,0,0,0.56)",
  },

  cameraStatusText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },

  scanErrorBox: {
    elevation: 3,
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: 64,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor:
      "rgba(127,29,29,0.88)",
  },

  simpleScanError: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.white,
    textAlign: "center",
  },

  scannerScreen: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.black,
  },

  fullCamera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  scannerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraStatus: {
    position: "absolute",
    top: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor:
      "rgba(0,0,0,0.48)",
  },

  scanGuide: {
    width: 270,
    height: 270,
    position: "relative",
    transform: [{ translateY: -36 }],
  },

  corner: {
    position: "absolute",
    width: 58,
    height: 58,
    borderColor: colors.white,
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },

  guideLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -42,
    alignItems: "center",
  },

  guideLabelText: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
    backgroundColor:
      "rgba(0,0,0,0.52)",
  },

  errorPill: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: 92,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor:
      "rgba(127,29,29,0.88)",
  },

  scanError: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.white,
    textAlign: "center",
  },

  cancelScanButton: {
    position: "absolute",
    bottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.72)",
    borderRadius: 999,
    backgroundColor:
      "rgba(0,0,0,0.50)",
  },

  cancelScanText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  cancelPressed: {
    opacity: 0.72,
  },
});
