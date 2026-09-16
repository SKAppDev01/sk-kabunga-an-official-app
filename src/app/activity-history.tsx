import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import type { ComponentProps } from "react";
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
  AppActivity,
  AppActivityAction,
  getRecentAppActivities,
} from "../services/app-activity";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type ActivityFilter =
  | "all"
  | "projects"
  | "finance";

export default function ActivityHistoryScreen() {
  const [activities, setActivities] =
    useState<AppActivity[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [filter, setFilter] =
    useState<ActivityFilter>("all");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadActivities() {
        try {
          setIsLoading(true);

          // Large enough for current use. A paginated
          // audit trail can replace this in Phase 13.
          const result =
            await getRecentAppActivities(500);

          if (active) {
            setActivities(result);
          }
        } catch (error) {
          console.error(
            "Activity history loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadActivities();

      return () => {
        active = false;
      };
    }, [])
  );

  const filteredActivities =
    useMemo(() => {
      if (filter === "all") {
        return activities;
      }

      if (filter === "projects") {
        return activities.filter(
          (activity) =>
            activity.actionType.startsWith(
              "project_"
            )
        );
      }

      return activities.filter(
        (activity) =>
          activity.actionType.startsWith(
            "budget_"
          ) ||
          activity.actionType.startsWith(
            "finance_"
          )
      );
    }, [activities, filter]);

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

  function formatActivityTime(
    value: string
  ) {
    const normalized =
      value.includes("T")
        ? value
        : `${value.replace(" ", "T")}Z`;

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="All Activity"
        showBack
      />
<View style={styles.screen}>
        <Text style={styles.introText}>
          Review recorded actions without crowding
          the Home dashboard.
        </Text>

        <View style={styles.filters}>
          <FilterChip
            label="All"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />

          <FilterChip
            label="Projects"
            active={filter === "projects"}
            onPress={() =>
              setFilter("projects")
            }
          />

          <FilterChip
            label="Finance"
            active={filter === "finance"}
            onPress={() =>
              setFilter("finance")
            }
          />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading activity history...
            </Text>
          </View>
        ) : filteredActivities.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="time-outline"
                size={34}
                color={colors.textMuted}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No activity found
            </Text>

            <Text style={styles.stateText}>
              Recorded app actions will appear here.
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
            <Text style={styles.countText}>
              {filteredActivities.length}{" "}
              {filteredActivities.length === 1
                ? "activity"
                : "activities"}
            </Text>

            {filteredActivities.map(
              (activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.activityRow,
                    index <
                      filteredActivities.length - 1 &&
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
                      <Text
                        style={
                          styles.activityLabel
                        }
                      >
                        {getActivityLabel(
                          activity.actionType
                        )}
                      </Text>

                      <Text
                        style={
                          styles.activitySubject
                        }
                        numberOfLines={2}
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
                            numberOfLines={2}
                          >
                            {activity.detail}
                          </Text>
                        )}

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
                </View>
              )
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.filterChip,
        active &&
          styles.filterChipActive,
        pressed &&
          styles.filterChipPressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterChipText,
          active &&
            styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  introText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  filters: {
    flexDirection: "row",
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },

  filterChip: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.white,
  },

  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  filterChipPressed: {
    opacity: 0.7,
  },

  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
  },

  filterChipTextActive: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xxxl,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },

  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  stateText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: spacing.xxxl,
  },

  countText: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.lg,
  },

  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  activityIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  activityText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  activityLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  activitySubject: {
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  activityDetail: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
  },

  activityTime: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});
