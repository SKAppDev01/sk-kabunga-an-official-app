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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppHeader";

import {
  getInventoryItems,
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

function getStatusText(
  status: InventoryStatus
) {
  return status;
}

export default function InventoryScreen() {
  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadInventory() {
        try {
          setIsLoading(true);

          const records =
            await getInventoryItems();

          if (active) {
            setItems(records);
          }
        } catch (error) {
          console.error(
            "Inventory list loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadInventory();

      return () => {
        active = false;
      };
    }, [])
  );

  function renderItem(
    item: InventoryItem,
    index: number
  ) {
    const conditionStyle =
      getConditionStyle(
        item.condition
      );

    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.itemRow,
          index <
            items.length - 1 &&
            styles.rowDivider,
          pressed &&
            styles.itemRowPressed,
        ]}
        onPress={() =>
          router.push({
            pathname: "/inventory-item-details",
            params: {
              id: item.id,
            },
          })
        }
      >
        <View style={styles.itemIcon}>
          <Ionicons
            name="cube-outline"
            size={23}
            color={colors.primary}
          />
        </View>

        <View style={styles.itemText}>
          <View style={styles.titleRow}>
            <Text
              style={styles.itemName}
              numberOfLines={1}
            >
              {item.itemName}
            </Text>

            <View
              style={[
                styles.conditionBadge,
                {
                  backgroundColor:
                    conditionStyle.backgroundColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.conditionText,
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
          </View>

          <Text
            style={styles.itemMeta}
            numberOfLines={1}
          >
            Available: {item.availableQuantity}
            {" of "}
            {item.quantity}
            {" • "}
            {getStatusText(
              item.status
            )}
          </Text>

          {item.description ? (
            <Text
              style={styles.itemDescription}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Inventory"
        showBack
        right={
          !isLoading ? (
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountText}>{items.length}</Text>
            </View>
          ) : null
        }
      />
      

      <View style={styles.screen}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
        >
        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading inventory...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cube-outline"
                size={44}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No inventory items yet
            </Text>

            <Text style={styles.stateText}>
              Add your first SK property
              or equipment item to get started.
            </Text>
          </View>
        ) : (
          <>
            {items.map(
              renderItem
            )}
          </>
        )}

        
      
        </ScrollView>

<Pressable
          style={({ pressed }) => [
            styles.floatingAddButton,
            pressed &&
              styles.floatingAddButtonPressed,
          ]}
          onPress={() =>
            router.push(
              "/add-inventory-item"
            )
          }
          accessibilityLabel="Add inventory item"
        >
          <Ionicons
            name="add"
            size={31}
            color={colors.white}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    width: 78,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },


  headerCountWrap: {
    width: 78,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerCountBadge: {
    minWidth: 30,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.white,
  },

  headerCountText: {
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  screen: {
    backgroundColor: "#E3F2FD",
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: spacing.md,
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
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 100,
  },

  floatingAddButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  floatingAddButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  itemRow: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  itemRowPressed: {
    opacity: 0.65,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  itemIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  itemText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  itemName: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  conditionBadge: {
    minWidth: 70,
    maxWidth: 96,
    minHeight: 26,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },

  conditionText: {
    fontSize: 9,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },

  itemMeta: {
    marginTop: 5,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  itemDescription: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});
