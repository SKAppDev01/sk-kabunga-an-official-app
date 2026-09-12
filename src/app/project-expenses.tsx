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
  getProjectExpenses,
  ProjectExpense,
} from "../services/project-expenses";
import {
  getLocalProjectById,
  LocalProject,
} from "../services/projects";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ProjectExpensesScreen() {
  const params =
    useLocalSearchParams<{
      projectId?: string | string[];
    }>();

  const projectId = Array.isArray(
    params.projectId
  )
    ? params.projectId[0]
    : params.projectId;

  const [project, setProject] =
    useState<LocalProject | null>(null);
  const [expenses, setExpenses] =
    useState<ProjectExpense[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        if (!projectId) {
          if (active) {
            setProject(null);
            setExpenses([]);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);

          const [projectResult, expenseResult] =
            await Promise.all([
              getLocalProjectById(projectId),
              getProjectExpenses(projectId),
            ]);

          if (!active) return;

          setProject(projectResult);
          setExpenses(expenseResult);
        } catch (error) {
          console.error(
            "Project expenses loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadData();

      return () => {
        active = false;
      };
    }, [projectId])
  );

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + expense.amount,
    0
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

  function formatDate(
    value: string | null
  ) {
    if (!value) return "No date";

    const date = new Date(
      `${value}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

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
          Project Expenses
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading expenses...
          </Text>
        </View>
      ) : !project ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>
            Project not found
          </Text>
        </View>
      ) : (
        <View style={styles.screen}>
          <View style={styles.summaryCard}>
            <Text style={styles.projectName}>
              {project.title}
            </Text>

            <Text style={styles.summaryLabel}>
              Total Project Expenses
            </Text>

            <Text style={styles.summaryValue}>
              {formatCurrency(totalExpenses)}
            </Text>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>
                Planned Budget
              </Text>

              <Text style={styles.balanceValue}>
                {formatCurrency(project.budget)}
              </Text>
            </View>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.centerState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={38}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No project expenses yet
              </Text>

              <Text style={styles.stateText}>
                Tap the + button to record the
                first expense for this project.
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
                {expenses.length}{" "}
                {expenses.length === 1
                  ? "expense"
                  : "expenses"}
              </Text>

              {expenses.map((expense) => (
                <View
                  key={expense.id}
                  style={styles.expenseCard}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.iconBox}>
                      <Ionicons
                        name="receipt-outline"
                        size={21}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.cardText}>
                      <Text
                        style={styles.expenseTitle}
                        numberOfLines={2}
                      >
                        {expense.title}
                      </Text>

                      <Text
                        style={styles.expenseDate}
                      >
                        {formatDate(
                          expense.expenseDate
                        )}
                      </Text>
                    </View>

                    <Text style={styles.amountText}>
                      {formatCurrency(
                        expense.amount
                      )}
                    </Text>
                  </View>

                  {expense.notes ? (
                    <Text
                      style={styles.notesText}
                      numberOfLines={3}
                    >
                      {expense.notes}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.floatingAddButton,
              pressed &&
                styles.floatingAddButtonPressed,
            ]}
            onPress={() =>
              router.push({
                pathname:
                  "/add-project-expense",
                params: {
                  projectId: project.id,
                },
              })
            }
          >
            <Ionicons
              name="add"
              size={31}
              color={colors.white}
            />
          </Pressable>
        </View>
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

  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  projectName: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  summaryLabel: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  summaryValue: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  balanceValue: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
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

  expenseCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  cardText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },

  expenseTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  expenseDate: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  amountText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  notesText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  floatingAddButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.md,
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
});
