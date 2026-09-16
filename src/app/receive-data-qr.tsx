import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useState,
} from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppHeader";

import QRScanner from "../components/QRScanner";
import {
  decodeScannedDataQr,
  importScannedOfficialQr,
  ScannedDataQr,
} from "../services/qr-data-sharing";
import {
  pickAndScanQrImage,
} from "../services/qr-image";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }
  ).format(value);
}

function getScanError(
  error: unknown
) {
  const message =
    String(error);

  if (
    message.includes(
      "VERIFIED_OFFICIAL_REQUIRED"
    )
  ) {
    return "This is an Officials QR. Sign in with a verified SK official account to decrypt it.";
  }

  if (
    message.includes(
      "OFFICIAL_QR_DIFFERENT_ORGANIZATION"
    )
  ) {
    return "This Officials QR belongs to a different organization security profile.";
  }

  if (
    message.includes(
      "OFFICIAL_QR_DECRYPT_FAILED"
    )
  ) {
    return "This device does not have the matching official data key for this QR.";
  }

  if (
    message.includes(
      "INVALID_PUBLIC_QR_SIGNATURE"
    ) ||
    message.includes(
      "INVALID_OFFICIAL_QR_SIGNATURE"
    ) ||
    message.includes(
      "INVALID_ORGANIZATION_CERTIFICATE"
    )
  ) {
    return "The QR signature could not be verified. Do not trust or import this QR.";
  }

  if (
    message.includes(
      "QR_NOT_FOUND_IN_IMAGE"
    )
  ) {
    return "No QR code was found in the selected image.";
  }

  if (
    message.includes(
      "UNRECOGNIZED_QR"
    )
  ) {
    return "This is not a supported SK Kabunga-an data QR.";
  }

  return "The QR could not be verified or decoded.";
}

export default function ReceiveDataQrScreen() {
  const [
    scannerOpen,
    setScannerOpen,
  ] = useState(false);

  const [
    result,
    setResult,
  ] =
    useState<
      ScannedDataQr | null
    >(null);

  const [
    scanError,
    setScanError,
  ] = useState("");

  const [
    isImporting,
    setIsImporting,
  ] = useState(false);

  const [
    isReadingImage,
    setIsReadingImage,
  ] = useState(false);

  async function handleScan(
    value: string
  ) {
    try {
      setScanError("");

      const decoded =
        await decodeScannedDataQr(
          value
        );

      setResult(decoded);
      setScannerOpen(false);

      return true;
    } catch (error) {
      console.error(
        "Data QR decode error:",
        error
      );

      setScanError(
        getScanError(error)
      );

      return false;
    }
  }

  async function handleUploadQrImage() {
    try {
      setScannerOpen(false);
      setScanError("");
      setIsReadingImage(true);

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            120
          )
      );

      const picked =
        await pickAndScanQrImage();

      if (!picked) {
        return;
      }

      const decoded =
        await decodeScannedDataQr(
          picked.rawValue
        );

      setResult(decoded);
    } catch (error) {
      console.error(
        "QR image upload error:",
        error
      );

      setResult(null);
      setScanError(
        getScanError(error)
      );
    } finally {
      setIsReadingImage(false);
    }
  }

  function handleImportOfficial() {
    if (
      !result ||
      result.kind !== "official"
    ) {
      return;
    }

    if (
      result.preview.newRecords === 0
    ) {
      Alert.alert(
        "Nothing New to Import",
        result.preview
          .conflictingRecords > 0
          ? "No new records were found. Conflicting records are intentionally skipped."
          : "All records in this QR already exist on this device."
      );
      return;
    }

    Alert.alert(
      "Import Officials QR",
      `Import ${result.preview.newRecords} new record(s)? Duplicates and conflicts will be skipped.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Import",
          onPress: async () => {
            try {
              setIsImporting(true);

              const imported =
                await importScannedOfficialQr(
                  result.dataPackage
                );

              Alert.alert(
                "Import Complete",
                [
                  `${imported.importedRecords} new record(s) imported.`,
                  `${imported.duplicateRecords} duplicate record(s) skipped.`,
                  `${imported.conflictingRecords} conflicting record(s) skipped.`,
                  imported.failedRecords > 0
                    ? `${imported.failedRecords} record(s) could not be imported.`
                    : null,
                ]
                  .filter(Boolean)
                  .join("\n"),
                [
                  {
                    text: "OK",
                    onPress: () => {
                      setResult(null);
                      setScanError("");
                    },
                  },
                ]
              );
            } catch (error) {
              console.error(
                "Officials QR import error:",
                error
              );

              Alert.alert(
                "Import Failed",
                "The Officials QR records could not be imported."
              );
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  }

  if (scannerOpen) {
    return (
      <QRScanner
        title="Receive Data QR"
        hint="Scan a Public QR or Officials QR"
        errorMessage={
          scanError
        }
        onClose={() => {
          setScannerOpen(false);
          setScanError("");
        }}
        onUploadImage={
          handleUploadQrImage
        }
        onScan={handleScan}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Receive / Scan"
        showBack
      />
      

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {!result ? (
          <>
            <View style={styles.scanHero}>
              <Ionicons
                name="scan-outline"
                size={58}
                color={colors.primary}
              />

              <Text
                style={styles.scanTitle}
              >
                Scan Offline Data
              </Text>

              <Text
                style={styles.scanText}
              >
                Public QR packages are
                verified and displayed
                read-only. Officials QR
                packages require a verified
                official device and are
                decrypted locally.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.scanButton,
                pressed &&
                  styles.pressed,
              ]}
              onPress={() => {
                setScanError("");
                setScannerOpen(true);
              }}
            >
              <Ionicons
                name="camera-outline"
                size={21}
                color={colors.white}
              />

              <Text
                style={styles.scanButtonText}
              >
                Open QR Scanner
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                (pressed ||
                  isReadingImage) &&
                  styles.pressed,
              ]}
              onPress={
                handleUploadQrImage
              }
              disabled={isReadingImage}
            >
              <Ionicons
                name="images-outline"
                size={21}
                color={colors.primary}
              />

              <Text
                style={styles.uploadButtonText}
              >
                {isReadingImage
                  ? "Reading QR Image..."
                  : "Upload QR Image"}
              </Text>
            </Pressable>

            {scanError ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.danger}
                />

                <Text
                  style={styles.errorText}
                >
                  {scanError}
                </Text>
              </View>
            ) : null}

            <View style={styles.infoBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color={colors.primary}
              />

              <Text style={styles.infoText}>
                The scanner uses the bundled
                offline QR engine already in
                the Development Build. No
                internet connection is needed
                to verify, decrypt or preview
                these QR packages.
              </Text>
            </View>
          </>
        ) : result.kind === "public" ? (
          <>
            <View style={styles.validHeader}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color="#047857"
              />

              <View
                style={styles.validText}
              >
                <Text
                  style={styles.validTitle}
                >
                  Verified Public QR
                </Text>

                <Text
                  style={styles.validMeta}
                >
                  {result.organizationName}
                  {" • "}
                  {formatDateTime(
                    result.payload
                      .generatedAt
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.publicNotice}>
              <Ionicons
                name="eye-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={styles.publicNoticeText}
              >
                Public QR data is read-only.
                It is not merged into the
                official local database.
              </Text>
            </View>

            <Text
              style={styles.sectionTitle}
            >
              Projects
            </Text>

            {result.payload.projects
              .length === 0 ? (
              <Text
                style={styles.emptyText}
              >
                No public projects.
              </Text>
            ) : (
              result.payload.projects.map(
                (project) => (
                  <View
                    key={project.id}
                    style={styles.recordRow}
                  >
                    <Text
                      style={styles.recordTitle}
                    >
                      {project.title}
                    </Text>

                    <Text
                      style={styles.recordMeta}
                    >
                      {project.status}
                      {" • "}
                      {formatMoney(
                        project.budget
                      )}
                    </Text>

                    {project.description ? (
                      <Text
                        style={styles.recordDescription}
                      >
                        {project.description}
                      </Text>
                    ) : null}
                  </View>
                )
              )
            )}

            <Text
              style={styles.sectionTitle}
            >
              Budget
            </Text>

            {result.payload.budget
              .length === 0 ? (
              <Text
                style={styles.emptyText}
              >
                No public budget records.
              </Text>
            ) : (
              result.payload.budget.map(
                (item) => (
                  <View
                    key={item.id}
                    style={styles.recordRow}
                  >
                    <Text
                      style={styles.recordTitle}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={styles.recordMeta}
                    >
                      {formatMoney(
                        item.amount
                      )}
                      {item.projectTitle
                        ? ` • ${item.projectTitle}`
                        : ""}
                    </Text>
                  </View>
                )
              )
            )}

            <Text
              style={styles.sectionTitle}
            >
              Expenses
            </Text>

            {result.payload.expenses
              .length === 0 ? (
              <Text
                style={styles.emptyText}
              >
                No public expense records.
              </Text>
            ) : (
              result.payload.expenses.map(
                (item) => (
                  <View
                    key={item.id}
                    style={styles.recordRow}
                  >
                    <Text
                      style={styles.recordTitle}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={styles.recordMeta}
                    >
                      {formatMoney(
                        item.amount
                      )}
                      {" • "}
                      {item.expenseDate}
                    </Text>
                  </View>
                )
              )
            )}

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                setResult(null)
              }
            >
              <Text
                style={styles.secondaryButtonText}
              >
                Scan Another QR
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.validHeader}>
              <Ionicons
                name="lock-closed"
                size={26}
                color={colors.primary}
              />

              <View
                style={styles.validText}
              >
                <Text
                  style={styles.validTitle}
                >
                  Verified Officials QR
                </Text>

                <Text
                  style={styles.validMeta}
                >
                  {result.organizationName}
                  {" • "}
                  {formatDateTime(
                    result.preview
                      .generatedAt
                  )}
                </Text>
              </View>
            </View>

            <View
              style={styles.previewList}
            >
              <View
                style={styles.previewRow}
              >
                <Text
                  style={styles.previewLabel}
                >
                  Package Records
                </Text>

                <Text
                  style={styles.previewValue}
                >
                  {result.preview.recordCount}
                </Text>
              </View>

              <View
                style={styles.previewRow}
              >
                <Text
                  style={styles.previewLabel}
                >
                  New Records
                </Text>

                <Text
                  style={[
                    styles.previewValue,
                    styles.newValue,
                  ]}
                >
                  {result.preview.newRecords}
                </Text>
              </View>

              <View
                style={styles.previewRow}
              >
                <Text
                  style={styles.previewLabel}
                >
                  Duplicates
                </Text>

                <Text
                  style={styles.previewValue}
                >
                  {result.preview.duplicateRecords}
                </Text>
              </View>

              <View
                style={styles.previewRow}
              >
                <Text
                  style={styles.previewLabel}
                >
                  Conflicts
                </Text>

                <Text
                  style={[
                    styles.previewValue,
                    result.preview
                      .conflictingRecords >
                      0 &&
                      styles.conflictValue,
                  ]}
                >
                  {result.preview.conflictingRecords}
                </Text>
              </View>
            </View>

            {result.preview
              .conflictingRecords > 0 ? (
              <View style={styles.warningBox}>
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color="#B45309"
                />

                <Text
                  style={styles.warningText}
                >
                  Conflicting records are
                  never overwritten by QR
                  import. They will be
                  skipped.
                </Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.importButton,
                (pressed ||
                  isImporting ||
                  result.preview
                    .newRecords === 0) &&
                  styles.pressed,
              ]}
              onPress={
                handleImportOfficial
              }
              disabled={
                isImporting ||
                result.preview
                  .newRecords === 0
              }
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.white}
              />

              <Text
                style={styles.importButtonText}
              >
                {isImporting
                  ? "Importing..."
                  : `Import ${result.preview.newRecords} New Record${result.preview.newRecords === 1 ? "" : "s"}`}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                setResult(null)
              }
              disabled={isImporting}
            >
              <Text
                style={styles.secondaryButtonText}
              >
                Scan Another QR
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },
  header: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4,
    zIndex: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom:
      spacing.xxxl,
  },
  scanHero: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal:
      spacing.md,
  },
  scanTitle: {
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  scanText: {
    width: "100%",
    maxWidth: 330,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
    textAlign: "center",
  },
  scanButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
  },
  scanButtonText: {
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  uploadButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  uploadButtonText: {
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.6,
  },
  errorBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.danger,
  },
  infoBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },
  validHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  validText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  validTitle: {
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  validMeta: {
    marginTop: 3,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
  },
  publicNotice: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  publicNoticeText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  recordRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  recordTitle: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  recordMeta: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color:
      colors.textSecondary,
  },
  recordDescription: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
  },
  emptyText: {
    width: "100%",
    paddingVertical: spacing.lg,
    fontSize:
      typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  previewList: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  previewRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  previewLabel: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize:
      typography.fontSize.sm,
    color:
      colors.textSecondary,
  },
  previewValue: {
    minWidth: 70,
    flexShrink: 0,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "right",
  },
  newValue: {
    color: "#047857",
  },
  conflictValue: {
    color: "#B45309",
  },
  warningBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
  },
  warningText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color: "#92400E",
  },
  importButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
  },
  importButtonText: {
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  secondaryButtonText: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
});
