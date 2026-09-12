import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useRef,
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
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  generatePublicDataQr,
  PublicQrGeneration,
  QR_MAX_UTF8_BYTES,
} from "../services/qr-data-sharing";
import {
  saveQrPngBase64,
  shareQrPngBase64,
} from "../services/qr-image";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function getErrorMessage(
  error: unknown
) {
  const message =
    String(error);

  if (
    message.includes(
      "VERIFIED_OFFICIAL_REQUIRED"
    )
  ) {
    return "A verified SK official account is required to generate a Public QR.";
  }

  if (
    message.includes(
      "SIGNING_KEY_UNAVAILABLE"
    )
  ) {
    return "This device does not have the organization signing key required to generate signed QR packages.";
  }

  if (
    message.includes(
      "ORGANIZATION_NOT_ESTABLISHED"
    )
  ) {
    return "The SK organization security profile has not been established on this device.";
  }

  return "Unable to generate the Public QR.";
}

export default function PublicDataQrScreen() {
  const [
    generation,
    setGeneration,
  ] =
    useState<
      PublicQrGeneration | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const hdQrRef =
    useRef<any>(null);

  const [
    imageAction,
    setImageAction,
  ] = useState<
    "save" | "share" | null
  >(null);

  const generate =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const result =
            await generatePublicDataQr();

          setGeneration(result);
        } catch (loadError) {
          console.error(
            "Public QR generation error:",
            loadError
          );

          setGeneration(null);
          setError(
            getErrorMessage(
              loadError
            )
          );
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      generate();
    }, [generate])
  );

  const hasRecords =
    (generation?.recordCount || 0) >
    0;

  function getHdQrBase64() {
    return new Promise<string>(
      (resolve, reject) => {
        const qr =
          hdQrRef.current;

        if (
          !qr ||
          typeof qr.toDataURL !==
            "function"
        ) {
          reject(
            new Error(
              "QR_IMAGE_NOT_READY"
            )
          );
          return;
        }

        qr.toDataURL(
          (data: string) => {
            if (!data) {
              reject(
                new Error(
                  "QR_IMAGE_EMPTY"
                )
              );
              return;
            }

            resolve(data);
          }
        );
      }
    );
  }

  async function handleSaveHdQr() {
    if (!generation) {
      return;
    }

    try {
      setImageAction("save");

      const base64 =
        await getHdQrBase64();

      const result =
        await saveQrPngBase64({
          base64,
          label:
            "SK-Kabunga-an-Public-QR",
        });

      if (!result.saved) {
        return;
      }

      Alert.alert(
        "HD QR Saved",
        `${result.fileName} was saved to the folder you selected.`
      );
    } catch (saveError) {
      console.error(
        "HD Public QR save error:",
        saveError
      );

      Alert.alert(
        "Unable to Save QR",
        "The HD Public QR image could not be saved."
      );
    } finally {
      setImageAction(null);
    }
  }

  async function handleShareQrImage() {
    if (!generation) {
      return;
    }

    try {
      setImageAction("share");

      const base64 =
        await getHdQrBase64();

      await shareQrPngBase64({
        base64,
        label:
          "SK-Kabunga-an-Public-QR",
      });
    } catch (shareError) {
      console.error(
        "Public QR image share error:",
        shareError
      );

      Alert.alert(
        "Unable to Share QR",
        String(
          shareError
        ).includes(
          "SHARING_NOT_AVAILABLE"
        )
          ? "Sharing is not available on this device."
          : "The Public QR image could not be shared."
      );
    } finally {
      setImageAction(null);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text
          style={styles.headerTitle}
        >
          Public QR
        </Text>

        <Pressable
          style={styles.refreshButton}
          onPress={generate}
          disabled={isLoading}
        >
          <Ionicons
            name="refresh-outline"
            size={22}
            color={
              isLoading
                ? colors.textMuted
                : colors.primary
            }
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.title}>
          Public Read-Only QR
        </Text>

        <Text style={styles.subtitle}>
          Only project and finance records
          explicitly marked public/shareable
          are included. Youth Registry,
          receipts, notes and other private
          official data are excluded.
        </Text>

        {isLoading ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>
              Generating signed QR...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={colors.danger}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : generation ? (
          <>
            <View
              style={styles.summaryBox}
            >
              <View style={styles.metric}>
                <Text
                  style={styles.metricValue}
                >
                  {generation.projectCount}
                </Text>
                <Text
                  style={styles.metricLabel}
                >
                  Projects
                </Text>
              </View>

              <View
                style={styles.metricDivider}
              />

              <View style={styles.metric}>
                <Text
                  style={styles.metricValue}
                >
                  {generation.budgetCount}
                </Text>
                <Text
                  style={styles.metricLabel}
                >
                  Budget
                </Text>
              </View>

              <View
                style={styles.metricDivider}
              />

              <View style={styles.metric}>
                <Text
                  style={styles.metricValue}
                >
                  {generation.expenseCount}
                </Text>
                <Text
                  style={styles.metricLabel}
                >
                  Expenses
                </Text>
              </View>
            </View>

            {!hasRecords ? (
              <View style={styles.noticeBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.noticeText}
                >
                  No records are currently
                  marked public/shareable, so
                  there is nothing to place
                  in a Public QR.
                </Text>
              </View>
            ) : !generation.fitsQr ? (
              <View
                style={styles.warningBox}
              >
                <Ionicons
                  name="warning-outline"
                  size={21}
                  color="#B45309"
                />

                <Text
                  style={styles.warningText}
                >
                  The public package is
                  {` ${generation.byteSize} `}
                  bytes, which is larger than
                  the reliable QR limit of
                  {` ${QR_MAX_UTF8_BYTES} `}
                  bytes. Reduce the number of
                  records marked shareable
                  before generating again.
                </Text>
              </View>
            ) : (
              <View style={styles.qrCard}>
                <View
                  style={styles.qrBackground}
                >
                  <QRCode
                    value={
                      generation.encodedValue
                    }
                    size={270}
                    ecl="L"
                    backgroundColor="#FFFFFF"
                    color="#000000"
                  />
                </View>

                <Text style={styles.qrHint}>
                  Scan using SK Kabunga-an
                  Official App → Data
                  Management → Receive / Scan
                </Text>

                <Text style={styles.sizeText}>
                  {generation.byteSize} bytes
                  {" • "}
                  {generation.recordCount}
                  {" public record"}
                  {generation.recordCount ===
                  1
                    ? ""
                    : "s"}
                </Text>

                <View
                  pointerEvents="none"
                  style={styles.hiddenHdQr}
                >
                  <QRCode
                    value={
                      generation.encodedValue
                    }
                    size={1024}
                    quietZone={64}
                    ecl="L"
                    backgroundColor="#FFFFFF"
                    color="#000000"
                    getRef={(ref) => {
                      hdQrRef.current =
                        ref;
                    }}
                  />
                </View>

                <View
                  style={styles.imageActions}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.imagePrimaryButton,
                      (pressed ||
                        imageAction !== null) &&
                        styles.pressed,
                    ]}
                    onPress={
                      handleSaveHdQr
                    }
                    disabled={
                      imageAction !== null
                    }
                  >
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color={colors.white}
                    />

                    <Text
                      style={
                        styles.imagePrimaryText
                      }
                    >
                      {imageAction === "save"
                        ? "Saving..."
                        : "Save HD Image"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.imageSecondaryButton,
                      (pressed ||
                        imageAction !== null) &&
                        styles.pressed,
                    ]}
                    onPress={
                      handleShareQrImage
                    }
                    disabled={
                      imageAction !== null
                    }
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={20}
                      color={colors.primary}
                    />

                    <Text
                      style={
                        styles.imageSecondaryText
                      }
                    >
                      {imageAction === "share"
                        ? "Preparing..."
                        : "Share QR Image"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.securityBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color={colors.primary}
              />

              <Text
                style={styles.securityText}
              >
                The Public QR is digitally
                signed by the SK organization.
                The receiving app verifies the
                organization certificate and
                signature before showing the
                records.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:
      spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom:
      spacing.xxxl,
  },
  title: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
  },
  stateBox: {
    alignItems: "center",
    marginTop: spacing.xxxl,
  },
  stateText: {
    fontSize:
      typography.fontSize.sm,
    color: colors.textMuted,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
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
  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  metricValue: {
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.primary,
  },
  metricLabel: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    paddingHorizontal: 2,
    fontSize: 9,
    lineHeight: 14,
    color:
      colors.textSecondary,
    textAlign: "center",
    flexShrink: 1,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor:
      colors.border,
  },
  hiddenHdQr: {
    position: "absolute",
    left: -3000,
    top: -3000,
    width: 1152,
    height: 1152,
    opacity: 0,
  },
  imageActions: {
    width: "100%",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  imagePrimaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
  },
  imagePrimaryText: {
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  imageSecondaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  imageSecondaryText: {
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.65,
  },
  qrCard: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  qrBackground: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  qrHint: {
    width: "100%",
    maxWidth: 310,
    marginTop: spacing.lg,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
    textAlign: "center",
  },
  sizeText: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  noticeText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
  },
  warningText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: "#92400E",
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
  },
  securityText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },
});
