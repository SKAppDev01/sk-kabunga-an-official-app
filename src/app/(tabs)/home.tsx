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
import { isYouthMemberRole } from "../../services/access";
import { colors, spacing, typography } from "../../theme";

export default function HomeScreen() {
  const [currentUser, setCurrentUser] =
    useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [projects, setProjects] =
    useState<LocalProject[]>([]);
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
            activityList,
          ] = await Promise.all([
            getAllLocalProjects(),
            getFinanceSummary(),
            youthMember
              ? Promise.resolve([] as AppActivity[])
              : getRecentAppActivities(5),
          ]);

          if (!active) return;

          setCurrentUser(user);
          setProjects(projectList);
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

  const youthMember =
    isYouthMemberRole(currentUser?.role);
  const showAdminActivity =
    Boolean(currentUser) && !youthMember;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
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
              {isLoading
                ? "Welcome"
                : `Welcome, ${getFirstName()}`}
            </Text>

            <Text style={styles.role}>
              {currentUser?.role || "SK Official"}
            </Text>
          </View>

          <View style={styles.profileIcon}>
            <Ionicons
              name="person-outline"
              size={25}
              color={colors.primary}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Overview
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="folder-outline"
            value={
              isLoading
                ? "—"
                : String(projects.length)
            }
            label="Projects"
          />

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
          />

          <SummaryCard
            icon="calendar-outline"
            value="0"
            label="Activities"
          />
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
              No upcoming activities
            </Text>

            <Text style={styles.emptyText}>
              Scheduled activities and meetings
              will appear here.
            </Text>
          </View>
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
  );
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon:
    | "folder-outline"
    | "wallet-outline"
    | "receipt-outline"
    | "calendar-outline";
  value: string;
  label: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
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

  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },

  summaryCard: {
    width: "48%",
    minHeight: 135,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  summaryValue: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  summaryLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  upcomingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
