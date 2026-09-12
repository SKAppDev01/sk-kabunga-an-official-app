import { Ionicons } from "@expo/vector-icons";
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getInventoryItemById,
  InventoryCondition,
  InventoryItem,
  InventoryStatus,
} from "../services/inventory";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function getConditionStyle(
  condition: InventoryCondition
) {
  switch (condition) {
    case "Excellent":
      return {
        backgroundColor: "#ECFDF3",
        textColor: "#047857",
      };

    case "Fair":
      return {
        backgroundColor: "#FFF7ED",
        textColor: "#C2410C",
      };

    case "Needs Repair":
      return {
        backgroundColor: "#FEF3C7",
        textColor: "#B45309",
      };

    case "Damaged":
      return {
        backgroundColor: "#FEF2F2",
        textColor: "#B91C1C",
      };

    default:
      return {
        backgroundColor: "#EFF6FF",
        textColor: colors.primary,
      };
  }
}

function getStatusStyle(
  status: InventoryStatus
) {
  switch (status) {
    case "Borrowed":
      return {
        backgroundColor: "#FFF7ED",
        textColor: "#C2410C",
      };

    case "Unavailable":
      return {
        backgroundColor: "#FEF2F2",
        textColor: "#B91C1C",
      };

    default:
      return {
        backgroundColor: "#ECFDF3",
        textColor: "#047857",
      };
  }
}

type DetailRowProps = {
  icon:
    | "layers-outline"
    | "shield-checkmark-outline"
    | "checkmark-circle-outline";
  label: string;
  value: string;
};

function DetailRow({
  icon,
  label,
  value,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function InventoryItemDetailsScreen() {
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

  const [isLoading, setIsLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadItem() {
        if (!itemId) {
          if (active) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setNotFound(false);

          const record =
            await getInventoryItemById(
              itemId
            );

          if (!active) {
            return;
          }

          if (!record) {
            setItem(null);
            setNotFound(true);
            return;
          }

          setItem(record);
        } catch (error) {
          console.error(
            "Inventory item details loading error:",
            error
          );

          if (active) {
            setItem(null);
            setNotFound(true);
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

  const conditionStyle = item
    ? getConditionStyle(
        item.condition
      )
    : null;

  const statusStyle = item
    ? getStatusStyle(
        item.status
      )
    : null;

  return (
    <SafeAreaView
      style={styles.safeArea}
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

        <Text style={styles.headerTitle}>
          Item Details
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
      ) : notFound || !item ? (
        <View style={styles.centerState}>
          <Ionicons
            name="cube-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text style={styles.emptyTitle}>
            Item not found
          </Text>

          <Text style={styles.stateText}>
            This inventory record may no
            longer be available.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.titleSection}
          >
            <View
              style={styles.titleIcon}
            >
              <Ionicons
                name="cube-outline"
                size={29}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.titleText}
            >
              <Text
                style={styles.itemName}
              >
                {item.itemName}
              </Text>

              <View
                style={styles.badgesRow}
              >
                {conditionStyle ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          conditionStyle.backgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            conditionStyle.textColor,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.condition}
                    </Text>
                  </View>
                ) : null}

                {statusStyle ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          statusStyle.backgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            statusStyle.textColor,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.status}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View
            style={styles.detailsGroup}
          >
            <DetailRow
              icon="layers-outline"
              label="Quantity"
              value={`${item.quantity} total • ${item.availableQuantity} available`}
            />

            <DetailRow
              icon="shield-checkmark-outline"
              label="Condition"
              value={item.condition}
            />

            <DetailRow
              icon="checkmark-circle-outline"
              label="Status"
              value={item.status}
            />
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Description
            </Text>

            <Text
              style={
                item.description
                  ? styles.bodyText
                  : styles.emptyText
              }
            >
              {item.description ||
                "No description added."}
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Notes
            </Text>

            <Text
              style={
                item.notes
                  ? styles.bodyText
                  : styles.emptyText
              }
            >
              {item.notes ||
                "No notes added."}
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Inventory Actions
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Manage quantity, condition,
              borrowing, returns and the
              complete history for this item.
            </Text>

            <View style={styles.actionRows}>
              <Pressable
                style={styles.actionRow}
                onPress={() =>
                  router.push({
                    pathname:
                      "/inventory-quantity",
                    params: {
                      id: item.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="layers-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.actionLabel}
                >
                  Quantity
                </Text>

                <Text
                  style={styles.actionPending}
                >
                  {item.availableQuantity}
                  /
                  {item.quantity}
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.actionRow,
                  styles.rowDivider,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/inventory-condition",
                    params: {
                      id: item.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.actionLabel}
                >
                  Condition
                </Text>

                <Text
                  style={styles.actionPending}
                  numberOfLines={1}
                >
                  {item.condition}
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.actionRow,
                  styles.rowDivider,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/inventory-borrow",
                    params: {
                      id: item.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.actionLabel}
                >
                  Borrow Item
                </Text>

                <Text
                  style={styles.actionPending}
                >
                  {item.availableQuantity}
                  {" available"}
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.actionRow,
                  styles.rowDivider,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/inventory-return",
                    params: {
                      id: item.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.actionLabel}
                >
                  Return Item
                </Text>

                <Text
                  style={styles.actionPending}
                >
                  {Math.max(
                    0,
                    item.quantity -
                      item.availableQuantity
                  )}
                  {" borrowed"}
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.actionRow,
                  styles.rowDivider,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/inventory-history",
                    params: {
                      id: item.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="time-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text
                  style={styles.actionLabel}
                >
                  Inventory History
                </Text>

                <Text
                  style={styles.actionPending}
                >
                  View
                </Text>

                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
                <RecordAuditMetadata
          table="inventory_items"
          recordId={item.id}
        />
</ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
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

  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  titleIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: "#EFF6FF",
  },

  titleText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.lg,
  },

  itemName: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  badge: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },

  detailsGroup: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  detailRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  detailText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },

  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  detailValue: {
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },

  section: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  sectionDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  bodyText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text,
  },

  emptyText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
  },

  actionRows: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  actionRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
  },

  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  actionLabel: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    paddingRight: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  actionPending: {
    minWidth: 72,
    maxWidth: 130,
    flexShrink: 0,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: "right",
  },
});
