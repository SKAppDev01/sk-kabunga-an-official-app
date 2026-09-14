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
  DataImportPreview,
  DataPackage,
  importNewDataRecords,
  pickDataImportPackage,
  previewDataImport,
} from "../services/data-sharing";
import {
  colors,
  spacing,
  typography,
} from "../theme";

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

export default function ImportDataScreen() {
  const [fileName, setFileName] =
    useState("");

  const [dataPackage, setDataPackage] =
    useState<DataPackage | null>(
      null
    );

  const [preview, setPreview] =
    useState<DataImportPreview | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleChooseFile() {
    try {
      setIsLoading(true);
      setError("");
      setPreview(null);
      setDataPackage(null);
      setFileName("");

      const selected =
        await pickDataImportPackage();

      if (!selected) {
        return;
      }

      const nextPreview =
        await previewDataImport(
          selected.dataPackage
        );

      setFileName(
        selected.fileName
      );
      setDataPackage(
        selected.dataPackage
      );
      setPreview(
        nextPreview
      );
    } catch (loadError) {
      console.error(
        "Import package loading error:",
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
          "A verified SK official account is required to import official data."
        );
      } else if (
        message.includes(
          "INVALID_DATA_PACKAGE"
        )
      ) {
        setError(
          "The selected file is not a valid SK Kabunga-an data package."
        );
      } else {
        setError(
          "Unable to read the selected data package."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleImport() {
    if (
      !dataPackage ||
      !preview
    ) {
      return;
    }

    if (
      preview.newRecords === 0
    ) {
      Alert.alert(
        "Nothing New to Import",
        preview.conflictingRecords > 0
          ? "This package contains no new records. Conflicting records are intentionally not overwritten."
          : "All records in this package already exist on this device."
      );
      return;
    }

    Alert.alert(
      "Import New Records",
      `Import ${preview.newRecords} new record(s)? Duplicate and conflicting records will be skipped.`,
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
              setError("");

              const result =
                await importNewDataRecords(
                  dataPackage
                );

              Alert.alert(
                "Import Complete",
                [
                  `${result.importedRecords} new record(s) imported.`,
                  `${result.duplicateRecords} duplicate record(s) skipped.`,
                  `${result.conflictingRecords} conflicting record(s) skipped.`,
                  result.failedRecords > 0
                    ? `${result.failedRecords} record(s) could not be imported because a required related record was unavailable.`
                    : null,
                ]
                  .filter(Boolean)
                  .join("\n"),
                [
                  {
                    text: "OK",
                    onPress: async () => {
                      const refreshed =
                        await previewDataImport(
                          dataPackage
                        );

                      setPreview(
                        refreshed
                      );
                    },
                  },
                ]
              );
            } catch (importError) {
              console.error(
                "Data import error:",
                importError
              );

              setError(
                "The import could not be completed."
              );
            } finally {
              setIsImporting(false);
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
          Import Data
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
          Preview Before Merge
        </Text>

        <Text style={styles.subtitle}>
          Select an SK .skdata package.
          The app checks every record before
          anything is written to the local
          database.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.chooseButton,
            (pressed ||
              isLoading ||
              isImporting) &&
              styles.pressed,
          ]}
          onPress={handleChooseFile}
          disabled={
            isLoading ||
            isImporting
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
              ? "Reading Package..."
              : "Choose .skdata File"}
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
                name="document-text-outline"
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

            {preview.alreadyImported ? (
              <View
                style={styles.noticeBox}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text
                  style={styles.noticeText}
                >
                  This package has been
                  imported on this device
                  before. The preview still
                  checks every record.
                </Text>
              </View>
            ) : null}

            <Text
              style={styles.sectionTitle}
            >
              Import Preview
            </Text>

            <View
              style={styles.summaryRows}
            >
              <View
                style={styles.summaryRow}
              >
                <Text
                  style={styles.summaryLabel}
                >
                  Package Records
                </Text>
                <Text
                  style={styles.summaryValue}
                >
                  {preview.recordCount}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  styles.summaryDivider,
                ]}
              >
                <Text
                  style={styles.summaryLabel}
                >
                  New Records
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    styles.newValue,
                  ]}
                >
                  {preview.newRecords}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  styles.summaryDivider,
                ]}
              >
                <Text
                  style={styles.summaryLabel}
                >
                  Duplicates
                </Text>
                <Text
                  style={styles.summaryValue}
                >
                  {preview.duplicateRecords}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  styles.summaryDivider,
                ]}
              >
                <Text
                  style={styles.summaryLabel}
                >
                  Conflicts
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    preview.conflictingRecords >
                      0 &&
                      styles.conflictValue,
                  ]}
                >
                  {preview.conflictingRecords}
                </Text>
              </View>
            </View>

            <Text
              style={styles.sectionTitle}
            >
              Records by Module
            </Text>

            <View style={styles.tableList}>
              {preview.tables.map(
                (table, index) => (
                  <View
                    key={table.table}
                    style={[
                      styles.tableRow,
                      index <
                        preview.tables.length -
                          1 &&
                        styles.tableDivider,
                    ]}
                  >
                    <View
                      style={styles.tableText}
                    >
                      <Text
                        style={styles.tableLabel}
                      >
                        {table.label}
                      </Text>

                      <Text
                        style={styles.tableMeta}
                      >
                        {table.newRecords}
                        {" new • "}
                        {table.duplicateRecords}
                        {" duplicate • "}
                        {table.conflictingRecords}
                        {" conflict"}
                      </Text>
                    </View>

                    <Text
                      style={styles.tableTotal}
                    >
                      {table.total}
                    </Text>
                  </View>
                )
              )}
            </View>

            {preview.conflictingRecords >
            0 ? (
              <View
                style={styles.conflictBox}
              >
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color="#B45309"
                />

                <Text
                  style={styles.conflictText}
                >
                  Conflicts mean the same
                  record ID exists on both
                  devices but the contents are
                  different. This version does
                  not overwrite either copy;
                  conflicting records are
                  skipped.
                </Text>
              </View>
            ) : null}

            <View style={styles.infoBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.primary}
              />

              <Text style={styles.infoText}>
                Import only inserts records
                that do not already exist.
                Local accounts, passwords,
                sessions and organization
                security keys are never
                imported from the package.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.importButton,
                (pressed ||
                  isImporting ||
                  preview.newRecords ===
                    0) &&
                  styles.pressed,
              ]}
              onPress={handleImport}
              disabled={
                isImporting ||
                preview.newRecords ===
                  0
              }
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.white}
              />

              <Text
                style={
                  styles.importButtonText
                }
              >
                {isImporting
                  ? "Importing..."
                  : `Import ${preview.newRecords} New Record${preview.newRecords === 1 ? "" : "s"}`}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="swap-horizontal-outline"
              size={42}
              color={colors.textMuted}
            />

            <Text
              style={styles.emptyTitle}
            >
              No package selected
            </Text>

            <Text
              style={styles.emptyText}
            >
              Choose an export file received
              from another authorized SK
              device to preview its records.
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
    elevation: 3,
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
    elevation: 3,
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
  noticeBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#EFF6FF",
  },
  noticeText: {
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
  summaryRows: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  summaryRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  summaryLabel: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize:
      typography.fontSize.sm,
    color:
      colors.textSecondary,
  },
  summaryValue: {
    minWidth: 72,
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
  tableList: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  tableRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  tableDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  tableText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
  },
  tableLabel: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  tableMeta: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
  },
  tableTotal: {
    minWidth: 48,
    flexShrink: 0,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "right",
  },
  conflictBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#FFF7ED",
  },
  conflictText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color: "#92400E",
  },
  infoBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#EFF6FF",
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
