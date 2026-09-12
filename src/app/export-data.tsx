import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
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

import {
  createDataExportPackage,
  ExportSummary,
  getDataExportSummary,
  saveDataExportPackage,
  shareDataExportPackage,
} from "../services/data-sharing";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ExportDataScreen() {
  const [summary, setSummary] =
    useState<ExportSummary | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [action, setAction] =
    useState<
      "save" | "share" | null
    >(null);

  const [error, setError] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadSummary() {
        try {
          setIsLoading(true);
          setError("");

          const result =
            await getDataExportSummary();

          if (active) {
            setSummary(result);
          }
        } catch (loadError) {
          console.error(
            "Export summary error:",
            loadError
          );

          if (active) {
            const message =
              String(loadError);

            setError(
              message.includes(
                "VERIFIED_OFFICIAL_REQUIRED"
              )
                ? "A verified SK official account is required to export official data."
                : "Unable to prepare the export."
            );
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadSummary();

      return () => {
        active = false;
      };
    }, [])
  );

  async function handleSave() {
    try {
      setAction("save");

      const dataPackage =
        await createDataExportPackage();

      const result =
        await saveDataExportPackage(
          dataPackage
        );

      if (!result.saved) {
        return;
      }

      Alert.alert(
        "Export Saved",
        `${result.fileName} was saved to the folder you selected.`
      );
    } catch (saveError) {
      console.error(
        "Data export save error:",
        saveError
      );

      Alert.alert(
        "Unable to Export",
        "The data package could not be created or saved."
      );
    } finally {
      setAction(null);
    }
  }

  async function handleShare() {
    try {
      setAction("share");

      const dataPackage =
        await createDataExportPackage();

      await shareDataExportPackage(
        dataPackage
      );
    } catch (shareError) {
      console.error(
        "Data export share error:",
        shareError
      );

      Alert.alert(
        "Unable to Share",
        String(shareError).includes(
          "SHARING_NOT_AVAILABLE"
        )
          ? "Sharing is not available on this device."
          : "The export package could not be shared."
      );
    } finally {
      setAction(null);
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
          Export Data
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Preparing export summary...
          </Text>
        </View>
      ) : error || !summary ? (
        <View style={styles.centerState}>
          <Ionicons
            name="shield-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text
            style={styles.errorText}
          >
            {error ||
              "Export unavailable."}
          </Text>
        </View>
      ) : (
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
            Officials-Only Data Export
          </Text>

          <Text style={styles.subtitle}>
            This creates one mergeable
            .skdata package containing the
            official records stored on this
            device.
          </Text>

          <View style={styles.totalBox}>
            <Text
              style={styles.totalLabel}
            >
              Records Included
            </Text>

            <Text
              style={styles.totalValue}
            >
              {summary.totalRecords}
            </Text>
          </View>

          <Text
            style={styles.sectionTitle}
          >
            Included Records
          </Text>

          <View style={styles.list}>
            {summary.tables.map(
              (table, index) => (
                <View
                  key={table.table}
                  style={[
                    styles.row,
                    index <
                      summary.tables
                        .length -
                        1 &&
                      styles.divider,
                  ]}
                >
                  <Text
                    style={styles.rowLabel}
                  >
                    {table.label}
                  </Text>

                  <Text
                    style={styles.rowValue}
                  >
                    {table.count}
                  </Text>
                </View>
              )
            )}
          </View>

          <View style={styles.warningBox}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.primary}
            />

            <Text
              style={styles.warningText}
            >
              This package may contain
              private youth and official
              records. Share it only with a
              verified SK official.
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="attach-outline"
              size={20}
              color={colors.textMuted}
            />

            <Text style={styles.infoText}>
              Receipt images and document
              attachment files are not copied
              into this mergeable export.
              Their local file paths are also
              excluded.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed ||
                  action !== null) &&
                  styles.pressed,
              ]}
              onPress={handleSave}
              disabled={
                action !== null
              }
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.white}
              />

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {action === "save"
                  ? "Saving..."
                  : "Save Export File"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                (pressed ||
                  action !== null) &&
                  styles.pressed,
              ]}
              onPress={handleShare}
              disabled={
                action !== null
              }
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                {action === "share"
                  ? "Preparing..."
                  : "Share Export File"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  stateText: {
    fontSize:
      typography.fontSize.sm,
    color:
      colors.textSecondary,
  },
  errorText: {
    width: "100%",
    maxWidth: 310,
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.danger,
    textAlign: "center",
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
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor:
      "#EFF6FF",
  },
  totalLabel: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  totalValue: {
    minWidth: 50,
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.primary,
    textAlign: "right",
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
  list: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize:
      typography.fontSize.sm,
    color:
      colors.textSecondary,
  },
  rowValue: {
    minWidth: 52,
    flexShrink: 0,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "right",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#EFF6FF",
  },
  warningText: {
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
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#F9FAFB",
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textMuted,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor:
      colors.primary,
  },
  primaryButtonText: {
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  secondaryButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  secondaryButtonText: {
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
});
