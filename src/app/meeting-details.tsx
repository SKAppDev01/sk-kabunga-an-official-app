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
import RecordAuditMetadata from "../components/RecordAuditMetadata";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getMeetingById,
  getMeetingSectionSummary,
  MeetingRecord,
  MeetingSectionSummary,
  MeetingStatus,
  updateMeetingStatus,
} from "../services/meetings";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatMeetingDate(
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

function formatMeetingTime(
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
  status: MeetingStatus
) {
  switch (status) {
    case "Completed":
      return {
        backgroundColor: "#ECFDF3",
        textColor: "#047857",
      };

    case "Cancelled":
      return {
        backgroundColor: "#FEF2F2",
        textColor: "#B91C1C",
      };

    case "Ongoing":
      return {
        backgroundColor: "#FFF7ED",
        textColor: "#C2410C",
      };

    default:
      return {
        backgroundColor: "#EFF6FF",
        textColor: colors.primary,
      };
  }
}

const STATUS_OPTIONS: MeetingStatus[] = [
  "Scheduled",
  "Ongoing",
  "Completed",
  "Cancelled",
];

type DetailRowProps = {
  icon:
    | "calendar-outline"
    | "time-outline"
    | "location-outline"
    | "flag-outline";
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

export default function MeetingDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const meetingId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [meeting, setMeeting] =
    useState<MeetingRecord | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [
    statusOpen,
    setStatusOpen,
  ] = useState(false);

  const [
    isUpdatingStatus,
    setIsUpdatingStatus,
  ] = useState(false);

  const [
    statusError,
    setStatusError,
  ] = useState("");

  const [
    sectionSummary,
    setSectionSummary,
  ] = useState<MeetingSectionSummary>({
    hasAgenda: false,
    attendanceCount: 0,
    presentCount: 0,
    hasMinutes: false,
    resolutionCount: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadMeeting() {
        if (!meetingId) {
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
            await getMeetingById(
              meetingId
            );

          if (!active) {
            return;
          }

          if (!record) {
            setMeeting(null);
            setNotFound(true);
            return;
          }

          setMeeting(record);

          const summary =
            await getMeetingSectionSummary(
              meetingId
            );

          if (active) {
            setSectionSummary(
              summary
            );
          }
        } catch (error) {
          console.error(
            "Meeting details loading error:",
            error
          );

          if (active) {
            setMeeting(null);
            setNotFound(true);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadMeeting();

      return () => {
        active = false;
      };
    }, [meetingId])
  );

  async function handleStatusChange(
    nextStatus: MeetingStatus
  ) {
    if (
      !meetingId ||
      !meeting ||
      nextStatus === meeting.status
    ) {
      setStatusOpen(false);
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setStatusError("");

      await updateMeetingStatus(
        meetingId,
        nextStatus
      );

      setMeeting((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current
      );

      setStatusOpen(false);
    } catch (error) {
      console.error(
        "Meeting status update error:",
        error
      );

      setStatusError(
        "Unable to update the meeting status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const statusStyle = meeting
    ? getStatusStyle(
        meeting.status
      )
    : null;

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

        <Text style={styles.headerTitle}>
          Meeting Details
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading meeting...
          </Text>
        </View>
      ) : notFound || !meeting ? (
        <View style={styles.centerState}>
          <Ionicons
            name="calendar-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text style={styles.emptyTitle}>
            Meeting not found
          </Text>

          <Text style={styles.stateText}>
            This meeting record may no
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
            <View style={styles.titleIcon}>
              <Ionicons
                name="calendar-outline"
                size={27}
                color={colors.primary}
              />
            </View>

            <View style={styles.titleText}>
              <Text
                style={styles.meetingTitle}
              >
                {meeting.title}
              </Text>

              {statusStyle ? (
                <>
                  <Pressable
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          statusStyle.backgroundColor,
                      },
                    ]}
                    onPress={() =>
                      setStatusOpen(
                        (current) =>
                          !current
                      )
                    }
                    disabled={
                      isUpdatingStatus
                    }
                    accessibilityLabel="Change meeting status"
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
                      {meeting.status}
                    </Text>

                    <Ionicons
                      name={
                        statusOpen
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                      size={15}
                      color={
                        statusStyle.textColor
                      }
                    />
                  </Pressable>

                  {statusOpen ? (
                    <View
                      style={
                        styles.statusOptions
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (option) => {
                          const selected =
                            option ===
                            meeting.status;

                          return (
                            <Pressable
                              key={option}
                              style={[
                                styles.statusOption,
                                selected &&
                                  styles.statusOptionSelected,
                              ]}
                              onPress={() =>
                                handleStatusChange(
                                  option
                                )
                              }
                              disabled={
                                isUpdatingStatus
                              }
                            >
                              <Text
                                style={[
                                  styles.statusOptionText,
                                  selected &&
                                    styles.statusOptionTextSelected,
                                ]}
                              >
                                {option}
                              </Text>

                              <View
                                style={
                                  styles.statusCheckSlot
                                }
                              >
                                {selected ? (
                                  <Ionicons
                                    name="checkmark"
                                    size={18}
                                    color={
                                      colors.primary
                                    }
                                  />
                                ) : null}
                              </View>
                            </Pressable>
                          );
                        }
                      )}
                    </View>
                  ) : null}

                  {statusError ? (
                    <Text
                      style={
                        styles.statusErrorText
                      }
                    >
                      {statusError}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.detailsGroup}>
            <DetailRow
              icon="calendar-outline"
              label="Date"
              value={formatMeetingDate(
                meeting.meetingDate
              )}
            />

            <DetailRow
              icon="time-outline"
              label="Time"
              value={formatMeetingTime(
                meeting.meetingTime
              )}
            />

            <DetailRow
              icon="location-outline"
              label="Location"
              value={
                meeting.location ||
                "Not set"
              }
            />

          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Meeting Records
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Manage the agenda, attendance,
              minutes and resolutions for this
              meeting.
            </Text>

            <View style={styles.recordRows}>
              <Pressable
                style={styles.recordRow}
                onPress={() =>
                  router.push({
                    pathname:
                      "/meeting-agenda",
                    params: {
                      id: meeting.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="list-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.recordLabel}
                >
                  Agenda
                </Text>

                <Text
                  style={
                    styles.recordValue
                  }
                >
                  {sectionSummary.hasAgenda
                    ? "Added"
                    : "Not added"}
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
                      "/meeting-attendance",
                    params: {
                      id: meeting.id,
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
                  Attendance
                </Text>

                <Text
                  style={
                    styles.recordValue
                  }
                >
                  {sectionSummary.attendanceCount}
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
                      "/meeting-minutes",
                    params: {
                      id: meeting.id,
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
                  Minutes
                </Text>

                <Text
                  style={
                    styles.recordValue
                  }
                >
                  {sectionSummary.hasMinutes
                    ? "Added"
                    : "Not added"}
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
                      "/meeting-resolutions",
                    params: {
                      id: meeting.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="reader-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.recordLabel}
                >
                  Resolutions
                </Text>

                <Text
                  style={
                    styles.recordValue
                  }
                >
                  {sectionSummary.resolutionCount}
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
          table="meetings"
          recordId={meeting.id}
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

  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  stateText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  titleIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: "#EFF6FF",
  },

  titleText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.lg,
  },

  meetingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  statusBadge: {
    alignSelf: "flex-start",
    minWidth: 104,
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },

  statusOptions: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
  },

  statusOption: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  statusOptionSelected: {
    backgroundColor: "#EFF6FF",
  },

  statusOptionText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  statusOptionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  statusCheckSlot: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  statusErrorText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },

  detailsGroup: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    marginLeft: spacing.sm,
  },

  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  detailValue: {
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },

  section: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  sectionDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  recordRows: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  recordRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
  },

  recordDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  recordLabel: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  recordValue: {
    marginRight: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});
