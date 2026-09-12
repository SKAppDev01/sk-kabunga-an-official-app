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
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getInventoryItemById,
  InventoryItem,
  updateInventoryQuantity,
} from "../services/inventory";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function InventoryQuantityScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const itemId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [item, setItem] =
    useState<InventoryItem | null>(
      null
    );

  const [quantity, setQuantity] =
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

          const record =
            await getInventoryItemById(
              itemId
            );

          if (!active) {
            return;
          }

          setItem(record);

          if (record) {
            setQuantity(
              String(record.quantity)
            );
          }
        } catch (loadError) {
          console.error(
            "Quantity loading error:",
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
    if (!itemId || !item) {
      return;
    }

    const parsed =
      Number(quantity.trim());

    if (
      !Number.isInteger(parsed) ||
      parsed < 1
    ) {
      setError(
        "Quantity must be a whole number of at least 1."
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const user =
        await getCurrentSessionUser();

      await updateInventoryQuantity({
        itemId,
        quantity: parsed,
        createdBy:
          user?.id,
      });

      router.back();
    } catch (saveError) {
      console.error(
        "Quantity update error:",
        saveError
      );

      const message =
        String(saveError);

      if (
        message.includes(
          "QUANTITY_BELOW_BORROWED"
        )
      ) {
        setError(
          "The total quantity cannot be lower than the number currently borrowed."
        );
      } else {
        setError(
          "Unable to update the quantity."
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  const borrowed = item
    ? Math.max(
        0,
        item.quantity -
          item.availableQuantity
      )
    : 0;

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
            Quantity
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <Text
              style={styles.stateText}
            >
              Loading item...
            </Text>
          ) : item ? (
            <>
              <Text
                style={styles.itemName}
              >
                {item.itemName}
              </Text>

              <Text
                style={styles.helpText}
              >
                Update the total number of
                units owned by the SK.
              </Text>

              <View
                style={styles.summaryRows}
              >
                <View
                  style={styles.summaryRow}
                >
                  <View
                    style={styles.summaryLabelWrap}
                  >
                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Current Total
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {item.quantity}
                  </Text>
                </View>

                <View
                  style={styles.summaryRow}
                >
                  <View
                    style={styles.summaryLabelWrap}
                  >
                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Available
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {item.availableQuantity}
                  </Text>
                </View>

                <View
                  style={styles.summaryRow}
                >
                  <View
                    style={styles.summaryLabelWrap}
                  >
                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Borrowed
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {borrowed}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.label}
              >
                New Total Quantity
              </Text>

              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={(text) => {
                  setQuantity(text);
                  setError("");
                }}
                keyboardType="number-pad"
                placeholder="Enter quantity"
                placeholderTextColor={
                  colors.textMuted
                }
              />

              {error ? (
                <Text
                  style={
                    styles.errorText
                  }
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
                  style={
                    styles.saveButtonText
                  }
                >
                  {isSaving
                    ? "Saving..."
                    : "Save Quantity"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Text
              style={styles.errorText}
            >
              {error ||
                "Item not found."}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  content: {
    flex: 1,
    padding: spacing.xl,
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
  summaryRows: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabelWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  summaryValue: {
    width: 56,
    flexShrink: 0,
    textAlign: "right",
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  label: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
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
