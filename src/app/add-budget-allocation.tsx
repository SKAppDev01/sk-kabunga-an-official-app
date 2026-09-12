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
  createBudgetAllocation,
} from "../services/budget-allocations";
import {
  BudgetCategory,
  getBudgetCategories,
} from "../services/budget-categories";
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

type AllocationErrors = {
  title?: string;
  amount?: string;
  category?: string;
  fiscalYear?: string;
  form?: string;
};

export default function AddBudgetAllocationScreen() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [fiscalYear, setFiscalYear] =
    useState(String(new Date().getFullYear()));
  const [notes, setNotes] = useState("");
  const [isYouthVisible, setIsYouthVisible] =
    useState(false);

  const [categories, setCategories] =
    useState<BudgetCategory[]>([]);
  const [projects, setProjects] =
    useState<LocalProject[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState("");
  const [selectedProjectId, setSelectedProjectId] =
    useState("");

  const [categoryOpen, setCategoryOpen] =
    useState(false);
  const [projectOpen, setProjectOpen] =
    useState(false);

  const [isLoadingOptions, setIsLoadingOptions] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [errors, setErrors] =
    useState<AllocationErrors>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadOptions() {
        try {
          setIsLoadingOptions(true);

          const [categoryList, projectList] =
            await Promise.all([
              getBudgetCategories(),
              getAllLocalProjects(),
            ]);

          if (!active) return;

          setCategories(categoryList);
          setProjects(projectList);

          if (
            categoryList.length > 0 &&
            !selectedCategoryId
          ) {
            setSelectedCategoryId(
              categoryList[0].id
            );
          }
        } catch (error) {
          console.error(
            "Budget allocation options error:",
            error
          );

          if (active) {
            setErrors({
              form:
                "Unable to load budget categories and projects.",
            });
          }
        } finally {
          if (active) {
            setIsLoadingOptions(false);
          }
        }
      }

      loadOptions();

      return () => {
        active = false;
      };
    }, [selectedCategoryId])
  );

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === selectedCategoryId
    ) || null;

  const selectedProject =
    projects.find(
      (project) =>
        project.id === selectedProjectId
    ) || null;

  function clearError(
    field: keyof AllocationErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleSave() {
    const cleanTitle = title.trim();
    const cleanAmount = amount.trim();
    const cleanFiscalYear =
      fiscalYear.trim();

    const nextErrors: AllocationErrors = {};

    if (!cleanTitle) {
      nextErrors.title =
        "Please enter an allocation title.";
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

    if (!selectedCategoryId) {
      nextErrors.category =
        "Please select a budget category.";
    }

    const parsedFiscalYear =
      Number(cleanFiscalYear);

    if (
      !cleanFiscalYear ||
      !Number.isInteger(parsedFiscalYear) ||
      parsedFiscalYear < 2000 ||
      parsedFiscalYear > 2100
    ) {
      nextErrors.fiscalYear =
        "Enter a valid 4-digit fiscal year.";
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

      await createBudgetAllocation({
        categoryId: selectedCategoryId,
        projectId:
          selectedProjectId || null,
        title: cleanTitle,
        amount: parsedAmount,
        fiscalYear: parsedFiscalYear,
        notes,
        isYouthVisible,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Create budget allocation error:",
        error
      );

      setErrors({
        form:
          "Unable to save the budget allocation. Please try again.",
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
            Add Budget Allocation
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
            Allocate SK Budget
          </Text>

          <Text style={styles.introText}>
            Assign an amount to a budget category.
            You can optionally link the allocation
            to a project.
          </Text>

          {categories.length === 0 &&
          !isLoadingOptions ? (
            <View style={styles.warningCard}>
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color={colors.warning}
              />

              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>
                  Budget category required
                </Text>

                <Text style={styles.warningBody}>
                  Create at least one Budget Category
                  before adding an allocation.
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/add-budget-category"
                    )
                  }
                >
                  <Text style={styles.warningLink}>
                    Create Budget Category
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Allocation Title
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
              placeholder="Example: Annual Sports Program"
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
                isLoadingOptions ||
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
                color={colors.textSecondary}
              />
            </Pressable>

            {categoryOpen && (
              <View style={styles.dropdownMenu}>
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
                            color={colors.primary}
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
              disabled={
                isSaving || isLoadingOptions
              }
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
                color={colors.textSecondary}
              />
            </Pressable>

            {projectOpen && (
              <View style={styles.dropdownMenu}>
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

                {projects.map((project) => {
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
                          color={colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={styles.fieldHint}>
              Optional. Linking lets Finance and
              Projects reference the same budget.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Fiscal Year
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.fiscalYear &&
                  styles.inputError,
              ]}
              value={fiscalYear}
              onChangeText={(text) => {
                setFiscalYear(text);
                if (errors.fiscalYear) {
                  clearError("fiscalYear");
                }
              }}
              placeholder="2026"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="number-pad"
              maxLength={4}
              editable={!isSaving}
            />

            {errors.fiscalYear && (
              <Text style={styles.errorText}>
                {errors.fiscalYear}
              </Text>
            )}
          </View>

          <View style={styles.visibilitySetting}>
            <View style={styles.visibilityTextArea}>
              <Text style={styles.visibilityTitle}>
                Visible to SK Youth Members
              </Text>

              <Text style={styles.visibilityDescription}>
                Include this allocation in the read-only Finance view for youth members.
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
              (isSaving ||
                categories.length === 0) &&
                styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={
              isSaving ||
              categories.length === 0
            }
          >
            <Text style={styles.saveButtonText}>
              {isSaving
                ? "Saving Allocation..."
                : "Save Allocation"}
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

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: "rgba(217,119,6,0.08)",
  },

  warningText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  warningTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  warningBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  warningLink: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
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

  fieldHint: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
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
