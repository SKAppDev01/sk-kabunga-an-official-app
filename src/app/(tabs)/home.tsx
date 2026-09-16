import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import type { ComponentProps } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../components/AppHeader";

import { CivicBackground } from "../../components/CivicBackground";


import {
  getCurrentSessionUser,
  SessionUser,
} from "../../services/session";
import {
  getAllLocalProjects,
  LocalProject,
} from "../../services/projects";
import {
  AppActivity,
  AppActivityAction,
  getRecentAppActivities,
} from "../../services/app-activity";
import {
  FinanceSummary,
  getFinanceSummary,
} from "../../services/finance";
import {
  ActivityRecord,
  getActivitiesList,
} from "../../services/activities";
import {
  MeetingRecord,
  getMeetingsList,
} from "../../services/meetings";
import { isYouthMemberRole } from "../../services/access";
import { colors, spacing, typography } from "../../theme";

export default function HomeScreen() {
  const [currentUser, setCurrentUser] =
    useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [projects, setProjects] =
    useState<LocalProject[]>([]);
  const [activities, setActivities] =
    useState<ActivityRecord[]>([]);
  const [meetings, setMeetings] =
    useState<MeetingRecord[]>([]);
  const [recentActivities, setRecentActivities] =
    useState<AppActivity[]>([]);
  const [financeSummary, setFinanceSummary] =
    useState<FinanceSummary>({
      totalAllocated: 0,
      totalExpenses: 0,
      remainingBalance: 0,
      categoryCount: 0,
      allocationCount: 0,
      expenseCount: 0,
    });
  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHomeData() {
        try {
          setIsLoading(true);

          const user =
            await getCurrentSessionUser();

          if (!active) return;

          if (!user) {
            router.replace("/login");
            return;
          }

          const youthMember =
            isYouthMemberRole(user.role);

          const [
            projectList,
            finance,
            activityRecords,
            meetingRecords,
            activityList,
          ] = await Promise.all([
            getAllLocalProjects(),
            getFinanceSummary(),
            youthMember
              ? Promise.resolve(
                  [] as ActivityRecord[]
                )
              : getActivitiesList(),
            youthMember
              ? Promise.resolve(
                  [] as MeetingRecord[]
                )
              : getMeetingsList(),
            youthMember
              ? Promise.resolve(
                  [] as AppActivity[]
                )
              : getRecentAppActivities(5),
          ]);

          if (!active) return;

          setCurrentUser(user);
          setProjects(projectList);
          setActivities(activityRecords);
          setMeetings(meetingRecords);
          setRecentActivities(activityList);
          setFinanceSummary(finance);
        } catch (error) {
          console.error(
            "Home data loading error:",
            error
          );

          if (active) {
            router.replace("/login");
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadHomeData();

      return () => {
        active = false;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      setCurrentTime(Date.now());

      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 60_000);

      return () => {
        clearInterval(timer);
      };
    }, [])
  );

  function getFirstName() {
    if (currentUser?.fullName) {
      return currentUser.fullName
        .trim()
        .split(/\s+/)[0];
    }

    return currentUser?.username ?? "Official";
  }

  function formatCompactCurrency(value: number) {
    return `₱${value.toLocaleString("en-PH", {
      maximumFractionDigits: 0,
    })}`;
  }

  function getActivityLabel(
    actionType: AppActivityAction
  ) {
    switch (actionType) {
      case "project_created":
        return "Project created";
      case "project_updated":
        return "Project updated";
      case "project_archived":
        return "Project archived";
      case "project_restored":
        return "Project restored";
      case "project_deleted":
        return "Project deleted";
      case "project_expense_added":
        return "Expense recorded";
      case "project_participant_added":
        return "Participant added";
      case "project_participant_removed":
        return "Participant removed";
      case "budget_category_created":
        return "Budget category created";
      case "budget_category_deleted":
        return "Budget category deleted";
      case "budget_allocation_created":
        return "Budget allocation added";
      case "budget_allocation_deleted":
        return "Budget allocation deleted";
      case "finance_expense_created":
        return "Expense recorded";
      case "finance_expense_updated":
        return "Expense updated";
      case "finance_receipt_attached":
        return "Receipt attached";
      case "finance_receipt_removed":
        return "Receipt removed";
      default:
        return "App activity";
    }
  }

  function getActivityIcon(
    actionType: AppActivityAction
  ): ComponentProps<typeof Ionicons>["name"] {
    switch (actionType) {
      case "project_created":
        return "add-circle-outline";
      case "project_updated":
        return "create-outline";
      case "project_archived":
        return "archive-outline";
      case "project_restored":
        return "refresh-outline";
      case "project_deleted":
        return "trash-outline";
      case "project_expense_added":
        return "receipt-outline";
      case "project_participant_added":
        return "person-add-outline";
      case "project_participant_removed":
        return "person-remove-outline";
      case "budget_category_created":
      case "budget_category_deleted":
        return "albums-outline";
      case "budget_allocation_created":
      case "budget_allocation_deleted":
        return "pie-chart-outline";
      case "finance_expense_created":
        return "receipt-outline";
      case "finance_expense_updated":
        return "create-outline";
      case "finance_receipt_attached":
        return "image-outline";
      case "finance_receipt_removed":
        return "trash-outline";
      default:
        return "time-outline";
    }
  }

  function formatActivityTime(value: string) {
    const normalized =
      value.includes("T")
        ? value
        : `${value.replace(" ", "T")}Z`;

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const differenceMs =
      Date.now() - date.getTime();
    const differenceMinutes = Math.floor(
      differenceMs / 60000
    );

    if (differenceMinutes < 1) {
      return "Just now";
    }

    if (differenceMinutes < 60) {
      return `${differenceMinutes}m ago`;
    }

    const differenceHours = Math.floor(
      differenceMinutes / 60
    );

    if (differenceHours < 24) {
      return `${differenceHours}h ago`;
    }

    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
    });
  }

  type UpcomingEvent = {
    id: string;
    type: "Meeting" | "Activity";
    title: string;
    date: string;
    time: string | null;
    location: string | null;
  };

  function getEventDateTime(
    dateValue: string,
    timeValue: string | null
  ) {
    const dateMatch = dateValue.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (!dateMatch) {
      return null;
    }

    const timeMatch = timeValue?.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );

    // If an event has no saved time, keep it upcoming
    // until the end of that date.
    const hours = timeMatch
      ? Number(timeMatch[1])
      : 23;
    const minutes = timeMatch
      ? Number(timeMatch[2])
      : 59;
    const seconds = timeMatch?.[3]
      ? Number(timeMatch[3])
      : timeMatch
        ? 0
        : 59;

    const date = new Date(
      Number(dateMatch[1]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[3]),
      hours,
      minutes,
      seconds,
      timeMatch ? 0 : 999
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  function isFinishedStatus(
    status: string | null | undefined
  ) {
    const normalized = status
      ?.trim()
      .toLowerCase();

    return (
      normalized === "completed" ||
      normalized === "cancelled" ||
      normalized === "canceled"
    );
  }

  function formatUpcomingDate(
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

    return date.toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !==
          new Date().getFullYear()
            ? "numeric"
            : undefined,
      }
    );
  }

  function formatUpcomingTime(
    value: string | null
  ) {
    if (!value) {
      return null;
    }

    const match = value.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?$/
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

  function openUpcomingEvent(
    event: UpcomingEvent
  ) {
    router.push({
      pathname:
        event.type === "Meeting"
          ? "/meeting-details"
          : "/activity-details",
      params: {
        id: event.id,
      },
    });
  }

  const allUpcomingEvents: UpcomingEvent[] = [
    ...meetings
      .filter(
        (meeting) =>
          !isFinishedStatus(meeting.status)
      )
      .map(
        (meeting): UpcomingEvent => ({
          id: meeting.id,
          type: "Meeting",
          title: meeting.title,
          date: meeting.meetingDate,
          time: meeting.meetingTime,
          location: meeting.location,
        })
      ),
    ...activities
      .filter(
        (activity) =>
          !isFinishedStatus(activity.status)
      )
      .map(
        (activity): UpcomingEvent => ({
          id: activity.id,
          type: "Activity",
          title: activity.title,
          date: activity.activityDate,
          time: activity.activityTime,
          location: activity.location,
        })
      ),
  ]
    .filter((event) => {
      const eventDateTime =
        getEventDateTime(
          event.date,
          event.time
        );

      return (
        eventDateTime !== null &&
        eventDateTime.getTime() >= currentTime
      );
    })
    .sort((a, b) => {
      const aDateTime = getEventDateTime(
        a.date,
        a.time
      );
      const bDateTime = getEventDateTime(
        b.date,
        b.time
      );

      return (
        (aDateTime?.getTime() ??
          Number.MAX_SAFE_INTEGER) -
        (bDateTime?.getTime() ??
          Number.MAX_SAFE_INTEGER)
      );
    });

  // Keep the Home screen compact. The dedicated
  // Upcoming Events screen can show the full list.
  const upcomingEvents =
    allUpcomingEvents.slice(0, 5);

  const youthMember =
    isYouthMemberRole(currentUser?.role);
  const showAdminActivity =
    Boolean(currentUser) && !youthMember;

  return (
    <View style={styles.background}>
      <CivicBackground />

      <SafeAreaView
        style={styles.safeArea}
      edges={["left", "right", "bottom"]}
      >
        <AppHeader
          title="Home"
        />
<ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        


        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>
              SK Kabunga-an
            </Text>

            <Text style={styles.greeting}>
              <Text style={styles.greetingBlue}>
                {isLoading ? "Welcome" : "Welcome,"}
              </Text>

              {!isLoading ? (
                <Text style={styles.greetingRed}>
                  {` ${getFirstName()}`}
                </Text>
              ) : null}
            </Text>

            <View style={styles.flagAccent}>
              <View
                style={[
                  styles.flagAccentSection,
                  styles.flagAccentBlue,
                ]}
              />

              <View
                style={[
                  styles.flagAccentSection,
                  styles.flagAccentGold,
                ]}
              />

              <View
                style={[
                  styles.flagAccentSection,
                  styles.flagAccentRed,
                ]}
              />
            </View>

            <Text style={styles.role}>
              {currentUser?.role || "SK Official"}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.profileIcon,
              pressed && styles.profileIconPressed,
            ]}
            onPress={() => router.push("/profile")}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={6}
          >
            <Ionicons
              name="person-outline"
              size={25}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Overview
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="wallet-outline"
            value={
              isLoading
                ? "—"
                : formatCompactCurrency(
                    financeSummary.totalAllocated
                  )
            }
            label="Budget"
            variant="budget"
          />

          <View style={styles.summaryCompactRow}>
            <SummaryCard
              icon="folder-outline"
              value={
                isLoading
                  ? "—"
                  : String(projects.length)
              }
              label="Projects"
              variant="compact"
              tone="blue"
            />

            <SummaryCard
              icon="receipt-outline"
              value={
                isLoading
                  ? "—"
                  : formatCompactCurrency(
                      financeSummary.totalExpenses
                    )
              }
              label="Expenses"
              variant="compact"
              tone="red"
            />

            <SummaryCard
              icon="calendar-outline"
              value={
                isLoading
                  ? "—"
                  : String(
                      activities.length
                    )
              }
              label="Activities"
              variant="compact"
              tone="gold"
            />
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Upcoming
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.viewAllHeaderButton,
              pressed &&
                styles.viewAllButtonPressed,
            ]}
            onPress={() =>
              router.push(
                "/upcoming-events"
              )
            }
          >
            <Text style={styles.viewAllText}>
              View Upcoming Events
            </Text>

            <Ionicons
              name="chevron-forward-outline"
              size={17}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          {isLoading ? (
          <View style={styles.upcomingRow}>
            <View style={styles.upcomingIcon}>
              <Ionicons
                name="calendar-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>
                Loading upcoming events...
              </Text>
            </View>
          </View>
        ) : upcomingEvents.length === 0 ? (
          <View style={styles.upcomingRow}>
            <View style={styles.upcomingIcon}>
              <Ionicons
                name="calendar-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>
                No upcoming events
              </Text>

              <Text style={styles.emptyText}>
                Future scheduled meetings and
                planned activities will appear
                here automatically.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.upcomingList}>
            {upcomingEvents.map(
              (event, index) => {
                const formattedTime =
                  formatUpcomingTime(
                    event.time
                  );

                return (
                  <Pressable
                    key={`${event.type}-${event.id}`}
                    style={({ pressed }) => [
                      styles.upcomingEventRow,
                      index <
                        upcomingEvents.length - 1 &&
                        styles.upcomingEventBorder,
                      pressed &&
                        styles.upcomingEventPressed,
                    ]}
                    onPress={() =>
                      openUpcomingEvent(event)
                    }
                  >
                    <View
                      style={styles.upcomingEventIcon}
                    >
                      <Ionicons
                        name={
                          event.type === "Meeting"
                            ? "calendar-outline"
                            : "people-circle-outline"
                        }
                        size={20}
                        color={colors.primary}
                      />
                    </View>

                    <View
                      style={
                        styles.upcomingEventContent
                      }
                    >
                      <View
                        style={
                          styles.upcomingEventTopRow
                        }
                      >
                        <Text
                          style={
                            styles.upcomingEventTitle
                          }
                          numberOfLines={1}
                        >
                          {event.title}
                        </Text>

                        <Text
                          style={
                            styles.upcomingEventType
                          }
                        >
                          {event.type}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.upcomingEventMeta
                        }
                        numberOfLines={1}
                      >
                        {formatUpcomingDate(
                          event.date
                        )}
                        {formattedTime
                          ? ` • ${formattedTime}`
                          : ""}
                      </Text>

                      {event.location ? (
                        <Text
                          style={
                            styles.upcomingEventLocation
                          }
                          numberOfLines={1}
                        >
                          {event.location}
                        </Text>
                      ) : null}
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
        </View>

        {showAdminActivity && (
          <>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Recent Activity
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.viewAllHeaderButton,
              pressed &&
                styles.viewAllButtonPressed,
            ]}
            onPress={() =>
              router.push(
                "/activity-history"
              )
            }
          >
            <Text style={styles.viewAllText}>
              View All Activity
            </Text>

            <Ionicons
              name="chevron-forward-outline"
              size={17}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          {recentActivities.length === 0 ? (
            <View style={styles.recentContent}>
              <Ionicons
                name="time-outline"
                size={32}
                color={colors.textMuted}
              />

              <Text style={styles.emptyActivityTitle}>
                Nothing recorded yet
              </Text>

              <Text style={styles.emptyActivityText}>
                New app actions will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {recentActivities.map(
                (activity, index) => (
                  <View
                    key={activity.id}
                    style={[
                      styles.activityRow,
                      index <
                        recentActivities.length - 1 &&
                        styles.activityRowBorder,
                    ]}
                  >
                    <View
                      style={styles.activityIcon}
                    >
                      <Ionicons
                        name={getActivityIcon(
                          activity.actionType
                        )}
                        size={20}
                        color={colors.primary}
                      />
                    </View>

                    <View
                      style={styles.activityText}
                    >
                      <View
                        style={
                          styles.activityTopRow
                        }
                      >
                        <Text
                          style={
                            styles.activityLabel
                          }
                          numberOfLines={1}
                        >
                          {getActivityLabel(
                            activity.actionType
                          )}
                        </Text>

                        <Text
                          style={
                            styles.activityTime
                          }
                        >
                          {formatActivityTime(
                            activity.createdAt
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.activitySubject
                        }
                        numberOfLines={1}
                      >
                        {activity.subject}
                      </Text>

                      {activity.detail &&
                        activity.detail !==
                          getActivityLabel(
                            activity.actionType
                          ) && (
                          <Text
                            style={
                              styles.activityDetail
                            }
                            numberOfLines={1}
                          >
                            {activity.detail}
                          </Text>
                        )}
                    </View>
                  </View>
                )
              )}

            </View>
          )}
        </View>
          </>
        )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  variant,
  tone = "blue",
}: {
  icon:
    | "folder-outline"
    | "wallet-outline"
    | "receipt-outline"
    | "calendar-outline";
  value: string;
  label: string;
  variant: "budget" | "compact";
  tone?: "blue" | "red" | "gold";
}) {
  const compact = variant === "compact";
  const accentColor =
    tone === "red"
      ? "#CE1126"
      : tone === "gold"
        ? "#B77900"
        : colors.primary;

  const accentStyle =
    tone === "red"
      ? styles.summaryAccentRed
      : tone === "gold"
        ? styles.summaryAccentGold
        : styles.summaryAccentBlue;

  const iconTintStyle =
    tone === "red"
      ? styles.summaryIconRedTint
      : tone === "gold"
        ? styles.summaryIconGoldTint
        : styles.summaryIconBlueTint;

  if (!compact) {
    return (
      <View
        style={[
          styles.summaryCard,
          styles.summaryBudgetCard,
        ]}
      >
        <View
          style={[
            styles.summaryInsetAccent,
            styles.summaryBudgetInsetAccent,
            styles.summaryAccentBlue,
          ]}
        />

        <View style={styles.summaryBudgetHeader}>
          <View style={styles.summaryBudgetHeading}>
            <View
              style={[
                styles.summaryIcon,
                styles.summaryBudgetIcon,
                styles.summaryIconBlueTint,
              ]}
            >
              <Ionicons
                name={icon}
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.summaryBudgetTitleBlock}>
              <Text style={styles.summaryBudgetLabel}>
                {label}
              </Text>
            </View>
          </View>

          <View style={styles.summaryBudgetBadge}>
            <Text style={styles.summaryBudgetBadgeText}>
              TOTAL
            </Text>
          </View>
        </View>

        <Text
          style={styles.summaryBudgetValue}
          numberOfLines={1}
        >
          {value}
        </Text>

        <View style={styles.summaryBudgetFooter}>
          <Text style={styles.summaryBudgetFootnote}>
            Allocated funds
          </Text>

          <View style={styles.summaryBudgetFlagAccent}>
            <View style={styles.summaryBudgetFlagBlue} />
            <View style={styles.summaryBudgetFlagGold} />
            <View style={styles.summaryBudgetFlagRed} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.summaryCard,
        styles.summaryCompactCard,
      ]}
    >
      <View
        style={[
          styles.summaryInsetAccent,
          styles.summaryCompactInsetAccent,
          accentStyle,
        ]}
      />

      <View
        style={[
          styles.summaryIcon,
          styles.summaryCompactIcon,
          iconTintStyle,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={accentColor}
        />
      </View>

      <Text
        style={[
          styles.summaryValue,
          styles.summaryCompactValue,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
      >
        {value}
      </Text>

      <View style={styles.summaryCompactFooter}>
        <Text
          style={[
            styles.summaryLabel,
            styles.summaryCompactLabel,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {label}
        </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 112,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxl,
  },

  headerLeft: {
    flex: 1,
    marginRight: spacing.lg,
  },

  appName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  greeting: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xl,
    lineHeight: 34,
    fontWeight: typography.fontWeight.bold,
    flexShrink: 1,
  },

  greetingBlue: {
    color: "#0038A8",
  },

  greetingRed: {
    color: "#CE1126",
  },

  flagAccent: {
    width: 118,
    height: 4,
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
  },

  flagAccentSection: {
    height: "100%",
  },

  flagAccentBlue: {
    flex: 5,
    backgroundColor: "#0038A8",
  },

  flagAccentGold: {
    flex: 1,
    backgroundColor: "#FCD116",
  },

  flagAccentRed: {
    flex: 5,
    backgroundColor: "#CE1126",
  },

  role: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  profileIconPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },

  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  summaryGrid: {
    width: "100%",
    marginBottom: spacing.xl,
  },

  summaryCompactRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryCard: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
    borderRadius: 18,
    backgroundColor: colors.white,
    elevation: 5,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  summaryBudgetCard: {
    width: "100%",
    minHeight: 156,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderColor: "rgba(37,99,235,0.22)",
  },

  summaryInsetAccent: {
    position: "absolute",
    top: 9,
    height: 3,
    borderRadius: 999,
  },

  summaryBudgetInsetAccent: {
    left: spacing.lg,
    right: spacing.lg,
  },

  summaryCompactInsetAccent: {
    left: spacing.sm,
    right: spacing.sm,
  },

  summaryBudgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryBudgetHeading: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  summaryBudgetIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },

  summaryBudgetTitleBlock: {
    minWidth: 0,
    flex: 1,
    marginLeft: spacing.md,
  },


  summaryBudgetLabel: {
    marginTop: 1,
    fontSize: typography.fontSize.md,
    lineHeight: 21,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  summaryBudgetBadge: {
    flexShrink: 0,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  summaryBudgetBadgeText: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.8,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  summaryBudgetValue: {
    marginTop: spacing.md,
    fontSize: 42,
    lineHeight: 50,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  summaryBudgetFooter: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryBudgetFootnote: {
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  summaryBudgetFlagAccent: {
    width: 54,
    height: 4,
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 999,
  },

  summaryBudgetFlagBlue: {
    flex: 5,
    backgroundColor: "#0038A8",
  },

  summaryBudgetFlagGold: {
    flex: 1,
    backgroundColor: "#FCD116",
  },

  summaryBudgetFlagRed: {
    flex: 5,
    backgroundColor: "#CE1126",
  },

  summaryCompactCard: {
    width: "31.5%",
    minHeight: 126,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },


  summaryAccentBlue: {
    backgroundColor: "#2563EB",
  },

  summaryAccentRed: {
    backgroundColor: "#CE1126",
  },

  summaryAccentGold: {
    backgroundColor: "#E6A700",
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCompactIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },

  summaryIconBlueTint: {
    backgroundColor: "rgba(37,99,235,0.09)",
  },

  summaryIconRedTint: {
    backgroundColor: "rgba(206,17,38,0.08)",
  },

  summaryIconGoldTint: {
    backgroundColor: "rgba(230,167,0,0.11)",
  },

  summaryValue: {
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },

  summaryCompactValue: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.lg,
    lineHeight: 25,
  },

  summaryLabel: {
    color: colors.textSecondary,
  },

  summaryCompactFooter: {
    minWidth: 0,
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },

  summaryCompactLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    fontWeight: typography.fontWeight.semibold,
  },


  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },

  upcomingCard: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },

  upcomingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.lg,
  },

  upcomingList: {
    width: "100%",
  },

  upcomingEventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  upcomingEventBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  upcomingEventPressed: {
    opacity: 0.65,
  },

  upcomingEventContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },

  upcomingEventTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  upcomingEventTitle: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  upcomingEventType: {
    flexShrink: 0,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  upcomingEventMeta: {
    width: "100%",
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  upcomingEventLocation: {
    width: "100%",
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
  },

  upcomingEventIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  upcomingIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  emptyText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  activityList: {
    width: "100%",
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  activityText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  activityTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  activityLabel: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  activityTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  activitySubject: {
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  activityDetail: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewAllHeaderButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },

  viewAllButtonPressed: {
    opacity: 0.65,
  },

  viewAllText: {
    marginRight: 2,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  recentContent: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  emptyActivityTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  emptyActivityText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
