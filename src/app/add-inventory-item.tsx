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
  createInventoryItem,
  InventoryCondition,
} from "../services/inventory";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type FormErrors = {
  itemName?: string;
  quantity?: string;
  form?: string;
};

const CONDITION_OPTIONS: InventoryCondition[] = [
  "Excellent",
  "Good",
  "Fair",
  "Needs Repair",
  "Damaged",
];

export default function AddInventoryItemScreen() {
  const [itemName, setItemName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [condition, setCondition] =
    useState<InventoryCondition>(
      "Good"
    );

  const [notes, setNotes] =
    useState("");

  const [
    conditionOpen,
    setConditionOpen,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errors, setErrors] =
    useState<FormErrors>({});

  function clearError(
    field: keyof FormErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleSave() {
    const cleanName =
      itemName.trim();

    const parsedQuantity =
      Number(quantity.trim());

    const nextErrors: FormErrors = {};

    if (!cleanName) {
      nextErrors.itemName =
        "Please enter an item name.";
    }

    if (
      !Number.isInteger(
        parsedQuantity
      ) ||
      parsedQuantity < 1
    ) {
      nextErrors.quantity =
        "Quantity must be a whole number of at least 1.";
    }

    if (
      Object.keys(nextErrors)
        .length > 0
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

      await createInventoryItem({
        itemName: cleanName,
        description,
        quantity: parsedQuantity,
        condition,
        notes,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Create inventory item error:",
        error
      );

      const message =
        String(error);

      if (
        message.includes(
          "INVALID_QUANTITY"
        )
      ) {
        setErrors({
          quantity:
            "Quantity must be a whole number of at least 1.",
        });
        return;
      }

      setErrors({
        form:
          "Unable to add the inventory item. Please try again.",
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
            onPress={() =>
              router.back()
            }
            disabled={isSaving}
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
            Add Item
          </Text>

          <View
            style={styles.headerSpacer}
          />
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
          <Text
            style={styles.introTitle}
          >
            Inventory Information
          </Text>

          <Text
            style={styles.introText}
          >
            Add SK property or equipment
            that should be tracked in the
            local inventory.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Item Name
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.itemName &&
                  styles.inputError,
              ]}
              value={itemName}
              onChangeText={(text) => {
                setItemName(text);

                if (
                  errors.itemName
                ) {
                  clearError(
                    "itemName"
                  );
                }
              }}
              placeholder="Example: Basketball"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="words"
              editable={!isSaving}
            />

            {errors.itemName ? (
              <Text
                style={styles.errorText}
              >
                {errors.itemName}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Description
            </Text>

            <TextInput
              style={
                styles.multilineInput
              }
              value={description}
              onChangeText={
                setDescription
              }
              placeholder="Optional item description"
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
              Quantity
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.quantity &&
                  styles.inputError,
              ]}
              value={quantity}
              onChangeText={(text) => {
                setQuantity(text);

                if (
                  errors.quantity
                ) {
                  clearError(
                    "quantity"
                  );
                }
              }}
              placeholder="1"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="number-pad"
              editable={!isSaving}
            />

            {errors.quantity ? (
              <Text
                style={styles.errorText}
              >
                {errors.quantity}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Condition
            </Text>

            <Pressable
              style={styles.selector}
              onPress={() =>
                setConditionOpen(
                  (current) =>
                    !current
                )
              }
              disabled={isSaving}
            >
              <View
                style={
                  styles.selectorLeft
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text
                  style={
                    styles.selectorText
                  }
                  numberOfLines={1}
                >
                  {condition}
                </Text>
              </View>

              <Ionicons
                name={
                  conditionOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={19}
                color={
                  colors.textMuted
                }
              />
            </Pressable>

            {conditionOpen ? (
              <View
                style={
                  styles.optionsList
                }
              >
                {CONDITION_OPTIONS.map(
                  (option) => {
                    const selected =
                      condition ===
                      option;

                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.optionRow,
                          selected &&
                            styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setCondition(
                            option
                          );
                          setConditionOpen(
                            false
                          );
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
                          {option}
                        </Text>

                        <View
                          style={
                            styles.optionCheckSlot
                          }
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={
                                colors.primary
                              }
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Notes
            </Text>

            <TextInput
              style={
                styles.multilineInput
              }
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

          <View
            style={styles.statusInfo}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={colors.primary}
            />

            <Text
              style={
                styles.statusInfoText
              }
            >
              New items start as Available.
            </Text>
          </View>

          {errors.form ? (
            <Text
              style={
                styles.formErrorText
              }
            >
              {errors.form}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (pressed ||
                isSaving) &&
                styles.buttonPressed,
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
                ? "Adding Item..."
                : "Add Item"}
            </Text>
          </Pressable>
        </ScrollView>
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
    paddingHorizontal:
      spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
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
    fontSize:
      typography.fontSize.lg,
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
    paddingBottom:
      spacing.xxxl,
  },

  introTitle: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  introText: {
    marginTop: spacing.sm,
    marginBottom:
      spacing.xl,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
  },

  fieldGroup: {
    marginBottom:
      spacing.lg,
  },

  label: {
    marginBottom:
      spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  input: {
    elevation: 2,
    minHeight: 52,
    paddingHorizontal:
      spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    fontSize:
      typography.fontSize.sm,
    color: colors.text,
    backgroundColor:
      colors.white,
  },

  multilineInput: {
    elevation: 2,
    minHeight: 96,
    padding: spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text,
    backgroundColor:
      colors.white,
  },

  selector: {
    elevation: 2,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    paddingHorizontal:
      spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    backgroundColor:
      colors.white,
  },

  selectorLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingRight:
      spacing.md,
  },

  selectorText: {
    flex: 1,
    minWidth: 0,
    marginLeft:
      spacing.sm,
    fontSize:
      typography.fontSize.sm,
    color: colors.text,
  },

  optionsList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor:
      colors.white,
  },

  optionRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:
      spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  optionRowSelected: {
    backgroundColor:
      "#EFF6FF",
  },

  optionText: {
    flex: 1,
    minWidth: 0,
    paddingRight:
      spacing.md,
    fontSize:
      typography.fontSize.sm,
    color: colors.text,
  },

  optionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  optionCheckSlot: {
    width: 24,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  inputError: {
    borderColor:
      colors.danger,
  },

  errorText: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.xs,
    color: colors.danger,
  },

  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom:
      spacing.lg,
  },

  statusInfoText: {
    flex: 1,
    minWidth: 0,
    marginLeft:
      spacing.sm,
    fontSize:
      typography.fontSize.sm,
    color:
      colors.textSecondary,
  },

  formErrorText: {
    marginBottom:
      spacing.md,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.danger,
    textAlign: "center",
  },

  saveButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
  },

  saveButtonText: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  buttonPressed: {
    opacity: 0.72,
  },
});
