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
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BudgetCategory,
  getBudgetCategories,
} from "../services/budget-categories";
import {
  getFinanceExpenseById,
  updateFinanceExpense,
} from "../services/finance-expenses";
import {
  getAllLocalProjects,
  LocalProject,
} from "../services/projects";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type ExpenseErrors = {
  title?: string;
  amount?: string;
  expenseDate?: string;
  category?: string;
  form?: string;
};

function isValidDateText(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseExpenseDate(value: string) {
  if (!isValidDateText(value)) {
    return null;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatExpenseDate(value: string) {
  const date = parseExpenseDate(value);

  if (!date) {
    return "Select date";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EditExpenseScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const expenseId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [title, setTitle] =
    useState("");
  const [amount, setAmount] =
    useState("");
  const [expenseDate, setExpenseDate] =
    useState("");
  const [
    showExpenseDatePicker,
    setShowExpenseDatePicker,
  ] = useState(false);
  const [notes, setNotes] =
    useState("");
  const [isYouthVisible, setIsYouthVisible] =
    useState(false);

  const [categories, setCategories] =
    useState<BudgetCategory[]>([]);
  const [projects, setProjects] =
    useState<LocalProject[]>([]);

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState("");
  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState("");

  const [categoryOpen, setCategoryOpen] =
    useState(false);
  const [projectOpen, setProjectOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [notFound, setNotFound] =
    useState(false);
  const [errors, setErrors] =
    useState<ExpenseErrors>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        if (!expenseId) {
          if (active) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setNotFound(false);

          const [
            expense,
            categoryList,
            projectList,
          ] = await Promise.all([
            getFinanceExpenseById(expenseId),
            getBudgetCategories(),
            getAllLocalProjects(),
          ]);

          if (!active) return;

          if (!expense) {
            setNotFound(true);
            return;
          }

          setCategories(categoryList);
          setProjects(projectList);

          setTitle(expense.title);
          setAmount(String(expense.amount));
          setExpenseDate(
            expense.expenseDate || ""
          );
          setSelectedCategoryId(
            expense.categoryId || ""
          );
          setSelectedProjectId(
            expense.projectId || ""
          );
          setNotes(expense.notes || "");
          setIsYouthVisible(expense.isYouthVisible);
        } catch (error) {
          console.error(
            "Edit expense loading error:",
            error
          );

          if (active) {
            setErrors({
              form:
                "Unable to load this expense.",
            });
          }
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
    }, [expenseId])
  );

  const selectedCategory =
    categories.find(
      (category) =>
        category.id ===
        selectedCategoryId
    ) || null;

  const selectedProject =
    projects.find(
      (project) =>
        project.id === selectedProjectId
    ) || null;

  function clearError(
    field: keyof ExpenseErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  function openExpenseDatePicker() {
    setCategoryOpen(false);
    setProjectOpen(false);
    setShowExpenseDatePicker(true);
  }

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
    clearError("expenseDate");
  }

  async function handleSave() {
    if (!expenseId) return;

    const cleanTitle = title.trim();
    const cleanAmount = amount.trim();
    const cleanDate =
      expenseDate.trim();

    const nextErrors: ExpenseErrors = {};

    if (!cleanTitle) {
      nextErrors.title =
        "Please enter an expense title.";
    }

    const parsedAmount = Number(
      cleanAmount.replace(/,/g, "")
    );

    if (
      !cleanAmount ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      nextErrors.amount =
        "Please enter a valid amount greater than 0.";
    }

    if (
      cleanDate &&
      !isValidDateText(cleanDate)
    ) {
      nextErrors.expenseDate =
        "Use a valid date in YYYY-MM-DD format.";
    }

    if (!selectedCategoryId) {
      nextErrors.category =
        "Please select a budget category.";
    }

    if (
      Object.keys(nextErrors).length > 0
    ) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      const user =
        await getCurrentSessionUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await updateFinanceExpense({
        expenseId,
        title: cleanTitle,
        amount: parsedAmount,
        expenseDate: cleanDate,
        categoryId: selectedCategoryId,
        projectId:
          selectedProjectId || null,
        notes,
        isYouthVisible,
        updatedBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Update expense error:",
        error
      );

      setErrors({
        form:
          "Unable to save the expense changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
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
            Edit Expense
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading expense...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
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
            Edit Expense
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>
            Expense not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Edit Expense
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <Text style={styles.introTitle}>
            Update Expense
          </Text>

          <Text style={styles.introText}>
            Edit the official Finance expense record.
            Any linked project will reflect the same
            updated record.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Expense Title
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.title &&
                  styles.inputError,
              ]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);

                if (errors.title) {
                  clearError("title");
                }
              }}
              placeholder="Expense title"
              placeholderTextColor={
                colors.textMuted
              }
              editable={!isSaving}
            />

            {errors.title && (
              <Text style={styles.errorText}>
                {errors.title}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Amount
            </Text>

            <View
              style={[
                styles.amountContainer,
                errors.amount &&
                  styles.inputError,
              ]}
            >
              <Text style={styles.peso}>
                ₱
              </Text>

              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);

                  if (errors.amount) {
                    clearError("amount");
                  }
                }}
                placeholder="0.00"
                placeholderTextColor={
                  colors.textMuted
                }
                keyboardType="decimal-pad"
                editable={!isSaving}
              />
            </View>

            {errors.amount && (
              <Text style={styles.errorText}>
                {errors.amount}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Expense Date
            </Text>

            <Pressable
              style={[
                styles.dateContainer,
                errors.expenseDate &&
                  styles.inputError,
              ]}
              onPress={openExpenseDatePicker}
              disabled={isSaving}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.textMuted}
              />

              <Text
                style={[
                  styles.dateInput,
                  !expenseDate &&
                    styles.placeholderText,
                ]}
              >
                {formatExpenseDate(expenseDate)}
              </Text>

              <Ionicons
                name="chevron-down-outline"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>

            {errors.expenseDate && (
              <Text style={styles.errorText}>
                {errors.expenseDate}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Budget Category
            </Text>

            <Pressable
              style={[
                styles.dropdownButton,
                errors.category &&
                  styles.inputError,
              ]}
              onPress={() => {
                setCategoryOpen(
                  (current) => !current
                );
                setProjectOpen(false);
              }}
              disabled={
                isSaving ||
                categories.length === 0
              }
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedCategory &&
                    styles.placeholderText,
                ]}
              >
                {selectedCategory?.name ||
                  "Select category"}
              </Text>

              <Ionicons
                name={
                  categoryOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={20}
                color={
                  colors.textSecondary
                }
              />
            </Pressable>

            {categoryOpen && (
              <View
                style={styles.dropdownMenu}
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
                          styles.dropdownOption,
                          selected &&
                            styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedCategoryId(
                            category.id
                          );
                          setCategoryOpen(false);
                          clearError("category");
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selected &&
                              styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>

                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={
                              colors.primary
                            }
                          />
                        )}
                      </Pressable>
                    );
                  }
                )}
              </View>
            )}

            {errors.category && (
              <Text style={styles.errorText}>
                {errors.category}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Linked Project
            </Text>

            <Pressable
              style={styles.dropdownButton}
              onPress={() => {
                setProjectOpen(
                  (current) => !current
                );
                setCategoryOpen(false);
              }}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedProject &&
                    styles.placeholderText,
                ]}
              >
                {selectedProject?.title ||
                  "No linked project"}
              </Text>

              <Ionicons
                name={
                  projectOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={20}
                color={
                  colors.textSecondary
                }
              />
            </Pressable>

            {projectOpen && (
              <View
                style={styles.dropdownMenu}
              >
                <Pressable
                  style={[
                    styles.dropdownOption,
                    !selectedProjectId &&
                      styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedProjectId("");
                    setProjectOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      !selectedProjectId &&
                        styles.dropdownOptionTextSelected,
                    ]}
                  >
                    No linked project
                  </Text>

                  {!selectedProjectId && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>

                {projects.map(
                  (project) => {
                    const selected =
                      project.id ===
                      selectedProjectId;

                    return (
                      <Pressable
                        key={project.id}
                        style={[
                          styles.dropdownOption,
                          selected &&
                            styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedProjectId(
                            project.id
                          );
                          setProjectOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selected &&
                              styles.dropdownOptionTextSelected,
                          ]}
                          numberOfLines={2}
                        >
                          {project.title}
                        </Text>

                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={
                              colors.primary
                            }
                          />
                        )}
                      </Pressable>
                    );
                  }
                )}
              </View>
            )}
          </View>

          <View style={styles.visibilitySetting}>
            <View style={styles.visibilityTextArea}>
              <Text style={styles.visibilityTitle}>
                Visible to SK Youth Members
              </Text>

              <Text style={styles.visibilityDescription}>
                Show the expense amount and basic details to youth members. Notes and receipt photos stay private.
              </Text>
            </View>

            <Switch
              value={isYouthVisible}
              onValueChange={setIsYouthVisible}
              disabled={isSaving}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Notes
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.notesInput,
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          {errors.form && (
            <View style={styles.formError}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={colors.danger}
              />

              <Text
                style={
                  styles.formErrorText
                }
              >
                {errors.form}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed &&
                !isSaving &&
                styles.buttonPressed,
              isSaving &&
                styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text
              style={styles.saveButtonText}
            >
              {isSaving
                ? "Saving Changes..."
                : "Save Changes"}
            </Text>
          </Pressable>
        </ScrollView>

        {showExpenseDatePicker && (
          <DateTimePicker
            value={
              parseExpenseDate(expenseDate) ??
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
  flex: { flex: 1 },

  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
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

  headerSpacer: { width: 44 },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
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
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  introText: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  visibilitySetting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  visibilityTextArea: {
    flex: 1,
    marginRight: spacing.lg,
  },

  visibilityTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  visibilityDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  fieldGroup: {
    marginBottom: spacing.lg,
  },

  label: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  amountContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  peso: {
    marginRight: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  amountInput: {
    flex: 1,
    height: "100%",
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  dateContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  dateInput: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  dropdownButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  dropdownText: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  placeholderText: {
    color: colors.textMuted,
  },

  dropdownMenu: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    overflow: "hidden",

    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },

  dropdownOption: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  dropdownOptionSelected: {
    backgroundColor:
      "rgba(37,99,235,0.06)",
  },

  dropdownOptionText: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  dropdownOptionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  notesInput: {
    minHeight: 110,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },

  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
    color: colors.danger,
  },

  formError: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
  },

  formErrorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.danger,
  },

  saveButton: {
    height: 54,
    marginTop: spacing.sm,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.65,
  },
});
