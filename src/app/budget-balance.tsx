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
  FinanceBalanceBreakdown,
  getFinanceBalanceBreakdown,
} from "../services/finance";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const EMPTY_BREAKDOWN: FinanceBalanceBreakdown = {
  totalAllocated: 0,
  totalExpenses: 0,
  remainingBalance: 0,
  utilizationPercent: 0,
  uncategorizedExpenses: 0,
  categories: [],
};

export default function BudgetBalanceScreen() {
  const [data, setData] =
    useState<FinanceBalanceBreakdown>(
      EMPTY_BREAKDOWN
    );
  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadBalance() {
        try {
          setIsLoading(true);

          const result =
            await getFinanceBalanceBreakdown();

          if (active) {
            setData(result);
          }
        } catch (error) {
          console.error(
            "Budget balance loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadBalance();

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

  const progress =
    data.totalAllocated > 0
      ? Math.min(
          Math.max(
            data.totalExpenses /
              data.totalAllocated,
            0
          ),
          1
        )
      : 0;

  const utilizationText =
    data.totalAllocated > 0
      ? `${data.utilizationPercent.toFixed(
          1
        )}% used`
      : data.totalExpenses > 0
        ? "Expenses recorded without allocation"
        : "No budget usage yet";

  return (
    <SafeAreaView style={styles.safeArea}
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Budget Balance"
        showBack
      />
      

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading budget balance...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          <Text style={styles.sectionLabel}>
            Overall Remaining Balance
          </Text>

          <Text
            style={[
              styles.remainingValue,
              data.remainingBalance < 0 &&
                styles.negativeValue,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatCurrency(
              data.remainingBalance
            )}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                Allocated
              </Text>
              <Text
                style={styles.summaryValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatCurrency(
                  data.totalAllocated
                )}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                Expenses
              </Text>
              <Text
                style={styles.summaryValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatCurrency(
                  data.totalExpenses
                )}
              </Text>
            </View>
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Budget Utilization
            </Text>

            <Text
              style={[
                styles.progressText,
                data.remainingBalance < 0 &&
                  styles.negativeValue,
              ]}
            >
              {utilizationText}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                },
                data.remainingBalance < 0 &&
                  styles.progressFillOver,
              ]}
            />
          </View>

          {data.remainingBalance < 0 ? (
            <View style={styles.warningRow}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.danger}
              />

              <Text style={styles.warningText}>
                Expenses are higher than the total
                allocated budget by{" "}
                {formatCurrency(
                  Math.abs(
                    data.remainingBalance
                  )
                )}
                .
              </Text>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Balance by Category
            </Text>

            <Text style={styles.categoryCount}>
              {data.categories.length}
            </Text>
          </View>

          {data.categories.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons
                name="albums-outline"
                size={23}
                color={colors.textMuted}
              />

              <View style={styles.emptyText}>
                <Text style={styles.emptyTitle}>
                  No budget categories
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  Add categories and allocations to
                  start tracking balances.
                </Text>
              </View>
            </View>
          ) : (
            data.categories.map(
              (category, index) => {
                const categoryUsage =
                  category.allocated > 0
                    ? Math.min(
                        Math.max(
                          category.expenses /
                            category.allocated,
                          0
                        ),
                        1
                      )
                    : 0;

                return (
                  <View
                    key={category.categoryId}
                    style={[
                      styles.categoryRow,
                      index <
                        data.categories.length -
                          1 &&
                        styles.rowDivider,
                    ]}
                  >
                    <View
                      style={
                        styles.categoryTopRow
                      }
                    >
                      <View
                        style={
                          styles.categoryTitleArea
                        }
                      >
                        <Text
                          style={
                            styles.categoryName
                          }
                          numberOfLines={2}
                        >
                          {category.categoryName}
                        </Text>

                        <Text
                          style={
                            styles.categoryMeta
                          }
                        >
                          {formatCurrency(
                            category.expenses
                          )}{" "}
                          spent of{" "}
                          {formatCurrency(
                            category.allocated
                          )}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.categoryRemaining,
                          category.remaining < 0 &&
                            styles.negativeValue,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {formatCurrency(
                          category.remaining
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.categoryProgressTrack
                      }
                    >
                      <View
                        style={[
                          styles.categoryProgressFill,
                          {
                            width: `${
                              categoryUsage * 100
                            }%`,
                          },
                          category.remaining < 0 &&
                            styles.progressFillOver,
                        ]}
                      />
                    </View>
                  </View>
                );
              }
            )
          )}

          {data.uncategorizedExpenses > 0 ? (
            <View
              style={
                styles.uncategorizedRow
              }
            >
              <View style={styles.uncatLeft}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={colors.warning}
                />

                <View style={styles.uncatText}>
                  <Text
                    style={
                      styles.uncategorizedTitle
                    }
                  >
                    Uncategorized Expenses
                  </Text>

                  <Text
                    style={
                      styles.uncategorizedMeta
                    }
                  >
                    Older or migrated expenses without
                    a Finance category.
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.uncategorizedAmount
                }
              >
                {formatCurrency(
                  data.uncategorizedExpenses
                )}
              </Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.infoText}>
              Remaining balance is calculated
              automatically as total allocated budget
              minus total recorded expenses.
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
    alignItems: "center",
    justifyContent: "center",
  },



  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  scrollView: {
    backgroundColor: "#E3F2FD",
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  sectionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  remainingValue: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.display,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.success,
  },

  negativeValue: {
    color: colors.danger,
  },

  summaryRow: {
    flexDirection: "row",
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  summaryItem: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  summaryValue: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  verticalDivider: {
    width: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.border,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },

  progressLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  progressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  progressTrack: {
    height: 9,
    marginTop: spacing.sm,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: colors.border,
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  progressFillOver: {
    backgroundColor: colors.danger,
  },

  warningRow: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "rgba(220,38,38,0.06)",
  },

  warningText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.danger,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xxxl,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  categoryCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },

  categoryRow: {
    paddingVertical: spacing.lg,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  categoryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  categoryTitleArea: {
    flex: 1,
    marginRight: spacing.md,
  },

  categoryName: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  categoryMeta: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  categoryRemaining: {
    maxWidth: "42%",
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.success,
    textAlign: "right",
  },

  categoryProgressTrack: {
    height: 6,
    marginTop: spacing.md,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: colors.border,
  },

  categoryProgressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  emptyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  emptyText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  emptyDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  uncategorizedRow: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  uncatLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  uncatText: {
    flex: 1,
    marginLeft: spacing.sm,
  },

  uncategorizedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  uncategorizedMeta: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  uncategorizedAmount: {
    marginTop: spacing.sm,
    marginLeft: 28,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.warning,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xxxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
