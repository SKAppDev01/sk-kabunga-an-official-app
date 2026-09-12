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
  FinanceExpense,
  getAllFinanceExpenses,
} from "../services/finance-expenses";
import {
  getCurrentSessionUser,
} from "../services/session";
import { isYouthMemberRole } from "../services/access";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ExpensesScreen() {
  const [expenses, setExpenses] =
    useState<FinanceExpense[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isYouthMember, setIsYouthMember] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadExpenses() {
        try {
          setIsLoading(true);

          const user =
            await getCurrentSessionUser();

          if (!user) {
            router.replace("/login");
            return;
          }

          const result =
            await getAllFinanceExpenses();

          if (active) {
            setIsYouthMember(
              isYouthMemberRole(user.role)
            );
            setExpenses(result);
          }
        } catch (error) {
          console.error(
            "Expenses list error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadExpenses();

      return () => {
        active = false;
      };
    }, [])
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
    value: string | null,
    fallback: string
  ) {
    const raw = value || fallback;

    if (!raw) {
      return "No date";
    }

    const normalized =
      raw.includes("T")
        ? raw
        : raw.includes(" ")
          ? `${raw.replace(" ", "T")}Z`
          : `${raw}T00:00:00`;

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return raw;
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
          Expenses
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.screen}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="receipt-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>
              Total Recorded Expenses
            </Text>

            <Text style={styles.summaryValue}>
              {isLoading
                ? "—"
                : formatCurrency(
                    totalExpenses
                  )}
            </Text>

            <Text style={styles.summaryMeta}>
              {expenses.length}{" "}
              {expenses.length === 1
                ? "record"
                : "records"}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading expenses...
            </Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No expense records
            </Text>

            <Text style={styles.stateText}>
              {isYouthMember
                ? "No expense records are currently available to youth members."
                : "Official SK expenses will appear here."}
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
            {expenses.map((expense) => (
              <Pressable
                key={expense.id}
                style={({ pressed }) => [
                  styles.expenseCard,
                  pressed &&
                    styles.expenseCardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/expense-details",
                    params: {
                      id: expense.id,
                    },
                  })
                }
              >
                <View style={styles.cardTop}>
                  <View style={styles.expenseIcon}>
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

                    <Text style={styles.expenseDate}>
                      {formatDate(
                        expense.expenseDate,
                        expense.createdAt
                      )}
                    </Text>
                  </View>

                  <Text style={styles.amountText}>
                    {formatCurrency(
                      expense.amount
                    )}
                  </Text>
                </View>

                <View style={styles.tagsRow}>
                  <View style={styles.tag}>
                    <Ionicons
                      name="albums-outline"
                      size={14}
                      color={colors.textMuted}
                    />

                    <Text
                      style={styles.tagText}
                      numberOfLines={1}
                    >
                      {expense.categoryName ||
                        "Uncategorized"}
                    </Text>
                  </View>

                  {expense.projectTitle ? (
                    <View style={styles.tag}>
                      <Ionicons
                        name="folder-outline"
                        size={14}
                        color={colors.textMuted}
                      />

                      <Text
                        style={styles.tagText}
                        numberOfLines={1}
                      >
                        {expense.projectTitle}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {canManage && expense.isYouthVisible ? (
                  <View style={styles.visibilityRow}>
                    <Ionicons
                      name="eye-outline"
                      size={15}
                      color={colors.success}
                    />
                    <Text style={styles.visibilityText}>
                      Visible to youth members
                    </Text>
                  </View>
                ) : null}

                {expense.notes ? (
                  <Text
                    style={styles.notes}
                    numberOfLines={3}
                  >
                    {expense.notes}
                  </Text>
                ) : null}

                {expense.receiptUri ? (
                  <View style={styles.receiptRow}>
                    <Ionicons
                      name="image-outline"
                      size={15}
                      color={colors.success}
                    />

                    <Text style={styles.receiptText}>
                      Receipt attached
                    </Text>
                  </View>
                ) : null}
              </Pressable>
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
            router.push("/add-expense")
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

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  summaryText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  summaryValue: {
    marginTop: 3,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  summaryMeta: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
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

  expenseCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  expenseCardPressed: {
    opacity: 0.78,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  expenseIcon: {
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

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  tag: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },

  tagText: {
    flexShrink: 1,
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },

  visibilityText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },

  notes: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },

  receiptText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
});
