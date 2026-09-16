import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  Image,
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
  BudgetCategory,
  getBudgetCategories,
} from "../services/budget-categories";
import {
  createFinanceExpense,
  updateFinanceExpenseReceipt,
} from "../services/finance-expenses";
import {
  deleteReceiptPhoto,
  saveReceiptPhoto,
} from "../services/receipt-storage";
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

type ReceiptDraft = {
  uri: string;
  fileName?: string | null;
};

function getTodayLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

export default function AddExpenseScreen() {
  const [title, setTitle] =
    useState("");
  const [amount, setAmount] =
    useState("");
  const [expenseDate, setExpenseDate] =
    useState(getTodayLocalDate());
  const [
    showExpenseDatePicker,
    setShowExpenseDatePicker,
  ] = useState(false);
  const [notes, setNotes] =
    useState("");
  const [isYouthVisible, setIsYouthVisible] =
    useState(false);
  const [receiptDraft, setReceiptDraft] =
    useState<ReceiptDraft | null>(null);

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

  const [
    isLoadingOptions,
    setIsLoadingOptions,
  ] = useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [errors, setErrors] =
    useState<ExpenseErrors>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadOptions() {
        try {
          setIsLoadingOptions(true);

          const [
            categoryList,
            projectList,
          ] = await Promise.all([
            getBudgetCategories(),
            getAllLocalProjects(),
          ]);

          if (!active) return;

          setCategories(categoryList);
          setProjects(projectList);

          setSelectedCategoryId(
            (current) =>
              current ||
              categoryList[0]?.id ||
              ""
          );
        } catch (error) {
          console.error(
            "Expense options loading error:",
            error
          );

          if (active) {
            setErrors({
              form:
                "Unable to load categories and projects.",
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
    }, [])
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

  async function chooseReceiptPhoto() {
    if (isSaving) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo Permission Required",
          "Allow photo access to choose a receipt image."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.85,
          }
        );

      if (result.canceled) {
        return;
      }

      const asset =
        result.assets[0];

      if (!asset?.uri) {
        throw new Error(
          "IMAGE_URI_MISSING"
        );
      }

      setReceiptDraft({
        uri: asset.uri,
        fileName:
          asset.fileName,
      });
    } catch (error) {
      console.error(
        "Choose receipt photo error:",
        error
      );

      Alert.alert(
        "Unable to Select Receipt",
        "The receipt photo could not be selected. Please try another image."
      );
    }
  }

  async function takeReceiptPhoto() {
    if (isSaving) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Allow camera access to photograph a receipt."
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync(
          {
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.85,
          }
        );

      if (result.canceled) {
        return;
      }

      const asset =
        result.assets[0];

      if (!asset?.uri) {
        throw new Error(
          "IMAGE_URI_MISSING"
        );
      }

      setReceiptDraft({
        uri: asset.uri,
        fileName:
          asset.fileName,
      });
    } catch (error) {
      console.error(
        "Take receipt photo error:",
        error
      );

      Alert.alert(
        "Unable to Capture Receipt",
        "The receipt photo could not be captured. Please try again."
      );
    }
  }

  async function handleSave() {
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

      const expenseId =
        await createFinanceExpense({
          title: cleanTitle,
          amount: parsedAmount,
          expenseDate: cleanDate,
          categoryId: selectedCategoryId,
          projectId:
            selectedProjectId || null,
          notes,
          isYouthVisible,
          createdBy: user.id,
        });

      if (receiptDraft) {
        let savedReceiptUri:
          | string
          | null = null;

        try {
          savedReceiptUri =
            await saveReceiptPhoto({
              sourceUri:
                receiptDraft.uri,
              expenseId,
              fileName:
                receiptDraft.fileName,
            });

          await updateFinanceExpenseReceipt({
            expenseId,
            receiptUri:
              savedReceiptUri,
            updatedBy: user.id,
          });
        } catch (receiptError) {
          console.error(
            "Initial receipt attachment error:",
            receiptError
          );

          if (savedReceiptUri) {
            await deleteReceiptPhoto(
              savedReceiptUri
            );
          }

          Alert.alert(
            "Expense Saved",
            "The expense was saved, but the receipt photo could not be attached. You can attach it later from Expense Details."
          );
        }
      }

      router.back();
    } catch (error) {
      console.error(
        "Create finance expense error:",
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
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Add Expense"
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
            Record an SK Expense
          </Text>

          <Text style={styles.introText}>
            Create the official expense record in
            Finance. Linking a project is optional.
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
                <Text
                  style={styles.warningTitle}
                >
                  Budget category required
                </Text>

                <Text
                  style={styles.warningBody}
                >
                  Create a Budget Category before
                  recording an expense.
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/add-budget-category"
                    )
                  }
                >
                  <Text
                    style={styles.warningLink}
                  >
                    Create Budget Category
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

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
                style={styles.dateInput}
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
              disabled={
                isSaving ||
                isLoadingOptions
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

            <Text style={styles.fieldHint}>
              Optional. If selected, the same expense
              will also appear in that project's
              Project Expenses.
            </Text>
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

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Receipt Photo
            </Text>

            <Text style={styles.fieldHint}>
              Optional. Receipt photos stay private and are stored locally on this device.
            </Text>

            {receiptDraft ? (
              <View
                style={
                  styles.receiptPreviewCard
                }
              >
                <Image
                  source={{
                    uri: receiptDraft.uri,
                  }}
                  style={
                    styles.receiptPreview
                  }
                  resizeMode="cover"
                />

                <View
                  style={
                    styles.receiptPreviewFooter
                  }
                >
                  <View
                    style={
                      styles.receiptSelectedText
                    }
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color={colors.success}
                    />

                    <Text
                      style={
                        styles.receiptSelectedLabel
                      }
                    >
                      Receipt selected
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.removeReceiptButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={() =>
                      setReceiptDraft(
                        null
                      )
                    }
                    disabled={isSaving}
                  >
                    <Text
                      style={
                        styles.removeReceiptText
                      }
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View
                style={
                  styles.receiptEmpty
                }
              >
                <Ionicons
                  name="image-outline"
                  size={28}
                  color={colors.textMuted}
                />

                <Text
                  style={
                    styles.receiptEmptyText
                  }
                >
                  No receipt photo selected
                </Text>
              </View>
            )}

            <View
              style={
                styles.receiptActions
              }
            >
              <Pressable
                style={({ pressed }) => [
                  styles.receiptActionButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={
                  takeReceiptPhoto
                }
                disabled={isSaving}
              >
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text
                  style={
                    styles.receiptActionText
                  }
                >
                  Take Photo
                </Text>
              </Pressable>

              <View
                style={
                  styles.receiptActionSpacer
                }
              />

              <Pressable
                style={({ pressed }) => [
                  styles.receiptActionButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={
                  chooseReceiptPhoto
                }
                disabled={isSaving}
              >
                <Ionicons
                  name="images-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text
                  style={
                    styles.receiptActionText
                  }
                >
                  Choose Photo
                </Text>
              </Pressable>
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
            <Text
              style={styles.saveButtonText}
            >
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

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#F4C86A",
    borderRadius: 16,
    backgroundColor: "#FFF7E6",
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
    marginLeft: spacing.sm,
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
    elevation: 2,
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

  receiptEmpty: {
    elevation: 3,
    minHeight: 108,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
  },

  receiptEmptyText: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: "center",
  },

  receiptPreviewCard: {
    elevation: 3,
    marginTop: spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  receiptPreview: {
    width: "100%",
    height: 190,
    backgroundColor: colors.border,
  },

  receiptPreviewFooter: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },

  receiptSelectedText: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.sm,
  },

  receiptSelectedLabel: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  removeReceiptButton: {
    minWidth: 64,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  removeReceiptText: {
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.danger,
  },

  receiptActions: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },

  receiptActionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },

  receiptActionSpacer: {
    width: spacing.sm,
  },

  receiptActionText: {
    minWidth: 0,
    marginLeft: spacing.xs,
    fontSize: 11,
    lineHeight: 16,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: "center",
    flexShrink: 1,
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
