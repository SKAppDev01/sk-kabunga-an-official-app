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
  Alert,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BudgetAllocation,
  deleteBudgetAllocation,
  getBudgetAllocations,
  setBudgetAllocationYouthVisibility,
} from "../services/budget-allocations";
import {
  getCurrentSessionUser,
} from "../services/session";
import { isYouthMemberRole } from "../services/access";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function BudgetAllocationsScreen() {
  const [allocations, setAllocations] =
    useState<BudgetAllocation[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isYouthMember, setIsYouthMember] =
    useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const loadAllocations =
    useCallback(async () => {
      try {
        setIsLoading(true);
        const result =
          await getBudgetAllocations();
        setAllocations(result);
      } catch (error) {
        console.error(
          "Budget allocations loading error:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setIsLoading(true);
          const user =
            await getCurrentSessionUser();

          if (!user) {
            router.replace("/login");
            return;
          }

          const result =
            await getBudgetAllocations();

          if (active) {
            setIsYouthMember(
              isYouthMemberRole(user.role)
            );
            setAllocations(result);
          }
        } catch (error) {
          console.error(
            "Budget allocations loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [])
  );

  function formatCurrency(value: number) {
    return `₱${value.toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function confirmDelete(
    allocation: BudgetAllocation
  ) {
    if (deletingId) return;

    Alert.alert(
      "Delete Budget Allocation",
      `Delete "${allocation.title}"? This will reduce the total allocated budget.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(allocation.id);

              const user =
                await getCurrentSessionUser();

              await deleteBudgetAllocation(
                allocation.id,
                user?.id
              );

              await loadAllocations();
            } catch (error) {
              console.error(
                "Delete allocation error:",
                error
              );

              Alert.alert(
                "Unable to Delete",
                "The budget allocation could not be deleted."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  const canManage =
    !isLoading && !isYouthMember;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Budget Allocations
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.screen}>
        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading allocations...
            </Text>
          </View>
        ) : allocations.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="pie-chart-outline"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No budget allocations
            </Text>

            <Text style={styles.stateText}>
              {isYouthMember
                ? "No budget allocations are currently available to youth members."
                : "Tap the + button to allocate part of the SK budget."}
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
              {allocations.length}{" "}
              {allocations.length === 1
                ? "allocation"
                : "allocations"}
            </Text>

            {allocations.map((allocation) => (
              <View
                key={allocation.id}
                style={styles.allocationCard}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Ionicons
                      name="pie-chart-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.cardText}>
                    <Text
                      style={styles.title}
                      numberOfLines={2}
                    >
                      {allocation.title}
                    </Text>

                    <Text
                      style={styles.category}
                      numberOfLines={1}
                    >
                      {allocation.categoryName ||
                        "Uncategorized"}
                    </Text>
                  </View>

                  {canManage && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={() =>
                      confirmDelete(allocation)
                    }
                    disabled={
                      deletingId === allocation.id
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </Pressable>
                  )}
                </View>

                <Text style={styles.amount}>
                  {formatCurrency(
                    allocation.amount
                  )}
                </Text>

                <View style={styles.metaRow}>
                  {allocation.fiscalYear ? (
                    <View style={styles.metaPill}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text style={styles.metaText}>
                        FY {allocation.fiscalYear}
                      </Text>
                    </View>
                  ) : null}

                  {allocation.projectTitle ? (
                    <View style={styles.metaPill}>
                      <Ionicons
                        name="folder-outline"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={styles.metaText}
                        numberOfLines={1}
                      >
                        {allocation.projectTitle}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {canManage && (
                  <View style={styles.visibilityRow}>
                    <View style={styles.visibilityLabelArea}>
                      <Ionicons
                        name="eye-outline"
                        size={17}
                        color={
                          allocation.isYouthVisible
                            ? colors.success
                            : colors.textMuted
                        }
                      />
                      <Text style={styles.visibilityText}>
                        Visible to youth members
                      </Text>
                    </View>

                    <Switch
                      value={allocation.isYouthVisible}
                      onValueChange={async (value) => {
                        try {
                          await setBudgetAllocationYouthVisibility(
                            allocation.id,
                            value
                          );
                          await loadAllocations();
                        } catch (error) {
                          console.error(
                            "Allocation visibility update error:",
                            error
                          );
                        }
                      }}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                )}

                {allocation.notes ? (
                  <Text
                    style={styles.notes}
                    numberOfLines={3}
                  >
                    {allocation.notes}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        )}

        {canManage && (
        <Pressable
          style={({ pressed }) => [
            styles.floatingAddButton,
            pressed &&
              styles.floatingAddButtonPressed,
          ]}
          onPress={() =>
            router.push(
              "/add-budget-allocation"
            )
          }
        >
          <Ionicons
            name="add"
            size={31}
            color={colors.white}
          />
        </Pressable>
        )}
      </View>
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
    alignItems: "center",
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

  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: 70,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
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

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 100,
  },

  countText: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  allocationCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  cardText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  title: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  category: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  deleteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  amount: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  metaPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },

  metaText: {
    flexShrink: 1,
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  visibilityLabelArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },

  visibilityText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  notes: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
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
    transform: [{ scale: 0.96 }],
  },

  buttonPressed: {
    opacity: 0.72,
  },
});
