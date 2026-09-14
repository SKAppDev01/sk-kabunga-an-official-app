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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActivityRecord,
  ActivityRecordSummary,
  getActivityById,
  getActivityRecordSummary,
} from "../services/activities";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatMoney(
  value: number
) {
  return `₱${value.toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ActivitySummaryScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const activityId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [activity, setActivity] =
    useState<ActivityRecord | null>(
      null
    );

  const [summary, setSummary] =
    useState<ActivityRecordSummary>({
      participantCount: 0,
      presentCount: 0,
      absentCount: 0,
      excusedCount: 0,
      notMarkedCount: 0,
      expenseCount: 0,
      totalExpenses: 0,
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadSummary() {
        if (!activityId) {
          if (active) {
            setError(
              "Activity not found."
            );
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setError("");

          const [
            activityRecord,
            activitySummary,
          ] = await Promise.all([
            getActivityById(
              activityId
            ),
            getActivityRecordSummary(
              activityId
            ),
          ]);

          if (!active) {
            return;
          }

          setActivity(
            activityRecord
          );
          setSummary(
            activitySummary
          );
        } catch (loadError) {
          console.error(
            "Activity summary loading error:",
            loadError
          );

          if (active) {
            setError(
              "Unable to load the activity summary."
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
    }, [activityId])
  );

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
          Activity Summary
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading summary...
          </Text>
        </View>
      ) : error || !activity ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>
            {error ||
              "Activity not found."}
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
            style={styles.activityTitle}
          >
            {activity.title}
          </Text>

          <Text
            style={styles.activityMeta}
          >
            {activity.activityDate}
            {" • "}
            {activity.status}
          </Text>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Participation
            </Text>

            <View
              style={styles.summaryRows}
            >
              <SummaryRow
                label="Total Participants"
                value={String(
                  summary.participantCount
                )}
              />

              <SummaryRow
                label="Present"
                value={String(
                  summary.presentCount
                )}
              />

              <SummaryRow
                label="Absent"
                value={String(
                  summary.absentCount
                )}
              />

              <SummaryRow
                label="Excused"
                value={String(
                  summary.excusedCount
                )}
              />

              <SummaryRow
                label="Not Marked"
                value={String(
                  summary.notMarkedCount
                )}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Event Expenses
            </Text>

            <View
              style={styles.summaryRows}
            >
              <SummaryRow
                label="Expense Records"
                value={String(
                  summary.expenseCount
                )}
              />

              <SummaryRow
                label="Total Expenses"
                value={formatMoney(
                  summary.totalExpenses
                )}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Activity Information
            </Text>

            <View
              style={styles.summaryRows}
            >
              <SummaryRow
                label="Location"
                value={
                  activity.location ||
                  "Not set"
                }
              />

              <SummaryRow
                label="Time"
                value={
                  activity.activityTime ||
                  "Not set"
                }
              />

              <SummaryRow
                label="Status"
                value={
                  activity.status
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Description
            </Text>

            <Text
              style={
                styles.descriptionText
              }
            >
              {activity.description ||
                "No description added."}
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
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontSize: typography.fontSize.lg,
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
    paddingHorizontal: spacing.xl,
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  activityTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  activityMeta: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  summaryRows: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    maxWidth: "55%",
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "right",
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});
