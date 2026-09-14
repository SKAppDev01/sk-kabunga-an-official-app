import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useMemo,
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
  getTransferHistory,
  getTransferHistoryCounts,
  TransferHistoryItem,
} from "../services/data-transfer-history";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type Filter =
  | "all"
  | "incoming"
  | "outgoing";

function formatDateTime(
  value: string
) {
  const date =
    new Date(value);

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
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getTitle(
  item: TransferHistoryItem
) {
  switch (
    item.transfer_type
  ) {
    case "export":
      return "Data Export";
    case "import":
      return "Data Import";
    case "backup":
      return "Database Backup";
    case "restore":
      return "Database Restore";
    case "public_qr":
      return item.direction ===
        "incoming"
        ? "Public QR Received"
        : "Public QR Generated";
    case "official_qr":
      return item.direction ===
        "incoming"
        ? "Officials QR Received"
        : "Officials QR Generated";
    default:
      return "Data Transfer";
  }
}

function getIcon(
  item: TransferHistoryItem
) {
  if (
    item.transfer_type ===
      "public_qr" ||
    item.transfer_type ===
      "official_qr"
  ) {
    return item.direction ===
      "incoming"
      ? "scan-outline"
      : "qr-code-outline";
  }

  if (
    item.transfer_type ===
      "backup"
  ) {
    return "archive-outline";
  }

  if (
    item.transfer_type ===
      "restore"
  ) {
    return "refresh-outline";
  }

  return item.direction ===
    "incoming"
    ? "download-outline"
    : "share-outline";
}

function getChannelLabel(
  item: TransferHistoryItem
) {
  if (
    item.channel === "qr"
  ) {
    return "QR";
  }

  if (
    item.channel === "share"
  ) {
    return "Share";
  }

  return "File";
}

export default function DataTransferHistoryScreen() {
  const [
    history,
    setHistory,
  ] =
    useState<
      TransferHistoryItem[]
    >([]);

  const [
    counts,
    setCounts,
  ] = useState({
    total: 0,
    incoming: 0,
    outgoing: 0,
    qr: 0,
  });

  const [
    filter,
    setFilter,
  ] =
    useState<Filter>("all");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const load =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const [
            nextHistory,
            nextCounts,
          ] =
            await Promise.all([
              getTransferHistory(
                200
              ),
              getTransferHistoryCounts(),
            ]);

          setHistory(
            nextHistory
          );

          setCounts(
            nextCounts
          );
        } catch (loadError) {
          console.error(
            "Transfer history loading error:",
            loadError
          );

          setError(
            "Unable to load transfer history."
          );
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredHistory =
    useMemo(
      () =>
        filter === "all"
          ? history
          : history.filter(
              (item) =>
                item.direction ===
                filter
            ),
      [history, filter]
    );

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

        <Text
          style={styles.headerTitle}
        >
          Transfer History
        </Text>

        <Pressable
          style={styles.refreshButton}
          onPress={load}
          disabled={isLoading}
        >
          <Ionicons
            name="refresh-outline"
            size={22}
            color={
              isLoading
                ? colors.textMuted
                : colors.primary
            }
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.title}>
          Data Transfer Activity
        </Text>

        <Text style={styles.subtitle}>
          Successful export, import,
          backup, restore and QR activity
          recorded on this device.
        </Text>

        <View style={styles.summary}>
          <View style={styles.metric}>
            <Text
              style={styles.metricValue}
            >
              {counts.total}
            </Text>
            <Text
              style={styles.metricLabel}
            >
              Total
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <Text
              style={styles.metricValue}
            >
              {counts.incoming}
            </Text>
            <Text
              style={styles.metricLabel}
            >
              Incoming
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <Text
              style={styles.metricValue}
            >
              {counts.outgoing}
            </Text>
            <Text
              style={styles.metricLabel}
            >
              Outgoing
            </Text>
          </View>
        </View>

        <View style={styles.filters}>
          {(
            [
              "all",
              "incoming",
              "outgoing",
            ] as Filter[]
          ).map((value) => (
            <Pressable
              key={value}
              style={[
                styles.filterButton,
                filter === value &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setFilter(value)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value &&
                    styles.filterTextActive,
                ]}
              >
                {value === "all"
                  ? "All"
                  : value === "incoming"
                    ? "Incoming"
                    : "Outgoing"}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Loading transfer history...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.danger}
            />

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>
          </View>
        ) : filteredHistory.length ===
          0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="time-outline"
              size={42}
              color={colors.textMuted}
            />

            <Text
              style={styles.emptyTitle}
            >
              No transfer history yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              Completed data-sharing
              actions will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredHistory.map(
              (item) => (
                <View
                  key={item.id}
                  style={styles.row}
                >
                  <View
                    style={styles.iconBox}
                  >
                    <Ionicons
                      name={getIcon(
                        item
                      )}
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={styles.rowText}
                  >
                    <Text
                      style={styles.rowTitle}
                    >
                      {getTitle(
                        item
                      )}
                    </Text>

                    <Text
                      style={styles.rowMeta}
                    >
                      {getChannelLabel(
                        item
                      )}
                      {" • "}
                      {item.record_count}
                      {" record"}
                      {item.record_count ===
                      1
                        ? ""
                        : "s"}
                      {" • "}
                      {formatDateTime(
                        item.created_at
                      )}
                    </Text>

                    {item.detail ? (
                      <Text
                        style={styles.rowDetail}
                      >
                        {item.detail}
                      </Text>
                    ) : null}

                    {item.user_name ||
                    item.user_role ? (
                      <Text
                        style={styles.rowUser}
                      >
                        {item.user_name ||
                          "Local user"}
                        {item.user_role
                          ? ` • ${item.user_role}`
                          : ""}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons
                    name={
                      item.direction ===
                      "incoming"
                        ? "arrow-down-outline"
                        : "arrow-up-outline"
                    }
                    size={18}
                    color={
                      item.direction ===
                      "incoming"
                        ? "#047857"
                        : colors.primary
                    }
                  />
                </View>
              )
            )}
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={colors.primary}
          />

          <Text style={styles.infoText}>
            Transfer History is kept as a
            device audit trail. It is not
            replaced during database Restore,
            and there is no Clear History
            button.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom:
      spacing.xxxl + spacing.xl,
  },
  title: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
    flexShrink: 1,
  },
  summary: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  metricValue: {
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.primary,
  },
  metricLabel: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    paddingHorizontal: 1,
    fontSize: 8,
    lineHeight: 13,
    color:
      colors.textSecondary,
    textAlign: "center",
    flexShrink: 1,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor:
      colors.border,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  filterButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
  },
  filterButtonActive: {
    borderColor:
      colors.primary,
    backgroundColor: "#EFF6FF",
  },
  filterText: {
    width: "100%",
    minWidth: 0,
    fontSize: 10,
    lineHeight: 14,
    color:
      colors.textSecondary,
    textAlign: "center",
    flexShrink: 1,
  },
  filterTextActive: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  list: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  row: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  rowTitle: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  rowMeta: {
    width: "100%",
    minWidth: 0,
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color:
      colors.textSecondary,
    flexShrink: 1,
  },
  rowDetail: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    flexShrink: 1,
  },
  rowUser: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    flexShrink: 1,
  },
  emptyState: {
    alignItems: "center",
    marginTop:
      spacing.xxxl,
    paddingHorizontal:
      spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    width: "100%",
    maxWidth: 300,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
    textAlign: "center",
  },
  errorBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.danger,
  },
  infoBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    marginLeft: spacing.sm,
    fontSize: 10,
    lineHeight: 17,
    color:
      colors.textSecondary,
    flexShrink: 1,
  },
});
