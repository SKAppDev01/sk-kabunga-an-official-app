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
  generateOfficialDataQr,
  OfficialQrGeneration,
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
    return "A verified SK official account is required to generate an Officials QR.";
  }

  if (
    message.includes(
      "SIGNING_KEY_UNAVAILABLE"
    )
  ) {
    return "This device can receive official data but does not have the organization signing key required to generate a signed Officials QR.";
  }

  if (
    message.includes(
      "ORGANIZATION_NOT_ESTABLISHED"
    )
  ) {
    return "The SK organization security profile has not been established on this device.";
  }

  return "Unable to generate the encrypted Officials QR.";
}

export default function OfficialDataQrScreen() {
  const [
    generation,
    setGeneration,
  ] =
    useState<
      OfficialQrGeneration | null
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
            await generateOfficialDataQr();

          setGeneration(result);
        } catch (loadError) {
          console.error(
            "Official QR generation error:",
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
          label: "SK-Kabunga-an-Officials-QR",
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
        "HD QR save error:",
        saveError
      );

      Alert.alert(
        "Unable to Save QR",
        "The HD QR image could not be saved."
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
        label: "SK-Kabunga-an-Officials-QR",
      });
    } catch (shareError) {
      console.error(
        "QR image share error:",
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
          : "The QR image could not be shared."
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
          Officials QR
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
          Encrypted Quick Sync
        </Text>

        <Text style={styles.subtitle}>
          Creates a signed and encrypted QR
          package for verified SK official
          devices. The QR contains no readable
          plaintext official records.
        </Text>

        {isLoading ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>
              Encrypting quick-sync data...
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
              <Text
                style={styles.summaryLabel}
              >
                Records in quick sync
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {generation.recordCount}
              </Text>
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
                  There are no transferable
                  records yet.
                </Text>
              </View>
            ) : !generation.fitsQr ? (
              <>
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
                    The encrypted package is
                    {` ${generation.byteSize} `}
                    bytes. Reliable QR
                    transfer is limited to
                    about
                    {` ${QR_MAX_UTF8_BYTES} `}
                    bytes.
                  </Text>
                </View>

                <Pressable
                  style={styles.fileButton}
                  onPress={() =>
                    router.replace(
                      "/export-data"
                    )
                  }
                >
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={colors.primary}
                  />

                  <Text
                    style={styles.fileButtonText}
                  >
                    Use Export Data Instead
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
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
                  On the receiving verified
                  official device, open
                  Receive / Scan.
                </Text>

                <Text style={styles.sizeText}>
                  {generation.byteSize} bytes
                  {" • "}
                  encrypted
                </Text>
              </View>
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
              </>
            )}

            <View style={styles.securityBox}>
              <Ionicons
                name="lock-closed-outline"
                size={21}
                color={colors.primary}
              />

              <Text
                style={styles.securityText}
              >
                Records are encrypted using
                the SK organization official
                data key and authenticated by
                the organization signature.
                A device without the matching
                verified organization key
                cannot decrypt the QR.
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={colors.textMuted}
              />

              <Text style={styles.infoText}>
                Officials QR is for small
                quick-sync packages. Larger
                databases should use the
                .skdata Export / Import
                workflow.
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
    backgroundColor: "#E3F2FD",
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
    elevation: 3,
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
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  summaryLabel: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  summaryValue: {
    minWidth: 56,
    flexShrink: 0,
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.primary,
    textAlign: "right",
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
  qrCard: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  qrBackground: {
    elevation: 3,
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
    elevation: 3,
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
    elevation: 3,
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
  fileButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  fileButtonText: {
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  securityBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
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
  infoBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
