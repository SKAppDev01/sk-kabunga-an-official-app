import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import RecordAuditMetadata from "../components/RecordAuditMetadata";
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

import { AppHeader } from "../components/AppHeader";

import {
  ActivityRecord,
  ActivityRecordSummary,
  ActivityStatus,
  getActivityById,
  getActivityRecordSummary,
} from "../services/activities";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatActivityDate(
  value: string
) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return value;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatActivityTime(
  value: string | null
) {
  if (!value) {
    return "Not set";
  }

  const match = value.match(
    /^(\d{2}):(\d{2})$/
  );

  if (!match) {
    return value;
  }

  const date = new Date();
  date.setHours(
    Number(match[1]),
    Number(match[2]),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-PH",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getStatusStyle(
  status: ActivityStatus
) {
  switch (status) {
    case "Completed":
      return {
        backgroundColor:
          "#ECFDF3",
        textColor: "#047857",
      };

    case "Cancelled":
      return {
        backgroundColor:
          "#FEF2F2",
        textColor: "#B91C1C",
      };

    case "Ongoing":
      return {
        backgroundColor:
          "#FFF7ED",
        textColor: "#C2410C",
      };

    default:
      return {
        backgroundColor:
          "#EFF6FF",
        textColor: colors.primary,
      };
  }
}

type DetailRowProps = {
  icon:
    | "calendar-outline"
    | "time-outline"
    | "location-outline";
  label: string;
  value: string;
};

function DetailRow({
  icon,
  label,
  value,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ActivityDetailsScreen() {
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

  const [isLoading, setIsLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [
    recordSummary,
    setRecordSummary,
  ] = useState<ActivityRecordSummary>({
    participantCount: 0,
    presentCount: 0,
    absentCount: 0,
    excusedCount: 0,
    notMarkedCount: 0,
    expenseCount: 0,
    totalExpenses: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadActivity() {
        if (!activityId) {
          if (active) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setNotFound(false);

          const record =
            await getActivityById(
              activityId
            );

          if (!active) {
            return;
          }

          if (!record) {
            setActivity(null);
            setNotFound(true);
            return;
          }

          setActivity(record);

          const summary =
            await getActivityRecordSummary(
              activityId
            );

          if (active) {
            setRecordSummary(
              summary
            );
          }
        } catch (error) {
          console.error(
            "Activity details loading error:",
            error
          );

          if (active) {
            setActivity(null);
            setNotFound(true);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadActivity();

      return () => {
        active = false;
      };
    }, [activityId])
  );

  const statusStyle = activity
    ? getStatusStyle(
        activity.status
      )
    : null;

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Activity Details"
        showBack
      />
      

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading activity...
          </Text>
        </View>
      ) : notFound || !activity ? (
        <View style={styles.centerState}>
          <Ionicons
            name="people-circle-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text style={styles.emptyTitle}>
            Activity not found
          </Text>

          <Text style={styles.stateText}>
            This activity record may no
            longer be available.
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

          <View
            style={styles.titleSection}
          >
            <View
              style={styles.titleIcon}
            >
              <Ionicons
                name="people-circle-outline"
                size={29}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.titleText}
            >
              <Text
                style={
                  styles.activityTitle
                }
              >
                {activity.title}
              </Text>

              {statusStyle ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        statusStyle.backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          statusStyle.textColor,
                      },
                    ]}
                  >
                    {activity.status}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={styles.detailsGroup}
          >
            <DetailRow
              icon="calendar-outline"
              label="Date"
              value={formatActivityDate(
                activity.activityDate
              )}
            />

            <DetailRow
              icon="time-outline"
              label="Time"
              value={formatActivityTime(
                activity.activityTime
              )}
            />

            <DetailRow
              icon="location-outline"
              label="Location"
              value={
                activity.location ||
                "Not set"
              }
            />
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Description
            </Text>

            <Text
              style={
                activity.description
                  ? styles.descriptionText
                  : styles.emptyDescription
              }
            >
              {activity.description ||
                "No description added."}
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Activity Records
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Manage participants,
              attendance, event expenses
              and the activity summary.
            </Text>

            <View style={styles.recordRows}>
              <Pressable
                style={styles.recordRow}
                onPress={() =>
                  router.push({
                    pathname:
                      "/activity-participants",
                    params: {
                      id: activity.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="people-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.recordLabel}
                >
                  Participant List
                </Text>

                <Text
                  style={styles.recordValue}
                >
                  {recordSummary.participantCount}
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.recordRow,
                  styles.recordDivider,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/activity-attendance",
                    params: {
                      id: activity.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.recordLabel}
                >
                  Attendance
                </Text>

                <Text
                  style={styles.recordValue}
                >
                  {recordSummary.presentCount}
                  /
                  {recordSummary.participantCount}
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.recordRow,
                  styles.recordDivider,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/activity-expenses",
                    params: {
                      id: activity.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="wallet-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.recordLabel}
                >
                  Event Expenses
                </Text>

                <Text
                  style={styles.recordValue}
                >
                  ₱
                  {recordSummary.totalExpenses.toLocaleString(
                    "en-PH",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.recordRow,
                  styles.recordDivider,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/activity-summary",
                    params: {
                      id: activity.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.recordLabel}
                >
                  Activity Summary
                </Text>

                <Text
                  style={styles.recordValue}
                >
                  View
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
                <RecordAuditMetadata
          table="activities"
          recordId={activity.id}
        />
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



  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.xl,
  },

  emptyTitle: {
    marginTop: spacing.lg,
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  stateText: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
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

  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom:
      spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  titleIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor:
      "#EFF6FF",
  },

  titleText: {
    flex: 1,
    minWidth: 0,
    marginLeft:
      spacing.lg,
  },

  activityTitle: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  statusBadge: {
    alignSelf: "flex-start",
    minWidth: 82,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal:
      spacing.md,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },

  detailsGroup: {
    paddingVertical:
      spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  detailRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  detailText: {
    flex: 1,
    marginLeft:
      spacing.sm,
  },

  detailLabel: {
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
  },

  detailValue: {
    marginTop: 3,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },

  section: {
    marginTop:
      spacing.xl,
  },

  sectionTitle: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  sectionDescription: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
  },

  descriptionText: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text,
  },

  emptyDescription: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
  },

  recordRows: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  recordRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
  },

  recordDivider: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  recordLabel: {
    flex: 1,
    minWidth: 0,
    marginLeft:
      spacing.md,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    color: colors.text,
  },

  recordValue: {
    minWidth: 86,
    flexShrink: 0,
    marginRight: spacing.sm,
    paddingHorizontal: 2,
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: "right",
  },
});
