import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import RecordAuditMetadata from "../components/RecordAuditMetadata";
import {
  useCallback,
  useState,
} from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  FinanceExpense,
  getFinanceExpenseById,
  updateFinanceExpenseReceipt,
} from "../services/finance-expenses";
import {
  deleteReceiptPhoto,
  saveReceiptPhoto,
} from "../services/receipt-storage";
import {
  getCurrentSessionUser,
} from "../services/session";
import { isYouthMemberRole } from "../services/access";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ExpenseDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const expenseId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [expense, setExpense] =
    useState<FinanceExpense | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isYouthMember, setIsYouthMember] =
    useState(false);
  const [isReceiptWorking, setIsReceiptWorking] =
    useState(false);

  const loadExpense =
    useCallback(async () => {
      if (!expenseId) {
        setExpense(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const result =
          await getFinanceExpenseById(
            expenseId
          );

        setExpense(result);
      } catch (error) {
        console.error(
          "Expense details loading error:",
          error
        );

        setExpense(null);
      } finally {
        setIsLoading(false);
      }
    }, [expenseId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!expenseId) {
          if (active) {
            setExpense(null);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);

          const user =
            await getCurrentSessionUser();

          if (!user) {
            router.replace("/login");
            return;
          }

          const result =
            await getFinanceExpenseById(
              expenseId
            );

          if (active) {
            setIsYouthMember(
              isYouthMemberRole(user.role)
            );
            setExpense(result);
          }
        } catch (error) {
          console.error(
            "Expense details loading error:",
            error
          );

          if (active) {
            setExpense(null);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [expenseId])
  );

  function formatCurrency(value: number) {
    return `₱${value.toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "Not set";
    }

    const normalized =
      value.includes("T")
        ? value
        : value.includes(" ")
          ? `${value.replace(" ", "T")}Z`
          : `${value}T00:00:00`;

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  async function handleChooseReceipt() {
    if (
      !expense ||
      !expenseId ||
      isReceiptWorking
    ) {
      return;
    }

    try {
      setIsReceiptWorking(true);

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

      const asset = result.assets[0];

      if (!asset?.uri) {
        throw new Error(
          "IMAGE_URI_MISSING"
        );
      }

      const savedUri =
        await saveReceiptPhoto({
          sourceUri: asset.uri,
          expenseId,
          fileName: asset.fileName,
        });

      try {
        const user =
          await getCurrentSessionUser();

        await updateFinanceExpenseReceipt({
          expenseId,
          receiptUri: savedUri,
          updatedBy: user?.id,
        });

        const oldReceiptUri =
          expense.receiptUri;

        await loadExpense();

        if (
          oldReceiptUri &&
          oldReceiptUri !== savedUri
        ) {
          await deleteReceiptPhoto(
            oldReceiptUri
          );
        }
      } catch (error) {
        await deleteReceiptPhoto(
          savedUri
        );
        throw error;
      }
    } catch (error) {
      console.error(
        "Attach receipt error:",
        error
      );

      Alert.alert(
        "Unable to Attach Receipt",
        "The receipt photo could not be saved. Please try another image."
      );
    } finally {
      setIsReceiptWorking(false);
    }
  }

  function confirmRemoveReceipt() {
    if (
      !expense ||
      !expenseId ||
      !expense.receiptUri ||
      isReceiptWorking
    ) {
      return;
    }

    Alert.alert(
      "Remove Receipt",
      "Remove the attached receipt photo from this expense?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const oldUri =
              expense.receiptUri;

            try {
              setIsReceiptWorking(true);

              const user =
                await getCurrentSessionUser();

              await updateFinanceExpenseReceipt({
                expenseId,
                receiptUri: null,
                updatedBy: user?.id,
              });

              await deleteReceiptPhoto(
                oldUri
              );

              await loadExpense();
            } catch (error) {
              console.error(
                "Remove receipt error:",
                error
              );

              Alert.alert(
                "Unable to Remove Receipt",
                "The receipt photo could not be removed."
              );
            } finally {
              setIsReceiptWorking(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Expense Details
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading expense...
          </Text>
        </View>
      ) : !expense ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>
            Expense not found
          </Text>

          <Text style={styles.stateText}>
            This expense record may no longer exist.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>

              {!isYouthMember && (
              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/edit-expense",
                    params: {
                      id: expense.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text
                  style={
                    styles.editButtonText
                  }
                >
                  Edit
                </Text>
              </Pressable>
              )}
            </View>

            <Text
              style={styles.expenseTitle}
            >
              {expense.title}
            </Text>

            <Text style={styles.amount}>
              {formatCurrency(
                expense.amount
              )}
            </Text>
          </View>

          {isYouthMember && (
            <View style={styles.readOnlyNotice}>
              <Ionicons
                name="eye-outline"
                size={19}
                color={colors.primary}
              />
              <Text style={styles.readOnlyText}>
                Read-only finance information approved for youth-member viewing. Internal notes and receipt photos are hidden.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            Expense Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar-outline"
              label="Expense Date"
              value={formatDate(
                expense.expenseDate
              )}
            />

            <View style={styles.divider} />

            <InfoRow
              icon="albums-outline"
              label="Budget Category"
              value={
                expense.categoryName ||
                "Uncategorized"
              }
            />

            <View style={styles.divider} />

            <InfoRow
              icon="folder-outline"
              label="Linked Project"
              value={
                expense.projectTitle ||
                "No linked project"
              }
            />
          </View>

          {!isYouthMember && (
            <>
          <Text style={styles.sectionTitle}>
            Notes
          </Text>

          <View style={styles.notesCard}>
            <Text
              style={
                expense.notes
                  ? styles.notesText
                  : styles.emptyNotes
              }
            >
              {expense.notes ||
                "No notes added."}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Receipt
          </Text>

          <View style={styles.receiptCard}>
            {expense.receiptUri ? (
              <>
                <Image
                  source={{
                    uri: expense.receiptUri,
                  }}
                  style={styles.receiptImage}
                  resizeMode="cover"
                />

                <View
                  style={styles.receiptStatus}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />

                  <Text
                    style={
                      styles.receiptStatusText
                    }
                  >
                    Receipt photo attached
                  </Text>
                </View>

                <View
                  style={
                    styles.receiptActions
                  }
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.receiptPrimaryButton,
                      pressed &&
                        styles.buttonPressed,
                      isReceiptWorking &&
                        styles.buttonDisabled,
                    ]}
                    onPress={
                      handleChooseReceipt
                    }
                    disabled={
                      isReceiptWorking
                    }
                  >
                    <Ionicons
                      name="images-outline"
                      size={18}
                      color={colors.white}
                    />

                    <Text
                      style={
                        styles.receiptPrimaryButtonText
                      }
                    >
                      Change Photo
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.receiptDeleteButton,
                      pressed &&
                        styles.buttonPressed,
                      isReceiptWorking &&
                        styles.buttonDisabled,
                    ]}
                    onPress={
                      confirmRemoveReceipt
                    }
                    disabled={
                      isReceiptWorking
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.danger}
                    />

                    <Text
                      style={
                        styles.receiptDeleteButtonText
                      }
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View
                style={
                  styles.noReceiptContent
                }
              >
                <View
                  style={
                    styles.noReceiptIcon
                  }
                >
                  <Ionicons
                    name="image-outline"
                    size={30}
                    color={colors.textMuted}
                  />
                </View>

                <Text
                  style={styles.noReceiptTitle}
                >
                  No receipt attached
                </Text>

                <Text
                  style={
                    styles.noReceiptText
                  }
                >
                  Select a receipt photo from this
                  device and keep it stored locally
                  with the expense record.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.attachButton,
                    pressed &&
                      styles.buttonPressed,
                    isReceiptWorking &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    handleChooseReceipt
                  }
                  disabled={
                    isReceiptWorking
                  }
                >
                  <Ionicons
                    name="images-outline"
                    size={19}
                    color={colors.white}
                  />

                  <Text
                    style={
                      styles.attachButtonText
                    }
                  >
                    {isReceiptWorking
                      ? "Attaching..."
                      : "Choose Receipt Photo"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

            </>
          )}

          <Text style={styles.sectionTitle}>
            Record Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="time-outline"
              label="Created"
              value={formatDate(
                expense.createdAt
              )}
            />
          </View>
                {!isYouthMember ? (
          <RecordAuditMetadata
            table="expenses"
            recordId={expense.id}
          />
        ) : null}
</ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon:
    | "calendar-outline"
    | "albums-outline"
    | "folder-outline"
    | "time-outline";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
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

  scrollView: {
    backgroundColor: "#E3F2FD",
    flex: 1,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  heroCard: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  heroTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  editButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },

  editButtonText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  expenseTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    lineHeight: 31,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  amount: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.primary,
  },

  readOnlyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  readOnlyText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  infoCard: {
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  infoRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  infoValue: {
    marginTop: 3,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  divider: {
    height: 1,
    marginLeft: 54,
    backgroundColor: colors.border,
  },

  notesCard: {
    minHeight: 105,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  notesText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  emptyNotes: {
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
  },

  receiptCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,

    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  receiptImage: {
    width: "100%",
    height: 260,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  receiptStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },

  receiptStatusText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.success,
  },

  receiptActions: {
    flexDirection: "row",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  receiptPrimaryButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primary,
  },

  receiptPrimaryButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  receiptDeleteButton: {
    minWidth: 110,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 13,
    backgroundColor: colors.white,
  },

  receiptDeleteButtonText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.danger,
  },

  noReceiptContent: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  noReceiptIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },

  noReceiptTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  noReceiptText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },

  attachButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },

  attachButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  buttonPressed: {
    opacity: 0.72,
  },

  buttonDisabled: {
    opacity: 0.55,
  },
});
