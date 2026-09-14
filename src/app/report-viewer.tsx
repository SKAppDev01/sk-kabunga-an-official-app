import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
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
  GeneratedReport,
  getGeneratedReport,
  ReportSection,
  ReportType,
} from "../services/reports";
import {
  printReport,
  saveReportPdf,
  shareReportPdf,
} from "../services/report-export";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const VALID_REPORT_TYPES:
  ReportType[] = [
    "projects",
    "budget",
    "expenses",
    "youth",
    "meetings",
    "attendance",
    "inventory",
    "activities",
  ];

function normalizeReportType(
  value?: string
): ReportType {
  if (
    value &&
    VALID_REPORT_TYPES.includes(
      value as ReportType
    )
  ) {
    return value as ReportType;
  }

  return "projects";
}

function ReportSectionView({
  section,
}: {
  section: ReportSection;
}) {
  return (
    <View style={styles.section}>
      <View
        style={styles.sectionHeading}
      >
        <Text
          style={styles.sectionTitle}
        >
          {section.title}
        </Text>

        <Text
          style={styles.sectionCount}
        >
          {section.rows.length}
        </Text>
      </View>

      {section.rows.length === 0 ? (
        <View style={styles.emptySection}>
          <Text
            style={styles.emptySectionText}
          >
            No records available.
          </Text>
        </View>
      ) : (
        <View style={styles.recordsList}>
          {section.rows.map(
            (row, rowIndex) => (
              <View
                key={`${section.title}-${rowIndex}`}
                style={[
                  styles.recordBlock,
                  rowIndex <
                    section.rows.length -
                      1 &&
                    styles.recordDivider,
                ]}
              >
                <Text
                  style={styles.recordTitle}
                >
                  {row[0] ||
                    "Record"}
                </Text>

                {section.columns
                  .slice(1)
                  .map(
                    (
                      column,
                      columnIndex
                    ) => {
                      const value =
                        row[
                          columnIndex +
                            1
                        ];

                      if (
                        value == null ||
                        value === ""
                      ) {
                        return null;
                      }

                      return (
                        <View
                          key={`${column}-${columnIndex}`}
                          style={
                            styles.detailRow
                          }
                        >
                          <Text
                            style={
                              styles.detailLabel
                            }
                          >
                            {column}
                          </Text>

                          <Text
                            style={
                              styles.detailValue
                            }
                          >
                            {value}
                          </Text>
                        </View>
                      );
                    }
                  )}
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
}

export default function ReportViewerScreen() {
  const params =
    useLocalSearchParams<{
      type?:
        | string
        | string[];
    }>();

  const rawType =
    Array.isArray(params.type)
      ? params.type[0]
      : params.type;

  const reportType =
    normalizeReportType(
      rawType
    );

  const [report, setReport] =
    useState<GeneratedReport | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    exportAction,
    setExportAction,
  ] = useState<
    "save" | "print" | "share" | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadReport() {
        try {
          setIsLoading(true);
          setError("");

          const generated =
            await getGeneratedReport(
              reportType
            );

          if (active) {
            setReport(generated);
          }
        } catch (loadError) {
          console.error(
            "Report loading error:",
            loadError
          );

          if (active) {
            setReport(null);
            setError(
              "Unable to generate this report."
            );
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadReport();

      return () => {
        active = false;
      };
    }, [reportType])
  );

  async function handleSavePdf() {
    if (!report) {
      return;
    }

    try {
      setExportAction("save");

      const result =
        await saveReportPdf(
          report
        );

      if (!result.saved) {
        return;
      }

      Alert.alert(
        "PDF Saved",
        `${result.fileName} was saved to the folder you selected.`
      );
    } catch (saveError) {
      console.error(
        "Report PDF save error:",
        saveError
      );

      Alert.alert(
        "Unable to Save PDF",
        "The report PDF could not be saved."
      );
    } finally {
      setExportAction(null);
    }
  }

  async function handlePrint() {
    if (!report) {
      return;
    }

    try {
      setExportAction("print");

      await printReport(
        report
      );
    } catch (printError) {
      console.error(
        "Report print error:",
        printError
      );

      Alert.alert(
        "Unable to Print",
        "The Android print screen could not be opened."
      );
    } finally {
      setExportAction(null);
    }
  }

  async function handleShare() {
    if (!report) {
      return;
    }

    try {
      setExportAction("share");

      await shareReportPdf(
        report
      );
    } catch (shareError) {
      console.error(
        "Report share error:",
        shareError
      );

      Alert.alert(
        "Unable to Share",
        String(
          shareError
        ).includes(
          "SHARING_NOT_AVAILABLE"
        )
          ? "Sharing is not available on this device."
          : "The report PDF could not be shared."
      );
    } finally {
      setExportAction(null);
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
          numberOfLines={1}
        >
          {report?.title ||
            "Report"}
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Generating report...
          </Text>
        </View>
      ) : error || !report ? (
        <View style={styles.centerState}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.danger}
          />

          <Text
            style={styles.errorText}
          >
            {error ||
              "Report unavailable."}
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
          <Text
            style={styles.reportTitle}
          >
            {report.title}
          </Text>

          <Text
            style={
              styles.reportSubtitle
            }
          >
            {report.subtitle}
          </Text>

          <View
            style={styles.exportActions}
          >
            <Pressable
              style={({ pressed }) => [
                styles.exportActionButton,
                pressed &&
                  styles.exportActionPressed,
              ]}
              onPress={
                handleSavePdf
              }
              disabled={
                exportAction !== null
              }
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={styles.exportActionText}
              >
                {exportAction === "save"
                  ? "Saving..."
                  : "Save PDF"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.exportActionButton,
                pressed &&
                  styles.exportActionPressed,
              ]}
              onPress={
                handlePrint
              }
              disabled={
                exportAction !== null
              }
            >
              <Ionicons
                name="print-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={styles.exportActionText}
              >
                {exportAction === "print"
                  ? "Opening..."
                  : "Print"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.exportActionButton,
                pressed &&
                  styles.exportActionPressed,
              ]}
              onPress={
                handleShare
              }
              disabled={
                exportAction !== null
              }
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={styles.exportActionText}
              >
                {exportAction === "share"
                  ? "Preparing..."
                  : "Share"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Summary
            </Text>

            <View
              style={styles.summaryRows}
            >
              {report.summary.map(
                (metric, index) => (
                  <View
                    key={`${metric.label}-${index}`}
                    style={[
                      styles.summaryRow,
                      index <
                        report.summary
                          .length -
                          1 &&
                        styles.summaryDivider,
                    ]}
                  >
                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      {metric.label}
                    </Text>

                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {metric.value}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>

          {report.sections.map(
            (section) => (
              <ReportSectionView
                key={section.title}
                section={section}
              />
            )
          )}

          <View
            style={styles.exportNote}
          >
            <Ionicons
              name="document-outline"
              size={19}
              color={colors.primary}
            />

            <Text
              style={
                styles.exportNoteText
              }
            >
              This report is generated
              entirely from local SQLite
              data. You can save it as PDF,
              print it, or share the PDF
              directly from this screen.
            </Text>
          </View>
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
    textAlign: "center",
  },
  errorText: {
    width: "100%",
    maxWidth: 300,
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
  reportTitle: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  reportSubtitle: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
  },
  exportActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  exportActionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  exportActionPressed: {
    opacity: 0.65,
  },
  exportActionText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: "center",
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  sectionCount: {
    elevation: 3,
    minWidth: 28,
    height: 28,
    flexShrink: 0,
    textAlign: "center",
    textAlignVertical: "center",
    paddingHorizontal:
      spacing.xs,
    borderRadius: 999,
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
    backgroundColor:
      "#EFF6FF",
  },
  summaryRows: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  summaryRow: {
    minHeight: 52,
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
    lineHeight: 20,
    color:
      colors.textSecondary,
  },
  summaryValue: {
    minWidth: 86,
    maxWidth: "55%",
    flexShrink: 0,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    lineHeight: 20,
    color: colors.text,
    textAlign: "right",
  },
  recordsList: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  recordBlock: {
    paddingVertical:
      spacing.lg,
  },
  recordDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  recordTitle: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.bold,
    lineHeight: 20,
    color: colors.text,
  },
  detailRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xs,
  },
  detailLabel: {
    width: 112,
    flexShrink: 0,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textMuted,
  },
  detailValue: {
    flex: 1,
    minWidth: 0,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
    textAlign: "right",
  },
  emptySection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical:
      spacing.xl,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  emptySectionText: {
    width: "100%",
    textAlign: "center",
    fontSize:
      typography.fontSize.sm,
    color: colors.textMuted,
  },
  exportNote: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#EFF6FF",
  },
  exportNoteText: {
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
