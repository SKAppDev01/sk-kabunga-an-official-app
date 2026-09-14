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

import {
  ActivityRecord,
  ActivityStatus,
  getActivitiesList,
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
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatActivityTime(
  value: string | null
) {
  if (!value) {
    return "Time not set";
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

export default function ActivitiesScreen() {
  const [activities, setActivities] =
    useState<ActivityRecord[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadActivities() {
        try {
          setIsLoading(true);

          const records =
            await getActivitiesList();

          if (active) {
            setActivities(records);
          }
        } catch (error) {
          console.error(
            "Activities list loading error:",
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

  function renderActivity(
    activity: ActivityRecord,
    index: number
  ) {
    const statusStyle =
      getStatusStyle(
        activity.status
      );

    return (
      <Pressable
        key={activity.id}
        style={({ pressed }) => [
          styles.activityRow,
          index <
            activities.length - 1 &&
            styles.rowDivider,
          pressed &&
            styles.activityRowPressed,
        ]}
        onPress={() =>
          router.push({
            pathname: "/activity-details",
            params: {
              id: activity.id,
            },
          })
        }
      >
        <View style={styles.activityIcon}>
          <Ionicons
            name="people-circle-outline"
            size={24}
            color={colors.primary}
          />
        </View>

        <View style={styles.activityText}>
          <View style={styles.titleRow}>
            <Text
              style={styles.activityTitle}
              numberOfLines={1}
            >
              {activity.title}
            </Text>

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
          </View>

          <Text
            style={
              styles.activityDateTime
            }
            numberOfLines={1}
          >
            {formatActivityDate(
              activity.activityDate
            )}
            {" • "}
            {formatActivityTime(
              activity.activityTime
            )}
          </Text>

          <Text
            style={
              styles.activityLocation
            }
            numberOfLines={1}
          >
            {activity.location ||
              "Location not set"}
          </Text>
        </View>
      </Pressable>
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

        <Text style={styles.headerTitle}>
          Activities
        </Text>

        <View
          style={styles.headerCountWrap}
        >
          {!isLoading ? (
            <View
              style={styles.headerCountBadge}
            >
              <Text
                style={styles.headerCountText}
              >
                {activities.length}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.screen}>
        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading activities...
            </Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-circle-outline"
                size={44}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No activities yet
            </Text>

            <Text style={styles.stateText}>
              Create your first youth
              activity record to get started.
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
            {activities.map(
              renderActivity
            )}
          </ScrollView>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.floatingAddButton,
            pressed &&
              styles.floatingAddButtonPressed,
          ]}
          onPress={() =>
            router.push(
              "/create-activity"
            )
          }
          accessibilityLabel="Add activity"
        >
          <Ionicons
            name="add"
            size={31}
            color={colors.white}
          />
        </Pressable>
      </View>
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
    width: 78,
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

  headerCountWrap: {
    width: 78,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerCountBadge: {
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.sm,
    borderRadius: 999,
    backgroundColor:
      "#EFF6FF",
  },

  headerCountText: {
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  screen: {
    backgroundColor: "#E3F2FD",
    flex: 1,
    paddingHorizontal:
      spacing.xl,
    paddingTop: spacing.md,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.xl,
    paddingBottom:
      spacing.xxxl,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  stateText: {
    marginTop: spacing.sm,
    maxWidth: 300,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
    textAlign: "center",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 100,
  },

  floatingAddButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  floatingAddButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  activityRow: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  activityRowPressed: {
    opacity: 0.65,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  activityIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  activityText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  activityTitle: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  statusBadge: {
    minWidth: 74,
    minHeight: 25,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.sm,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },

  activityDateTime: {
    marginTop: 5,
    fontSize:
      typography.fontSize.xs,
    color:
      colors.textSecondary,
  },

  activityLocation: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
  },
});
