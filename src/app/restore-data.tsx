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

import {
  BackupPackage,
  pickBackupPackage,
  previewBackupRestore,
  RestorePreview,
  restoreBackupPackage,
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

function formatGeneratedAt(
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

export default function RestoreDataScreen() {
  const [fileName, setFileName] =
    useState("");

  const [backupPackage, setBackupPackage] =
    useState<BackupPackage | null>(
      null
    );

  const [preview, setPreview] =
    useState<RestorePreview | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [isRestoring, setIsRestoring] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleChooseFile() {
    try {
      setIsLoading(true);
      setError("");
      setPreview(null);
      setBackupPackage(null);
      setFileName("");

      const selected =
        await pickBackupPackage();

      if (!selected) {
        return;
      }

      const nextPreview =
        await previewBackupRestore(
          selected.backupPackage
        );

      setFileName(
        selected.fileName
      );
      setBackupPackage(
        selected.backupPackage
      );
      setPreview(
        nextPreview
      );
    } catch (loadError) {
      console.error(
        "Backup preview error:",
        loadError
      );

      const message =
        String(loadError);

      if (
        message.includes(
          "VERIFIED_OFFICIAL_REQUIRED"
        )
      ) {
        setError(
          "A verified SK official account is required to restore a backup."
        );
      } else if (
        message.includes(
          "BACKUP_CHECKSUM_MISMATCH"
        )
      ) {
        setError(
          "This backup failed its integrity check and will not be restored."
        );
      } else if (
        message.includes(
          "BACKUP_SCHEMA_INCOMPATIBLE"
        )
      ) {
        setError(
          "This backup is not compatible with the database schema in this app version."
        );
      } else {
        setError(
          "The selected file is not a valid SK Kabunga-an backup."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleRestore() {
    if (
      !backupPackage ||
      !preview
    ) {
      return;
    }

    Alert.alert(
      "Replace Local Database?",
      "Restore will replace the backed-up database tables on this device. Current database records can be lost if they are not present in the backup.\n\nCreate a fresh backup first if you need the current state.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              setIsRestoring(true);
              setError("");

              const result =
                await restoreBackupPackage(
                  backupPackage
                );

              Alert.alert(
                "Restore Complete",
                `${result.restoredRecords} record(s) restored across ${result.restoredTables} table(s).\n\nFor security, the app session was cleared. Sign in again using an account contained in the restored backup.`,
                [
                  {
                    text: "Go to Login",
                    onPress: () =>
                      router.replace(
                        "/login"
                      ),
                  },
                ]
              );
            } catch (restoreError) {
              console.error(
                "Restore error:",
                restoreError
              );

              setError(
                "Restore could not be completed. The app kept the current database transaction from partially applying."
              );
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
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
          Restore
        </Text>

        <View
          style={styles.headerSpacer}
        />
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
          Restore Database
        </Text>

        <Text style={styles.subtitle}>
          Select an SK .skbackup file.
          The package is checked before any
          current database data is replaced.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.chooseButton,
            (pressed ||
              isLoading ||
              isRestoring) &&
              styles.pressed,
          ]}
          onPress={handleChooseFile}
          disabled={
            isLoading ||
            isRestoring
          }
        >
          <Ionicons
            name="document-outline"
            size={21}
            color={colors.primary}
          />

          <Text
            style={styles.chooseButtonText}
          >
            {isLoading
              ? "Checking Backup..."
              : "Choose .skbackup File"}
          </Text>
        </Pressable>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.danger}
            />

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {preview ? (
          <>
            <View style={styles.fileBox}>
              <Ionicons
                name="archive-outline"
                size={22}
                color={colors.primary}
              />

              <View style={styles.fileText}>
                <Text
                  style={styles.fileName}
                  numberOfLines={2}
                >
                  {fileName}
                </Text>

                <Text
                  style={styles.fileMeta}
                >
                  Created by {preview.generatedByRole}
                  {" • "}
                  {formatGeneratedAt(
                    preview.generatedAt
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.metric}>
                <Text
                  style={styles.metricValue}
                >
                  {preview.recordCount}
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
                  {preview.tableCount}
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
              {preview.tables.map(
                (table, index) => (
                  <View
                    key={table.name}
                    style={[
                      styles.row,
                      index <
                        preview.tables
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

            <View style={styles.dangerBox}>
              <Ionicons
                name="warning-outline"
                size={21}
                color="#B91C1C"
              />

              <Text
                style={styles.dangerText}
              >
                Restore replaces current
                database records with this
                backup. It is not a merge.
                Create a backup of the current
                device first if you may need
                to return to its present
                state.
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.primary}
              />

              <Text style={styles.infoText}>
                Package identity, database
                compatibility and SHA-256
                integrity have passed before
                this Restore button is
                enabled.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.restoreButton,
                (pressed ||
                  isRestoring) &&
                  styles.pressed,
              ]}
              onPress={handleRestore}
              disabled={
                isRestoring
              }
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.white}
              />

              <Text
                style={
                  styles.restoreButtonText
                }
              >
                {isRestoring
                  ? "Restoring..."
                  : "Restore This Backup"}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="archive-outline"
              size={42}
              color={colors.textMuted}
            />

            <Text
              style={styles.emptyTitle}
            >
              No backup selected
            </Text>

            <Text
              style={styles.emptyText}
            >
              Choose a backup file to verify
              its integrity and preview its
              contents before restoring.
            </Text>
          </View>
        )}
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
  chooseButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor:
      colors.primary,
    borderRadius: 14,
  },
  chooseButtonText: {
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
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#FEF2F2",
  },
  errorText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color: colors.danger,
  },
  fileBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#F9FAFB",
  },
  fileText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  fileName: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    lineHeight: 20,
    color: colors.text,
  },
  fileMeta: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
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
  dangerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
  },
  dangerText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color: "#991B1B",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
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
  restoreButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor:
      colors.danger,
  },
  restoreButtonText: {
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    marginTop:
      spacing.xxxl,
    paddingHorizontal:
      spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    width: "100%",
    maxWidth: 300,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
    textAlign: "center",
  },
});
