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

import { AppHeader } from "../components/AppHeader";

import {
  getLocalProjectById,
  ProjectStatus,
  updateLocalProject,
} from "../services/projects";
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

const STATUS_OPTIONS: ProjectStatus[] = [
  "Planned",
  "Ongoing",
  "Completed",
  "Cancelled",
];

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

function parseProjectDate(value: string) {
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

function formatProjectDate(value: string) {
  const date = parseProjectDate(value);

  if (!date) {
    return "Select date";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EditProjectScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const projectId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

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
  const [showStartDatePicker, setShowStartDatePicker] =
    useState(false);
  const [showEndDatePicker, setShowEndDatePicker] =
    useState(false);
  const [status, setStatus] =
    useState<ProjectStatus>("Planned");
  const [isYouthVisible, setIsYouthVisible] =
    useState(false);
  const [isStatusOpen, setIsStatusOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [notFound, setNotFound] =
    useState(false);
  const [errors, setErrors] =
    useState<ProjectErrors>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProject() {
        if (!projectId) {
          if (active) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setNotFound(false);

          const project =
            await getLocalProjectById(
              projectId
            );

          if (!active) return;

          if (!project) {
            setNotFound(true);
            return;
          }

          setTitle(project.title);
          setDescription(
            project.description || ""
          );
          setBudget(String(project.budget));
          setStartDate(
            project.startDate || ""
          );
          setEndDate(
            project.endDate || ""
          );
          setStatus(project.status);
          setIsYouthVisible(project.isYouthVisible);
        } catch (error) {
          console.error(
            "Edit project loading error:",
            error
          );

          if (active) {
            setNotFound(true);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadProject();

      return () => {
        active = false;
      };
    }, [projectId])
  );

  function clearError(
    field: keyof ProjectErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  function openStartDatePicker() {
    setIsStatusOpen(false);
    setShowEndDatePicker(false);
    setShowStartDatePicker(true);
  }

  function openEndDatePicker() {
    setIsStatusOpen(false);
    setShowStartDatePicker(false);
    setShowEndDatePicker(true);
  }

  function handleStartDateChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowStartDatePicker(false);

    if (
      event.type === "dismissed" ||
      !selectedDate
    ) {
      return;
    }

    setStartDate(toIsoDate(selectedDate));
    clearError("startDate");
  }

  function handleEndDateChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowEndDatePicker(false);

    if (
      event.type === "dismissed" ||
      !selectedDate
    ) {
      return;
    }

    setEndDate(toIsoDate(selectedDate));
    clearError("endDate");
  }

  async function handleSave() {
    if (!projectId) return;

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

      await updateLocalProject({
        projectId,
        title: cleanTitle,
        description,
        budget: parsedBudget,
        status,
        startDate: cleanStartDate,
        endDate: cleanEndDate,
        isYouthVisible,
      });

      router.back();
    } catch (error) {
      console.error(
        "Update project error:",
        error
      );

      setErrors({
        form:
          "Unable to save the project. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Edit Project"
        showBack
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading project...
            </Text>
          </View>
        ) : notFound ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>
              Project not found
            </Text>

            <Text style={styles.stateText}>
              This project may no longer exist.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.returnButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() => router.back()}
            >
              <Text
                style={
                  styles.returnButtonText
                }
              >
                Go Back
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={
              styles.content
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
            nestedScrollEnabled
          >

            <Text style={styles.introTitle}>
              Project Information
            </Text>

            <Text style={styles.introText}>
              Update project details,
              schedule, budget, and status.
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

                <Pressable
                  style={[
                    styles.dateInputContainer,
                    errors.startDate &&
                      styles.inputError,
                  ]}
                  onPress={openStartDatePicker}
                  disabled={isSaving}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={colors.textMuted}
                  />

                  <Text
                    style={[
                      styles.dateInput,
                      !startDate &&
                        styles.datePlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {formatProjectDate(startDate)}
                  </Text>
                </Pressable>

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

                <Pressable
                  style={[
                    styles.dateInputContainer,
                    errors.endDate &&
                      styles.inputError,
                  ]}
                  onPress={openEndDatePicker}
                  disabled={isSaving}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={colors.textMuted}
                  />

                  <Text
                    style={[
                      styles.dateInput,
                      !endDate &&
                        styles.datePlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {formatProjectDate(endDate)}
                  </Text>
                </Pressable>

                {errors.endDate && (
                  <Text style={styles.errorText}>
                    {errors.endDate}
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.dateHint}>
              Dates are optional. Tap a field to choose a date.
            </Text>

            <View
              style={[
                styles.fieldGroup,
                styles.statusFieldGroup,
              ]}
            >
              <Text style={styles.label}>
                Project Status
              </Text>

              <View style={styles.statusDropdownWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.statusDropdownButton,
                    isStatusOpen &&
                      styles.statusDropdownButtonOpen,
                    pressed &&
                      !isSaving &&
                      styles.buttonPressed,
                  ]}
                  onPress={() =>
                    setIsStatusOpen(
                      (current) => !current
                    )
                  }
                  disabled={isSaving}
                >
                  <Text style={styles.statusDropdownText}>
                    {status}
                  </Text>

                  <Ionicons
                    name={
                      isStatusOpen
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {isStatusOpen && (
                  <View style={styles.statusDropdownMenu}>
                    {STATUS_OPTIONS.map((option) => {
                      const selected =
                        status === option;

                      return (
                        <Pressable
                          key={option}
                          style={({ pressed }) => [
                            styles.statusDropdownOption,
                            selected &&
                              styles.statusDropdownOptionSelected,
                            pressed &&
                              styles.statusDropdownOptionPressed,
                          ]}
                          onPress={() => {
                            setStatus(option);
                            setIsStatusOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.statusDropdownOptionText,
                              selected &&
                                styles.statusDropdownOptionTextSelected,
                            ]}
                          >
                            {option}
                          </Text>

                          {selected && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={colors.primary}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
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
                style={
                  styles.saveButtonText
                }
              >
                {isSaving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {showStartDatePicker && (
          <DateTimePicker
            value={
              parseProjectDate(startDate) ??
              new Date()
            }
            mode="date"
            display="default"
            onChange={handleStartDateChange}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={
              parseProjectDate(endDate) ??
              parseProjectDate(startDate) ??
              new Date()
            }
            mode="date"
            display="default"
            minimumDate={
              parseProjectDate(startDate) ??
              undefined
            }
            onChange={handleEndDateChange}
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
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    fontSize: typography.fontSize.xl,
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

  returnButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  returnButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  scrollView: {
    backgroundColor: "#E3F2FD", flex: 1 },

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

  dateField: { flex: 1 },

  dateSpacer: { width: spacing.md },

  dateInputContainer: {
    elevation: 2,
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
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  datePlaceholder: {
    color: colors.textMuted,
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

  statusFieldGroup: {
    position: "relative",
  },

  statusDropdownWrapper: {
    position: "relative",
  },

  statusDropdownButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  statusDropdownButtonOpen: {
    borderColor: colors.primary,
  },

  statusDropdownText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    includeFontPadding: false,
  },

  statusDropdownMenu: {
    elevation: 2,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    overflow: "hidden",
  },

  statusDropdownOption: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },

  statusDropdownOptionSelected: {
    backgroundColor: "rgba(37,99,235,0.06)",
  },

  statusDropdownOptionPressed: {
    backgroundColor: colors.surface,
  },

  statusDropdownOptionText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    includeFontPadding: false,
  },

  statusDropdownOptionTextSelected: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
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

  buttonPressed: { opacity: 0.8 },

  buttonDisabled: { opacity: 0.65 },
});
