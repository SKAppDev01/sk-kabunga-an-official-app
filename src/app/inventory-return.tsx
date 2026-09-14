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
  ActiveBorrowRecord,
  getActiveInventoryBorrows,
  getInventoryItemById,
  returnInventoryItem,
} from "../services/inventory";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function InventoryReturnScreen() {
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

  const [records, setRecords] =
    useState<ActiveBorrowRecord[]>(
      []
    );

  const [
    selectedBorrowId,
    setSelectedBorrowId,
  ] = useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [notes, setNotes] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadData =
    useCallback(async () => {
      if (!itemId) {
        setError(
          "Item not found."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [
          item,
          borrows,
        ] = await Promise.all([
          getInventoryItemById(
            itemId
          ),
          getActiveInventoryBorrows(
            itemId
          ),
        ]);

        setItemName(
          item?.itemName ||
          ""
        );
        setRecords(borrows);

        setSelectedBorrowId(
          (current) => {
            const stillExists =
              borrows.some(
                (record) =>
                  record.id ===
                  current
              );

            if (stillExists) {
              return current;
            }

            return (
              borrows[0]?.id ||
              ""
            );
          }
        );
      } catch (loadError) {
        console.error(
          "Return item loading error:",
          loadError
        );

        setError(
          "Unable to load borrowed items."
        );
      } finally {
        setIsLoading(false);
      }
    }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const selectedBorrow =
    records.find(
      (record) =>
        record.id ===
        selectedBorrowId
    ) || null;

  async function handleReturn() {
    if (
      !itemId ||
      !selectedBorrow
    ) {
      return;
    }

    const parsed =
      Number(quantity.trim());

    if (
      !Number.isInteger(parsed) ||
      parsed < 1
    ) {
      setError(
        "Return quantity must be a whole number of at least 1."
      );
      return;
    }

    if (
      parsed >
      selectedBorrow.remainingQuantity
    ) {
      setError(
        `Only ${selectedBorrow.remainingQuantity} unit(s) remain outstanding for this borrower.`
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const user =
        await getCurrentSessionUser();

      await returnInventoryItem({
        itemId,
        borrowHistoryId:
          selectedBorrow.id,
        quantity: parsed,
        notes,
        createdBy:
          user?.id,
      });

      setQuantity("1");
      setNotes("");

      await loadData();
    } catch (returnError) {
      console.error(
        "Return item error:",
        returnError
      );

      setError(
        "Unable to record the return."
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
            Return Item
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading borrowed items...
            </Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={44}
              color={colors.primary}
            />

            <Text
              style={styles.emptyTitle}
            >
              Nothing to return
            </Text>

            <Text
              style={styles.stateText}
            >
              There are no outstanding
              borrowed units for this item.
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
              Choose the borrower record
              that is returning the item.
            </Text>

            <View
              style={styles.borrowList}
            >
              {records.map(
                (record) => {
                  const selected =
                    record.id ===
                    selectedBorrowId;

                  return (
                    <Pressable
                      key={record.id}
                      style={[
                        styles.borrowRow,
                        selected &&
                          styles.borrowRowSelected,
                      ]}
                      onPress={() => {
                        setSelectedBorrowId(
                          record.id
                        );
                        setQuantity(
                          String(
                            record.remainingQuantity
                          )
                        );
                        setError("");
                      }}
                    >
                      <View
                        style={styles.borrowText}
                      >
                        <Text
                          style={styles.borrowerName}
                          numberOfLines={1}
                        >
                          {record.borrowerName}
                        </Text>

                        <Text
                          style={styles.borrowMeta}
                        >
                          {record.remainingQuantity}
                          {" outstanding"}
                          {record.dueDate
                            ? ` • Due ${record.dueDate}`
                            : ""}
                        </Text>
                      </View>

                      <View
                        style={styles.checkSlot}
                      >
                        {selected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={21}
                            color={colors.primary}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Text style={styles.label}>
              Return Quantity
            </Text>

            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              placeholder="1"
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
              placeholder="Optional return notes"
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
              onPress={handleReturn}
              disabled={isSaving}
            >
              <Text
                style={styles.saveButtonText}
              >
                {isSaving
                  ? "Saving..."
                  : "Record Return"}
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
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  stateText: {
    width: "100%",
    maxWidth: 290,
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
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
  borrowList: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  borrowRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  borrowRowSelected: {
    backgroundColor: "#EFF6FF",
  },
  borrowText: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
  },
  borrowerName: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  borrowMeta: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  checkSlot: {
    width: 34,
    flexShrink: 0,
    alignItems: "center",
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
