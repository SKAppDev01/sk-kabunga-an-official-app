import { Ionicons } from "@expo/vector-icons";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  useBarcodeScannerOutput,
} from "@t-mrtgu/react-native-vision-camera-barcode-scanner";
import { StatusBar } from "expo-status-bar";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  colors,
  spacing,
  typography,
} from "../theme";

type QRScannerProps = {
  title?: string;
  hint?: string;
  errorMessage?: string;
  onUploadImage?: () => void;
  onClose: () => void;
  onScan:
    | ((data: string) => boolean)
    | ((data: string) => Promise<boolean>);
};

export default function QRScanner({
  title = "Scan QR Code",
  hint = "Place the QR code inside the frame",
  errorMessage = "",
  onUploadImage,
  onClose,
  onScan,
}: QRScannerProps) {
  const insets = useSafeAreaInsets();

  const device =
    useCameraDevice("back");

  const {
    hasPermission,
    requestPermission,
  } = useCameraPermission();

  const [torchEnabled, setTorchEnabled] =
    useState(false);

  const [
    cameraStarted,
    setCameraStarted,
  ] = useState(false);

  const [scanLocked, setScanLocked] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const requestedPermission =
    useRef(false);

  const processingRef =
    useRef(false);

  useEffect(() => {
    if (
      hasPermission ||
      requestedPermission.current
    ) {
      return;
    }

    requestedPermission.current = true;

    requestPermission().catch(
      (error) => {
        console.error(
          "Camera permission error:",
          error
        );
      }
    );
  }, [
    hasPermission,
    requestPermission,
  ]);

  const scannerOutput =
    useBarcodeScannerOutput({
      barcodeFormats: ["qr-code"],
      outputResolution: "preview",

      onBarcodeScanned(barcodes) {
        if (
          processingRef.current ||
          scanLocked
        ) {
          return;
        }

        const first =
          barcodes.find(
            (barcode) =>
              barcode.rawValue?.trim()
          );

        const value =
          first?.rawValue?.trim();

        if (!value) {
          return;
        }

        processingRef.current = true;
        setScanLocked(true);

        Promise.resolve(
          onScan(value)
        )
          .then((accepted) => {
            if (!accepted) {
              setTimeout(() => {
                processingRef.current =
                  false;
                setScanLocked(false);
              }, 400);
            }
          })
          .catch((error) => {
            console.error(
              "QR processing error:",
              error
            );

            setTimeout(() => {
              processingRef.current =
                false;
              setScanLocked(false);
            }, 400);
          });
      },

      onError(error) {
        console.error(
          "Bundled QR scanner error:",
          error
        );

        setCameraError(
          "Unable to scan QR codes. Close the scanner and try again."
        );
      },
    });

  if (!hasPermission) {
    return (
      <View
        style={styles.permissionScreen}
      >
        <StatusBar style="light" />

        <Ionicons
          name="camera-outline"
          size={52}
          color={colors.white}
        />

        <Text
          style={styles.permissionTitle}
        >
          Camera permission required
        </Text>

        <Text
          style={styles.permissionText}
        >
          Allow camera access so the app can scan QR codes completely offline.
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={async () => {
            try {
              const granted =
                await requestPermission();

              if (!granted) {
                await Linking.openSettings();
              }
            } catch (error) {
              console.error(
                "Camera permission request error:",
                error
              );
            }
          }}
        >
          <Text
            style={
              styles.permissionButtonText
            }
          >
            Allow Camera
          </Text>
        </Pressable>

        <Pressable
          style={styles.permissionClose}
          onPress={onClose}
        >
          <Text
            style={
              styles.permissionCloseText
            }
          >
            Close
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View
        style={styles.permissionScreen}
      >
        <StatusBar style="light" />

        <Text
          style={styles.permissionTitle}
        >
          Rear camera unavailable
        </Text>

        <Pressable
          style={styles.permissionClose}
          onPress={onClose}
        >
          <Text
            style={
              styles.permissionCloseText
            }
          >
            Close
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        style="light"
      />

      <Camera
        style={styles.camera}
        device={device}
        isActive
        outputs={[scannerOutput]}
        {...(
          cameraStarted &&
          device.hasTorch
            ? {
                torchMode:
                  torchEnabled
                    ? ("on" as const)
                    : ("off" as const),
              }
            : {}
        )}
        resizeMode="cover"
        implementationMode="compatible"
        onStarted={() => {
          setCameraStarted(true);
          setCameraError("");
        }}
        onStopped={() => {
          setCameraStarted(false);
          setTorchEnabled(false);
        }}
        onError={(error) => {
          console.error(
            "VisionCamera error:",
            error
          );

          setCameraStarted(false);
          setTorchEnabled(false);

          setCameraError(
            "Unable to start the camera. Close the scanner and try again."
          );
        }}
      />

      <Modal
        visible
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={onClose}
      >
        <View
          pointerEvents="box-none"
          style={styles.modalOverlay}
        >
          <View
            pointerEvents="none"
            style={styles.maskTop}
          />

          <View
            pointerEvents="none"
            style={styles.maskBottom}
          />

          <View
            pointerEvents="none"
            style={styles.maskLeft}
          />

          <View
            pointerEvents="none"
            style={styles.maskRight}
          />

          <View
            pointerEvents="none"
            style={styles.modalScanFrame}
          />

          <View
            style={[
              styles.topControls,
              {
                top: insets.top + 12,
              },
            ]}
          >
            {device.hasTorch ? (
              <Pressable
                style={({ pressed }) => [
                  styles.flashButton,
                  pressed &&
                    cameraStarted &&
                    styles.pressed,
                  !cameraStarted &&
                    styles.flashButtonDisabled,
                ]}
                onPress={() => {
                  if (!cameraStarted) {
                    return;
                  }

                  setTorchEnabled(
                    (current) => !current
                  );
                }}
                disabled={!cameraStarted}
              >
                <Ionicons
                  name={
                    torchEnabled
                      ? "flash"
                      : "flash-outline"
                  }
                  size={22}
                  color="#FFD84D"
                />

                <Text style={styles.flashText}>
                  Flash
                </Text>
              </Pressable>
            ) : (
              <View
                style={styles.flashPlaceholder}
              />
            )}

            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              onPress={onClose}
            >
              <Text style={styles.closeText}>
                Close
              </Text>
            </Pressable>
          </View>

          <View
            pointerEvents="none"
            style={styles.modalHint}
          >
            <Text style={styles.hintText}>
              {hint}
            </Text>
          </View>

          {cameraError ||
          errorMessage ? (
            <View
              style={[
                styles.errorBox,
                {
                  bottom:
                    insets.bottom + 82,
                },
              ]}
            >
              <Text
                style={styles.errorText}
              >
                {cameraError ||
                  errorMessage}
              </Text>
            </View>
          ) : null}

          {scanLocked ? (
            <View
              pointerEvents="none"
              style={styles.processingPill}
            >
              <Text
                style={
                  styles.processingText
                }
              >
                Verifying QR...
              </Text>
            </View>
          ) : null}

          {onUploadImage ? (
            <Pressable
              style={({ pressed }) => [
                styles.galleryButton,
                {
                  bottom:
                    insets.bottom + 24,
                },
                pressed &&
                  styles.pressed,
              ]}
              onPress={onUploadImage}
              disabled={scanLocked}
            >
              <Ionicons
                name="images-outline"
                size={25}
                color={colors.white}
              />

              <Text
                style={styles.galleryText}
              >
                Upload QR Image
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },

  camera: {
    flex: 1,
    width: "100%",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },

  maskTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "34%",
    backgroundColor:
      "rgba(0,0,0,0.22)",
  },

  maskBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "66%",
    bottom: 0,
    backgroundColor:
      "rgba(0,0,0,0.22)",
  },

  maskLeft: {
    position: "absolute",
    left: 0,
    top: "34%",
    width: "8%",
    height: "32%",
    backgroundColor:
      "rgba(0,0,0,0.22)",
  },

  maskRight: {
    position: "absolute",
    right: 0,
    top: "34%",
    width: "8%",
    height: "32%",
    backgroundColor:
      "rgba(0,0,0,0.22)",
  },

  modalScanFrame: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: "34%",
    height: "32%",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    borderRadius: 24,
    backgroundColor: "transparent",
  },

  modalHint: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    top: "69%",
    alignItems: "center",
  },

  topControls: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  flashButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    backgroundColor:
      "rgba(0,0,0,0.58)",
  },

  flashText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  flashButtonDisabled: {
    opacity: 0.45,
  },

  flashPlaceholder: {
    minWidth: 104,
    minHeight: 48,
  },

  closeButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    backgroundColor:
      "rgba(0,0,0,0.42)",
  },

  closeText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  pressed: {
    opacity: 0.7,
  },

  hintText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
    textAlign: "center",
  },

  galleryButton: {
    position: "absolute",
    alignSelf: "center",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    backgroundColor:
      "rgba(0,0,0,0.64)",
  },

  galleryText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  processingPill: {
    position: "absolute",
    alignSelf: "center",
    top: "30%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor:
      "rgba(0,0,0,0.62)",
  },

  processingText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },

  errorBox: {
    elevation: 3,
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor:
      "rgba(127,29,29,0.88)",
  },

  errorText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.white,
    textAlign: "center",
  },

  permissionScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.black,
  },

  permissionTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.white,
    textAlign: "center",
  },

  permissionText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: "#D1D5DB",
    textAlign: "center",
  },

  permissionButton: {
    minWidth: 180,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  permissionButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  permissionClose: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },

  permissionCloseText: {
    fontSize: typography.fontSize.sm,
    color: "#D1D5DB",
  },
});
