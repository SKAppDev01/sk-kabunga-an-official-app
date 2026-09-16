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
  getActivitiesList,
} from "../services/activities";
import {
  getMeetingsList,
  MeetingRecord,
} from "../services/meetings";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  isYouthMemberRole,
} from "../services/access";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type UpcomingEvent = {
  id: string;
  kind: "meeting" | "activity";
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  status: string;
};

function getTodayStorageDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1
    ).padStart(2, "0"),
    String(
      now.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function formatDate(
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

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const eventStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const dayDifference =
    Math.round(
      (eventStart.getTime() -
        todayStart.getTime()) /
        86400000
    );

  if (dayDifference === 0) {
    return "Today";
  }

  if (dayDifference === 1) {
    return "Tomorrow";
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !==
        today.getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}

function formatTime(
  value: string | null
) {
  if (!value) {
    return null;
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

function combineUpcomingEvents(
  meetings: MeetingRecord[],
  activities: ActivityRecord[]
) {
  const today =
    getTodayStorageDate();

  const meetingEvents: UpcomingEvent[] =
    meetings
      .filter(
        (meeting) =>
          meeting.meetingDate >= today &&
          meeting.status !== "Completed" &&
          meeting.status !== "Cancelled"
      )
      .map((meeting) => ({
        id: meeting.id,
        kind: "meeting" as const,
        title: meeting.title,
        date: meeting.meetingDate,
        time: meeting.meetingTime,
        location: meeting.location,
        status: meeting.status,
      }));

  const activityEvents: UpcomingEvent[] =
    activities
      .filter(
        (activity) =>
          activity.activityDate >= today &&
          activity.status !== "Completed" &&
          activity.status !== "Cancelled"
      )
      .map((activity) => ({
        id: activity.id,
        kind: "activity" as const,
        title: activity.title,
        date: activity.activityDate,
        time: activity.activityTime,
        location: activity.location,
        status: activity.status,
      }));

  return [
    ...meetingEvents,
    ...activityEvents,
  ].sort((a, b) => {
    const aKey =
      `${a.date}T${a.time ?? "23:59"}`;
    const bKey =
      `${b.date}T${b.time ?? "23:59"}`;

    return aKey.localeCompare(bKey);
  });
}

export default function UpcomingEventsScreen() {
  const [events, setEvents] =
    useState<UpcomingEvent[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [restricted, setRestricted] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadUpcoming() {
        try {
          setIsLoading(true);

          const user =
            await getCurrentSessionUser();

          if (!active) {
            return;
          }

          if (!user) {
            router.replace("/login");
            return;
          }

          if (
            isYouthMemberRole(user.role)
          ) {
            setRestricted(true);
            setEvents([]);
            return;
          }

          setRestricted(false);

          const [
            meetings,
            activities,
          ] = await Promise.all([
            getMeetingsList(),
            getActivitiesList(),
          ]);

          if (!active) {
            return;
          }

          setEvents(
            combineUpcomingEvents(
              meetings,
              activities
            )
          );
        } catch (error) {
          console.error(
            "Upcoming events loading error:",
            error
          );

          if (active) {
            setEvents([]);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadUpcoming();

      return () => {
        active = false;
      };
    }, [])
  );

  function openEvent(
    event: UpcomingEvent
  ) {
    if (event.kind === "meeting") {
      router.push({
        pathname: "/meeting-details",
        params: {
          id: event.id,
        },
      });
      return;
    }

    router.push({
      pathname: "/activity-details",
      params: {
        id: event.id,
      },
    });
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Upcoming Events"
        showBack
      />
<ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <EmptyState
            title="Loading upcoming events..."
            description="Checking scheduled meetings and planned activities."
          />
        ) : restricted ? (
          <EmptyState
            title="Official access only"
            description="Upcoming official meetings and activities are available to authorized SK officials."
          />
        ) : events.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            description="Future scheduled meetings and planned activities will appear here automatically."
          />
        ) : (
          <View style={styles.eventList}>
            {events.map(
              (event, index) => {
                const time =
                  formatTime(event.time);

                return (
                  <Pressable
                    key={`${event.kind}-${event.id}`}
                    style={({ pressed }) => [
                      styles.eventRow,
                      index <
                        events.length - 1 &&
                        styles.eventBorder,
                      pressed &&
                        styles.eventPressed,
                    ]}
                    onPress={() =>
                      openEvent(event)
                    }
                  >
                    <View style={styles.eventIcon}>
                      <Ionicons
                        name={
                          event.kind ===
                          "meeting"
                            ? "people-outline"
                            : "calendar-outline"
                        }
                        size={22}
                        color={colors.primary}
                      />
                    </View>

                    <View
                      style={styles.eventContent}
                    >
                      <View
                        style={styles.eventTopRow}
                      >
                        <Text
                          style={styles.eventType}
                        >
                          {event.kind ===
                          "meeting"
                            ? "Meeting"
                            : "Activity"}
                        </Text>

                        <Text
                          style={styles.eventStatus}
                        >
                          {event.status}
                        </Text>
                      </View>

                      <Text
                        style={styles.eventTitle}
                        numberOfLines={2}
                      >
                        {event.title}
                      </Text>

                      <Text
                        style={styles.eventMeta}
                        numberOfLines={2}
                      >
                        {formatDate(
                          event.date
                        )}
                        {time
                          ? ` • ${time}`
                          : ""}
                        {event.location
                          ? ` • ${event.location}`
                          : ""}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward-outline"
                      size={19}
                      color={colors.textMuted}
                    />
                  </Pressable>
                );
              }
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyRow}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="calendar-outline"
          size={26}
          color={colors.primary}
        />
      </View>

      <View style={styles.emptyText}>
        <Text style={styles.emptyTitle}>
          {title}
        </Text>

        <Text
          style={styles.emptyDescription}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  eventList: {
    width: "100%",
  },

  eventRow: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  eventBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  eventPressed: {
    opacity: 0.65,
  },

  eventIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  eventContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },

  eventTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  eventType: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  eventStatus: {
    flexShrink: 0,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  eventTitle: {
    width: "100%",
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  eventMeta: {
    width: "100%",
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  emptyRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  iconContainer: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  emptyTitle: {
    width: "100%",
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  emptyDescription: {
    width: "100%",
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
