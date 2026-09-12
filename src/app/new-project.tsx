import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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
  createLocalProject,
} from "../services/projects";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type ProjectErrors = {
  title?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
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

export default function NewProjectScreen() {
  const [title, setTitle] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [budget, setBudget] =
    useState("");
  const [startDate, setStartDate] =
    useState("");
  const [endDate, setEndDate] =
    useState("");
  const [isYouthVisible, setIsYouthVisible] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);
  const [errors, setErrors] =
    useState<ProjectErrors>({});

  function clearError(
    field: keyof ProjectErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleCreateProject() {
    const cleanTitle = title.trim();
    const cleanBudget = budget.trim();
    const cleanStartDate =
      startDate.trim();
    const cleanEndDate =
      endDate.trim();

    const newErrors: ProjectErrors = {};

    if (!cleanTitle) {
      newErrors.title =
        "Please enter a project title.";
    }

    let parsedBudget = 0;

    if (cleanBudget) {
      parsedBudget = Number(
        cleanBudget.replace(/,/g, "")
      );

      if (
        !Number.isFinite(parsedBudget) ||
        parsedBudget < 0
      ) {
        newErrors.budget =
          "Please enter a valid budget amount.";
      }
    }

    if (
      cleanStartDate &&
      !isValidDateText(cleanStartDate)
    ) {
      newErrors.startDate =
        "Use a valid date in YYYY-MM-DD format.";
    }

    if (
      cleanEndDate &&
      !isValidDateText(cleanEndDate)
    ) {
      newErrors.endDate =
        "Use a valid date in YYYY-MM-DD format.";
    }

    if (
      !newErrors.startDate &&
      !newErrors.endDate &&
      cleanStartDate &&
      cleanEndDate &&
      cleanEndDate < cleanStartDate
    ) {
      newErrors.endDate =
        "End date cannot be before start date.";
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

      await createLocalProject({
        title: cleanTitle,
        description,
        budget: parsedBudget,
        startDate: cleanStartDate,
        endDate: cleanEndDate,
        isYouthVisible,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Create project error:",
        error
      );

      setErrors({
        form:
          "Unable to create the project. Please try again.",
      });
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
            New Project
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
            Create an SK Project
          </Text>

          <Text style={styles.introText}>
            Add the project's basic information,
            schedule, and planned budget.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Project Title
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
              placeholder="Enter project title"
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
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the project"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          <View style={styles.visibilitySetting}>
            <View style={styles.visibilityTextArea}>
              <Text style={styles.visibilityTitle}>
                Visible to SK Youth Members
              </Text>

              <Text style={styles.visibilityDescription}>
                Allow youth member accounts to view this project.
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
              Planned Budget
            </Text>

            <View
              style={[
                styles.budgetContainer,
                errors.budget &&
                  styles.inputError,
              ]}
            >
              <Text style={styles.peso}>
                ₱
              </Text>

              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={(text) => {
                  setBudget(text);

                  if (errors.budget) {
                    clearError("budget");
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

            {errors.budget && (
              <Text style={styles.errorText}>
                {errors.budget}
              </Text>
            )}
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>
                Start Date
              </Text>

              <View
                style={[
                  styles.dateInputContainer,
                  errors.startDate &&
                    styles.inputError,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={(text) => {
                    setStartDate(text);

                    if (errors.startDate) {
                      clearError("startDate");
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  editable={!isSaving}
                />
              </View>

              {errors.startDate && (
                <Text style={styles.errorText}>
                  {errors.startDate}
                </Text>
              )}
            </View>

            <View style={styles.dateSpacer} />

            <View style={styles.dateField}>
              <Text style={styles.label}>
                End Date
              </Text>

              <View
                style={[
                  styles.dateInputContainer,
                  errors.endDate &&
                    styles.inputError,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={(text) => {
                    setEndDate(text);

                    if (errors.endDate) {
                      clearError("endDate");
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  editable={!isSaving}
                />
              </View>

              {errors.endDate && (
                <Text style={styles.errorText}>
                  {errors.endDate}
                </Text>
              )}
            </View>
          </View>

          <Text style={styles.dateHint}>
            Dates are optional. Use YYYY-MM-DD.
          </Text>

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
              styles.createButton,
              pressed &&
                !isSaving &&
                styles.buttonPressed,
              isSaving &&
                styles.buttonDisabled,
            ]}
            onPress={handleCreateProject}
            disabled={isSaving}
          >
            <Text
              style={
                styles.createButtonText
              }
            >
              {isSaving
                ? "Creating Project..."
                : "Create Project"}
            </Text>
          </Pressable>
        </ScrollView>
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

  scrollView: {
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
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },

  descriptionInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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

  budgetContainer: {
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

  budgetInput: {
    flex: 1,
    height: "100%",
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  dateField: {
    flex: 1,
  },

  dateSpacer: {
    width: spacing.md,
  },

  dateInputContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },

  dateInput: {
    flex: 1,
    height: "100%",
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  dateHint: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.xs,
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

  createButton: {
    height: 54,
    marginTop: spacing.sm,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  createButtonText: {
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
