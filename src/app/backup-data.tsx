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
  BackupSummary,
  createBackupPackage,
  getBackupSummary,
  saveBackupPackage,
  shareBackupPackage,
} from "../services/data-sharing";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatTableName(
  value: string
) {
  return value
    .split("_")
    .map(
      (word) =>
        word.length > 0
          ? word[0].toUpperCase() +
            word.slice(1)
          : word
    )
    .join(" ");
}

export default function BackupDataScreen() {
  const [summary, setSummary] =
    useState<BackupSummary | null>(
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
            await getBackupSummary();

          if (active) {
            setSummary(result);
          }
        } catch (loadError) {
          console.error(
            "Backup summary error:",
            loadError
          );

          if (active) {
            setError(
              String(loadError).includes(
                "VERIFIED_OFFICIAL_REQUIRED"
              )
                ? "A verified SK official account is required to create a database backup."
                : "Unable to prepare the database backup."
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

      const backupPackage =
        await createBackupPackage();

      const result =
        await saveBackupPackage(
          backupPackage
        );

      if (!result.saved) {
        return;
      }

      Alert.alert(
        "Backup Saved",
        `${result.fileName} was saved to the folder you selected.`
      );
    } catch (saveError) {
      console.error(
        "Backup save error:",
        saveError
      );

      Alert.alert(
        "Unable to Save Backup",
        "The database backup could not be created or saved."
      );
    } finally {
      setAction(null);
    }
  }

  async function handleShare() {
    try {
      setAction("share");

      const backupPackage =
        await createBackupPackage();

      await shareBackupPackage(
        backupPackage
      );
    } catch (shareError) {
      console.error(
        "Backup share error:",
        shareError
      );

      Alert.alert(
        "Unable to Share Backup",
        String(shareError).includes(
          "SHARING_NOT_AVAILABLE"
        )
          ? "Sharing is not available on this device."
          : "The backup package could not be shared."
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
          Backup
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Preparing backup summary...
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
              "Backup unavailable."}
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
            Database Backup
          </Text>

          <Text style={styles.subtitle}>
            Create a restorable snapshot of
            the app database on this device.
          </Text>

          <View style={styles.summaryBox}>
            <View style={styles.metric}>
              <Text
                style={styles.metricValue}
              >
                {summary.recordCount}
              </Text>

              <Text
                style={styles.metricLabel}
              >
                Records
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metric}>
              <Text
                style={styles.metricValue}
              >
                {summary.tableCount}
              </Text>

              <Text
                style={styles.metricLabel}
              >
                Tables
              </Text>
            </View>
          </View>

          <Text
            style={styles.sectionTitle}
          >
            Backup Contents
          </Text>

          <View style={styles.list}>
            {summary.tables.map(
              (table, index) => (
                <View
                  key={table.name}
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
                    {formatTableName(
                      table.name
                    )}
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
              name="warning-outline"
              size={20}
              color="#B45309"
            />

            <Text
              style={styles.warningText}
            >
              A database backup contains
              sensitive local information,
              including local accounts and
              official records. Keep the
              .skbackup file private.
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.infoText}>
              Every backup includes a SHA-256
              integrity checksum. Restore
              rejects a damaged or modified
              snapshot before replacing data.
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="images-outline"
              size={20}
              color={colors.textMuted}
            />

            <Text style={styles.infoText}>
              This step backs up the SQLite
              database. Receipt image files
              and document attachment files
              stored separately on the device
              are not bundled yet.
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
                name="archive-outline"
                size={20}
                color={colors.white}
              />

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {action === "save"
                  ? "Creating Backup..."
                  : "Save Backup File"}
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
                  : "Share Backup File"}
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
    alignItems: "center",
  },
  metricValue: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.primary,
  },
  metricLabel: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    color:
      colors.textSecondary,
  },
  metricDivider: {
    width: 1,
    height: 42,
    backgroundColor:
      colors.border,
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
    minWidth: 56,
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
  infoBox: {
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
    color:
      colors.textSecondary,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    minHeight: 52,
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
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      colors.primary,
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
