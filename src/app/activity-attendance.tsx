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
  ActivityAttendanceStatus,
  ActivityParticipantRecord,
  getActivityParticipants,
  updateActivityAttendanceStatus,
} from "../services/activities";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const STATUS_OPTIONS: ActivityAttendanceStatus[] = [
  "Not Marked",
  "Present",
  "Absent",
  "Excused",
];

function getNextStatus(
  current: ActivityAttendanceStatus
) {
  const index =
    STATUS_OPTIONS.indexOf(
      current
    );

  return STATUS_OPTIONS[
    (index + 1) %
      STATUS_OPTIONS.length
  ];
}

function getBadgeStyle(
  status: ActivityAttendanceStatus
) {
  switch (status) {
    case "Present":
      return {
        backgroundColor:
          "#ECFDF3",
        textColor: "#047857",
      };

    case "Absent":
      return {
        backgroundColor:
          "#FEF2F2",
        textColor: "#B91C1C",
      };

    case "Excused":
      return {
        backgroundColor:
          "#FFF7ED",
        textColor: "#C2410C",
      };

    default:
      return {
        backgroundColor:
          "#F3F4F6",
        textColor:
          colors.textSecondary,
      };
  }
}

export default function ActivityAttendanceScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const activityId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [records, setRecords] =
    useState<ActivityParticipantRecord[]>(
      []
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadAttendance =
    useCallback(async () => {
      if (!activityId) {
        setError(
          "Activity not found."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const rows =
          await getActivityParticipants(
            activityId
          );

        setRecords(rows);
      } catch (loadError) {
        console.error(
          "Activity attendance loading error:",
          loadError
        );

        setError(
          "Unable to load attendance."
        );
      } finally {
        setIsLoading(false);
      }
    }, [activityId]);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance])
  );

  async function handleStatusPress(
    record: ActivityParticipantRecord
  ) {
    try {
      await updateActivityAttendanceStatus(
        record.id,
        getNextStatus(
          record.attendanceStatus
        )
      );

      await loadAttendance();
    } catch (updateError) {
      console.error(
        "Attendance update error:",
        updateError
      );

      setError(
        "Unable to update attendance."
      );
    }
  }

  const presentCount =
    records.filter(
      (record) =>
        record.attendanceStatus ===
        "Present"
    ).length;

  const markedCount =
    records.filter(
      (record) =>
        record.attendanceStatus !==
        "Not Marked"
    ).length;

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
          Attendance
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text
            style={styles.summaryMain}
          >
            {presentCount} present
          </Text>

          <Text
            style={styles.summarySub}
          >
            {`${markedCount} of ${records.length} marked`}
          </Text>
        </View>

        <Text
          style={styles.summaryHint}
        >
          Tap status to change
        </Text>
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading attendance...
          </Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons
            name="people-outline"
            size={42}
            color={colors.textMuted}
          />

          <Text
            style={styles.emptyTitle}
          >
            No participants yet
          </Text>

          <Text
            style={styles.stateText}
          >
            Add participants first,
            {"\n"}
            then mark their attendance.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {records.map(
            (record, index) => {
              const badgeStyle =
                getBadgeStyle(
                  record.attendanceStatus
                );

              return (
                <View
                  key={record.id}
                  style={[
                    styles.row,
                    index <
                      records.length - 1 &&
                      styles.rowDivider,
                  ]}
                >
                  <View
                    style={styles.personIcon}
                  >
                    <Ionicons
                      name="person-outline"
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    style={styles.name}
                    numberOfLines={1}
                  >
                    {record.participantName}
                  </Text>

                  <Pressable
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          badgeStyle.backgroundColor,
                      },
                    ]}
                    onPress={() =>
                      handleStatusPress(
                        record
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            badgeStyle.textColor,
                        },
                      ]}
                    >
                      {record.attendanceStatus}
                    </Text>
                  </Pressable>
                </View>
              );
            }
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLeft: {
    flex: 1,
    minWidth: 0,
  },

  summaryMain: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  summarySub: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  summaryHint: {
    minWidth: 118,
    flexShrink: 0,
    paddingLeft: spacing.sm,
    paddingRight: 2,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    textAlign: "right",
  },
  errorText: {
    margin: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    textAlign: "center",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  stateText: {
    width: "100%",
    maxWidth: 280,
    flexShrink: 0,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personIcon: {
    width: 38,
    alignItems: "center",
  },
  name: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    paddingRight: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },
  statusBadge: {
    minWidth: 82,
    minHeight: 32,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },
});
