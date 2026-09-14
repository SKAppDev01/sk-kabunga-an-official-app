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
  getInventoryItemById,
  InventoryCondition,
  updateInventoryCondition,
} from "../services/inventory";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const OPTIONS: InventoryCondition[] = [
  "Excellent",
  "Good",
  "Fair",
  "Needs Repair",
  "Damaged",
];

export default function InventoryConditionScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const itemId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [itemName, setItemName] =
    useState("");

  const [condition, setCondition] =
    useState<InventoryCondition>(
      "Good"
    );

  const [notes, setNotes] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadItem() {
        if (!itemId) {
          if (active) {
            setError(
              "Item not found."
            );
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);

          const item =
            await getInventoryItemById(
              itemId
            );

          if (!active) {
            return;
          }

          if (!item) {
            setError(
              "Item not found."
            );
            return;
          }

          setItemName(
            item.itemName
          );
          setCondition(
            item.condition
          );
        } catch (loadError) {
          console.error(
            "Condition loading error:",
            loadError
          );

          if (active) {
            setError(
              "Unable to load the item."
            );
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadItem();

      return () => {
        active = false;
      };
    }, [itemId])
  );

  async function handleSave() {
    if (!itemId) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const user =
        await getCurrentSessionUser();

      await updateInventoryCondition({
        itemId,
        condition,
        notes,
        createdBy:
          user?.id,
      });

      router.back();
    } catch (saveError) {
      console.error(
        "Condition update error:",
        saveError
      );

      setError(
        "Unable to update the condition."
      );
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
            Condition
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading item...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={
              styles.content
            }
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={styles.itemName}
            >
              {itemName}
            </Text>

            <Text
              style={styles.helpText}
            >
              Select the current physical
              condition of this item.
            </Text>

            <View
              style={styles.optionsList}
            >
              {OPTIONS.map(
                (option) => {
                  const selected =
                    option ===
                    condition;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.optionRow,
                        selected &&
                          styles.optionRowSelected,
                      ]}
                      onPress={() =>
                        setCondition(
                          option
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>

                      <View
                        style={
                          styles.checkSlot
                        }
                      >
                        {selected ? (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={colors.primary}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Text
              style={styles.label}
            >
              Notes
            </Text>

            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional reason or condition notes"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
            />

            {error ? (
              <Text
                style={styles.errorText}
              >
                {error}
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
                style={styles.saveButtonText}
              >
                {isSaving
                  ? "Saving..."
                  : "Save Condition"}
              </Text>
            </Pressable>
          </ScrollView>
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
  headerSpacer: {
    width: 44,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  itemName: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  helpText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  optionsList: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRowSelected: {
    backgroundColor: "#EFF6FF",
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
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
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  notesInput: {
    minHeight: 96,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
  },
  saveButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
