import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useState } from "react";
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
  createProjectExpense,
} from "../services/project-expenses";
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

export default function AddProjectExpenseScreen() {
  const params =
    useLocalSearchParams<{
      projectId?: string | string[];
    }>();

  const projectId = Array.isArray(
    params.projectId
  )
    ? params.projectId[0]
    : params.projectId;

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
  const [isSaving, setIsSaving] =
    useState(false);
  const [errors, setErrors] =
    useState<ExpenseErrors>({});

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
    if (!projectId) {
      setErrors({
        form: "Project information is missing.",
      });
      return;
    }

    const cleanTitle = title.trim();
    const cleanAmount = amount.trim();
    const cleanDate = expenseDate.trim();

    const newErrors: ExpenseErrors = {};

    if (!cleanTitle) {
      newErrors.title =
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
      newErrors.amount =
        "Please enter a valid amount greater than 0.";
    }

    if (
      cleanDate &&
      !isValidDateText(cleanDate)
    ) {
      newErrors.expenseDate =
        "Use a valid date in YYYY-MM-DD format.";
    }

    if (
      Object.keys(newErrors).length > 0
    ) {
      setErrors(newErrors);
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

      await createProjectExpense({
        projectId,
        title: cleanTitle,
        amount: parsedAmount,
        expenseDate: cleanDate,
        notes,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Add project expense error:",
        error
      );

      setErrors({
        form:
          "Unable to save the expense. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
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
            Add Project Expense
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
            Record an Expense
          </Text>

          <Text style={styles.introText}>
            Add an expense directly to this SK
            project.
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
              placeholder="Example: Basketball uniforms"
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
                    styles.datePlaceholder,
                ]}
                numberOfLines={1}
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
                style={styles.formErrorText}
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
            <Text style={styles.saveButtonText}>
              {isSaving
                ? "Saving Expense..."
                : "Save Expense"}
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
  flex: {
    flex: 1,
  },

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

  headerSpacer: {
    width: 44,
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
    elevation: 2,
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },

  notesInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  amountContainer: {
    elevation: 2,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
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
    elevation: 2,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },

  dateInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  datePlaceholder: {
    color: colors.textMuted,
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
