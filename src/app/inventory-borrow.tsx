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
  borrowInventoryItem,
  getInventoryItemById,
  InventoryItem,
} from "../services/inventory";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function InventoryBorrowScreen() {
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

  const [borrowerName, setBorrowerName] =
    useState("");

  const [contactNumber, setContactNumber] =
    useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [dueDate, setDueDate] =
    useState("");

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

          const record =
            await getInventoryItemById(
              itemId
            );

          if (active) {
            setItem(record);
          }
        } catch (loadError) {
          console.error(
            "Borrow item loading error:",
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

  async function handleBorrow() {
    if (!itemId || !item) {
      return;
    }

    const parsedQuantity =
      Number(quantity.trim());

    if (!borrowerName.trim()) {
      setError(
        "Please enter the borrower's name."
      );
      return;
    }

    if (
      !Number.isInteger(
        parsedQuantity
      ) ||
      parsedQuantity < 1
    ) {
      setError(
        "Borrow quantity must be a whole number of at least 1."
      );
      return;
    }

    if (
      parsedQuantity >
      item.availableQuantity
    ) {
      setError(
        `Only ${item.availableQuantity} unit(s) are currently available.`
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const user =
        await getCurrentSessionUser();

      await borrowInventoryItem({
        itemId,
        borrowerName,
        contactNumber,
        quantity:
          parsedQuantity,
        dueDate,
        notes,
        createdBy:
          user?.id,
      });

      router.back();
    } catch (borrowError) {
      console.error(
        "Borrow item error:",
        borrowError
      );

      const message =
        String(borrowError);

      if (
        message.includes(
          "INVALID_DATE"
        )
      ) {
        setError(
          "Use a valid due date in YYYY-MM-DD format."
        );
      } else if (
        message.includes(
          "INSUFFICIENT_AVAILABLE_QUANTITY"
        )
      ) {
        setError(
          "There are not enough available units to borrow."
        );
      } else {
        setError(
          "Unable to record the borrowed item."
        );
      }
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
            Borrow Item
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
        ) : !item ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>
              {error ||
                "Item not found."}
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
              {item.itemName}
            </Text>

            <Text
              style={styles.availableText}
            >
              {item.availableQuantity}
              {" of "}
              {item.quantity}
              {" available"}
            </Text>

            {item.availableQuantity === 0 ? (
              <View
                style={styles.warningBox}
              >
                <Text
                  style={
                    styles.warningText
                  }
                >
                  No units are currently
                  available to borrow.
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>
              Borrower Name
            </Text>

            <TextInput
              style={styles.input}
              value={borrowerName}
              onChangeText={(text) => {
                setBorrowerName(text);
                setError("");
              }}
              placeholder="Full name"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="words"
            />

            <Text style={styles.label}>
              Contact Number
            </Text>

            <TextInput
              style={styles.input}
              value={contactNumber}
              onChangeText={
                setContactNumber
              }
              placeholder="Optional"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>
              Quantity to Borrow
            </Text>

            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="number-pad"
            />

            <Text style={styles.label}>
              Due Date
            </Text>

            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD (optional)"
              placeholderTextColor={
                colors.textMuted
              }
            />

            <Text style={styles.label}>
              Notes
            </Text>

            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional borrowing notes"
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
                  isSaving ||
                  item.availableQuantity ===
                    0) &&
                  styles.buttonPressed,
              ]}
              onPress={handleBorrow}
              disabled={
                isSaving ||
                item.availableQuantity ===
                  0
              }
            >
              <Text
                style={
                  styles.saveButtonText
                }
              >
                {isSaving
                  ? "Saving..."
                  : "Record Borrowing"}
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
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
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
  availableText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  warningBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: "#B91C1C",
  },
  label: {
    marginTop: spacing.lg,
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
  notesInput: {
    minHeight: 90,
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
    lineHeight: 20,
    color: colors.danger,
    textAlign: "center",
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
    opacity: 0.55,
  },
});
