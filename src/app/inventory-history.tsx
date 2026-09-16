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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppHeader";

import {
  getInventoryHistory,
  getInventoryItemById,
  InventoryHistoryRecord,
} from "../services/inventory";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatCreatedAt(
  value: string
) {
  const date = new Date(
    value.includes("T")
      ? value
      : `${value.replace(" ", "T")}Z`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getActionLabel(
  action:
    InventoryHistoryRecord["actionType"]
) {
  switch (action) {
    case "condition_update":
      return "Condition Updated";

    case "borrow":
      return "Item Borrowed";

    case "return":
      return "Item Returned";

    default:
      return "Quantity Updated";
  }
}

function getActionIcon(
  action:
    InventoryHistoryRecord["actionType"]
):
  | "layers-outline"
  | "shield-checkmark-outline"
  | "arrow-up-circle-outline"
  | "arrow-down-circle-outline" {
  switch (action) {
    case "condition_update":
      return "shield-checkmark-outline";

    case "borrow":
      return "arrow-up-circle-outline";

    case "return":
      return "arrow-down-circle-outline";

    default:
      return "layers-outline";
  }
}

function getRecordSummary(
  record: InventoryHistoryRecord
) {
  if (
    record.actionType ===
    "borrow"
  ) {
    return [
      record.quantity != null
        ? `${record.quantity} unit(s)`
        : null,
      record.borrowerName,
      record.dueDate
        ? `Due ${record.dueDate}`
        : null,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  if (
    record.actionType ===
    "return"
  ) {
    return [
      record.quantity != null
        ? `${record.quantity} unit(s)`
        : null,
      record.borrowerName,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  return (
    record.details ||
    (record.quantity != null
      ? String(record.quantity)
      : "")
  );
}

export default function InventoryHistoryScreen() {
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
    useState<InventoryHistoryRecord[]>(
      []
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHistory() {
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
          setError("");

          const [
            item,
            history,
          ] = await Promise.all([
            getInventoryItemById(
              itemId
            ),
            getInventoryHistory(
              itemId
            ),
          ]);

          if (!active) {
            return;
          }

          setItemName(
            item?.itemName ||
            ""
          );
          setRecords(history);
        } catch (loadError) {
          console.error(
            "Inventory history loading error:",
            loadError
          );

          if (active) {
            setError(
              "Unable to load inventory history."
            );
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadHistory();

      return () => {
        active = false;
      };
    }, [itemId])
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Inventory History"
        showBack
      />
      

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading history...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons
            name="time-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text
            style={styles.emptyTitle}
          >
            No history yet
          </Text>

          <Text
            style={styles.stateText}
          >
            Quantity, condition,
            borrowing and return changes
            will appear here.
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

          <Text
            style={styles.itemName}
          >
            {itemName}
          </Text>

          <Text
            style={styles.recordCount}
          >
            {records.length}
            {" history record"}
            {records.length === 1
              ? ""
              : "s"}
          </Text>

          <View
            style={styles.historyList}
          >
            {records.map(
              (record, index) => (
                <View
                  key={record.id}
                  style={[
                    styles.historyRow,
                    index <
                      records.length - 1 &&
                      styles.rowDivider,
                  ]}
                >
                  <View
                    style={styles.iconWrap}
                  >
                    <Ionicons
                      name={getActionIcon(
                        record.actionType
                      )}
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={styles.historyText}
                  >
                    <Text
                      style={styles.actionTitle}
                    >
                      {getActionLabel(
                        record.actionType
                      )}
                    </Text>

                    <Text
                      style={styles.summaryText}
                    >
                      {getRecordSummary(
                        record
                      ) ||
                        "Inventory record updated"}
                    </Text>

                    {record.details &&
                    (record.actionType ===
                      "borrow" ||
                      record.actionType ===
                        "return") ? (
                      <Text
                        style={styles.notesText}
                      >
                        {record.details}
                      </Text>
                    ) : null}

                    <Text
                      style={styles.dateText}
                    >
                      {formatCreatedAt(
                        record.createdAt
                      )}
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        </ScrollView>
      )}
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
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
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
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
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
  recordCount: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  historyList: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyRow: {
    minHeight: 90,
    flexDirection: "row",
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    alignItems: "center",
    paddingTop: 2,
  },
  historyText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  summaryText: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  notesText: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  dateText: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textMuted,
  },
});
