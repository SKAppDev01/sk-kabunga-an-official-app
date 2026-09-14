import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActivityExpenseRecord,
  addActivityExpense,
  getActivityById,
  getActivityExpenses,
} from "../services/activities";
import {
  BudgetCategory,
  getBudgetCategories,
} from "../services/budget-categories";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatMoney(
  value: number
) {
  return `₱${value.toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = parseDate(value);

  if (!date) {
    return "Select date";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ActivityExpensesScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const activityId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [records, setRecords] =
    useState<ActivityExpenseRecord[]>(
      []
    );

  const [categories, setCategories] =
    useState<BudgetCategory[]>([]);

  const [activityDate, setActivityDate] =
    useState("");

  const [showAdd, setShowAdd] =
    useState(false);

  const [categoryOpen, setCategoryOpen] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [expenseDate, setExpenseDate] =
    useState("");
  const [showExpenseDatePicker, setShowExpenseDatePicker] =
    useState(false);

  const [notes, setNotes] =
    useState("");

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadData =
    useCallback(async () => {
      if (!activityId) {
        setError(
          "Activity not found."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [
          expenseRows,
          categoryRows,
          activity,
        ] = await Promise.all([
          getActivityExpenses(
            activityId
          ),
          getBudgetCategories(),
          getActivityById(
            activityId
          ),
        ]);

        setRecords(expenseRows);
        setCategories(categoryRows);

        if (activity) {
          setActivityDate(
            activity.activityDate
          );

          setExpenseDate(
            (current) =>
              current ||
              activity.activityDate
          );
        }

        setSelectedCategoryId(
          (current) =>
            current ||
            categoryRows[0]?.id ||
            ""
        );
      } catch (loadError) {
        console.error(
          "Activity expenses loading error:",
          loadError
        );

        setError(
          "Unable to load event expenses."
        );
      } finally {
        setIsLoading(false);
      }
    }, [activityId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const selectedCategory =
    categories.find(
      (category) =>
        category.id ===
        selectedCategoryId
    ) || null;

  const totalExpenses =
    records.reduce(
      (total, record) =>
        total + record.amount,
      0
    );

  function handleExpenseDateChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowExpenseDatePicker(false);

    if (
      event.type === "dismissed" ||
      !selectedDate
    ) {
      return;
    }

    setExpenseDate(toIsoDate(selectedDate));
    setError("");
  }

  async function handleAdd() {
    if (!activityId) {
      return;
    }

    const cleanTitle =
      title.trim();

    const parsedAmount = Number(
      amount.replace(/,/g, "")
    );

    if (!cleanTitle) {
      setError(
        "Please enter an expense title."
      );
      return;
    }

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setError(
        "Please enter a valid amount greater than 0."
      );
      return;
    }

    if (!selectedCategoryId) {
      setError(
        "Please select a budget category."
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const user =
        await getCurrentSessionUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await addActivityExpense({
        activityId,
        title: cleanTitle,
        amount: parsedAmount,
        expenseDate:
          expenseDate.trim(),
        categoryId:
          selectedCategoryId,
        notes,
        createdBy: user.id,
      });

      setTitle("");
      setAmount("");
      setExpenseDate(
        activityDate
      );
      setNotes("");
      setShowAdd(false);
      setCategoryOpen(false);

      await loadData();
    } catch (saveError) {
      console.error(
        "Add event expense error:",
        saveError
      );

      const message =
        String(saveError);

      if (
        message.includes(
          "INVALID_EXPENSE_DATE"
        )
      ) {
        setError(
          "Use a valid date in YYYY-MM-DD format."
        );
      } else {
        setError(
          "Unable to add the event expense."
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
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

          <Text
            style={styles.headerTitle}
          >
            Event Expenses
          </Text>

          <Pressable
            style={styles.headerAction}
            onPress={() =>
              setShowAdd(
                (current) => !current
              )
            }
          >
            <Ionicons
              name={
                showAdd
                  ? "close"
                  : "add"
              }
              size={25}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.summary}>
          <Text
            style={styles.summaryLabel}
          >
            Total Event Expenses
          </Text>

          <Text
            style={styles.summaryAmount}
          >
            {formatMoney(
              totalExpenses
            )}
          </Text>
        </View>

        {showAdd ? (
          <ScrollView
            style={styles.addPanelScroll}
            contentContainerStyle={
              styles.addPanel
            }
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError("");
              }}
              placeholder="Expense title"
              placeholderTextColor={
                colors.textMuted
              }
            />

            <TextInput
              style={[
                styles.input,
                styles.spacedInput,
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="decimal-pad"
            />

            <Pressable
              style={[
                styles.dateButton,
                styles.spacedInput,
              ]}
              onPress={() => {
                setCategoryOpen(false);
                setShowExpenseDatePicker(true);
              }}
              disabled={isSaving}
            >
              <Ionicons
                name="calendar-outline"
                size={19}
                color={colors.textMuted}
              />

              <Text
                style={[
                  styles.dateButtonText,
                  !expenseDate &&
                    styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {formatDate(expenseDate)}
              </Text>

              <Ionicons
                name="chevron-down-outline"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>

            <Pressable
              style={[
                styles.selector,
                styles.spacedInput,
              ]}
              onPress={() =>
                setCategoryOpen(
                  (current) =>
                    !current
                )
              }
            >
              <Text
                style={[
                  styles.selectorText,
                  !selectedCategory &&
                    styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedCategory
                  ? selectedCategory.name
                  : "Select budget category"}
              </Text>

              <Ionicons
                name={
                  categoryOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={19}
                color={colors.textMuted}
              />
            </Pressable>

            {categoryOpen ? (
              <View
                style={styles.optionsList}
              >
                {categories.map(
                  (category) => {
                    const selected =
                      category.id ===
                      selectedCategoryId;

                    return (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.optionRow,
                          selected &&
                            styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setSelectedCategoryId(
                            category.id
                          );
                          setCategoryOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected &&
                              styles.optionTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {category.name}
                        </Text>

                        <View
                          style={
                            styles.checkSlot
                          }
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={19}
                              color={colors.primary}
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>
            ) : null}

            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
            />

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                (pressed ||
                  isSaving) &&
                  styles.buttonPressed,
              ]}
              onPress={handleAdd}
              disabled={isSaving}
            >
              <Text
                style={
                  styles.addButtonText
                }
              >
                {isSaving
                  ? "Saving..."
                  : "Add Expense"}
              </Text>
            </Pressable>
          </ScrollView>
        ) : null}

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading event expenses...
            </Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name="wallet-outline"
              size={42}
              color={colors.textMuted}
            />

            <Text
              style={styles.emptyTitle}
            >
              No event expenses yet
            </Text>

            <Text
              style={styles.stateText}
            >
              Tap + to record an expense.
              It will also appear in Finance.
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
            {records.map(
              (record, index) => (
                <View
                  key={record.id}
                  style={[
                    styles.expenseRow,
                    index <
                      records.length - 1 &&
                      styles.rowDivider,
                  ]}
                >
                  <View
                    style={styles.expenseText}
                  >
                    <Text
                      style={
                        styles.expenseTitle
                      }
                      numberOfLines={1}
                    >
                      {record.title}
                    </Text>

                    <Text
                      style={
                        styles.expenseMeta
                      }
                      numberOfLines={1}
                    >
                      {record.categoryName ||
                        "Uncategorized"}
                      {record.expenseDate
                        ? ` • ${record.expenseDate}`
                        : ""}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.expenseAmount
                    }
                  >
                    {formatMoney(
                      record.amount
                    )}
                  </Text>
                </View>
              )
            )}
          </ScrollView>
        )}

        {showExpenseDatePicker && (
          <DateTimePicker
            value={
              parseDate(expenseDate) ??
              parseDate(activityDate) ??
              new Date()
            }
            mode="date"
            display="default"
            onChange={handleExpenseDateChange}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },
  flex: {
    flex: 1,
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
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  summary: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  summaryAmount: {
    marginTop: 3,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  addPanelScroll: {
    maxHeight: 455,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addPanel: {
    padding: spacing.lg,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  dateButton: {
    elevation: 2,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  dateButtonText: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  spacedInput: {
    marginTop: spacing.sm,
  },
  selector: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  selectorText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  optionsList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  optionRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRowSelected: {
    backgroundColor: "#EFF6FF",
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  checkSlot: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notesInput: {
    minHeight: 78,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  addButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  errorText: {
    margin: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    textAlign: "center",
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
  },
  stateText: {
    marginTop: spacing.sm,
    maxWidth: 290,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  expenseRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  expenseText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
  },
  expenseTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  expenseMeta: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  expenseAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
});
