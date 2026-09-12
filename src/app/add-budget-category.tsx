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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createBudgetCategory,
} from "../services/budget-categories";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type CategoryErrors = {
  name?: string;
  form?: string;
};

export default function AddBudgetCategoryScreen() {
  const [name, setName] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [isSaving, setIsSaving] =
    useState(false);
  const [errors, setErrors] =
    useState<CategoryErrors>({});

  async function handleSave() {
    const cleanName = name.trim();

    if (!cleanName) {
      setErrors({
        name:
          "Please enter a budget category name.",
      });
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

      await createBudgetCategory({
        name: cleanName,
        description,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Create budget category error:",
        error
      );

      const message = String(error);

      if (
        message.includes(
          "CATEGORY_ALREADY_EXISTS"
        )
      ) {
        setErrors({
          name:
            "A budget category with this name already exists.",
        });
        return;
      }

      setErrors({
        form:
          "Unable to create the budget category. Please try again.",
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
            Add Budget Category
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
            New Budget Category
          </Text>

          <Text style={styles.introText}>
            Create a category that can later be used
            for budget allocations and expenses.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Category Name
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.name &&
                  styles.inputError,
              ]}
              value={name}
              onChangeText={(text) => {
                setName(text);

                if (errors.name) {
                  setErrors({});
                }
              }}
              placeholder="Example: Sports & Recreation"
              placeholderTextColor={
                colors.textMuted
              }
              editable={!isSaving}
              autoCapitalize="words"
            />

            {errors.name && (
              <Text style={styles.errorText}>
                {errors.name}
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
              placeholder="Optional description"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          <View style={styles.exampleCard}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color={colors.primary}
            />

            <View style={styles.exampleText}>
              <Text style={styles.exampleTitle}>
                Example categories
              </Text>

              <Text style={styles.exampleBody}>
                Sports & Recreation, Education,
                Environment, Health, Leadership,
                Administration
              </Text>
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
                ? "Creating Category..."
                : "Create Category"}
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

  exampleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor:
      "rgba(37,99,235,0.06)",
  },

  exampleText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  exampleTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  exampleBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
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
