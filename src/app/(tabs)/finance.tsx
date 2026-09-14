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

import { CivicBackground } from "../../components/CivicBackground";

import {
  FinanceSummary,
  getFinanceSummary,
} from "../../services/finance";
import {
  getCurrentSessionUser,
  SessionUser,
} from "../../services/session";
import {
  isYouthMemberRole,
} from "../../services/access";
import {
  colors,
  spacing,
  typography,
} from "../../theme";

const EMPTY_SUMMARY: FinanceSummary = {
  totalAllocated: 0,
  totalExpenses: 0,
  remainingBalance: 0,
  categoryCount: 0,
  allocationCount: 0,
  expenseCount: 0,
};

function formatCurrency(
  value: number
) {
  return `₱${value.toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export default function FinanceScreen() {
  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<SessionUser | null>(
      null
    );

  const [summary, setSummary] =
    useState<FinanceSummary>(
      EMPTY_SUMMARY
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadFinance() {
        try {
          setIsLoading(true);

          const user =
            await getCurrentSessionUser();

          if (!user) {
            router.replace(
              "/login"
            );
            return;
          }

          const result =
            await getFinanceSummary();

          if (active) {
            setCurrentUser(user);
            setSummary(result);
          }
        } catch (error) {
          console.error(
            "Finance dashboard error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadFinance();

      return () => {
        active = false;
      };
    }, [])
  );

  const youthMember =
    isYouthMemberRole(
      currentUser?.role
    );

  const canManage =
    Boolean(currentUser) &&
    !youthMember;

  const utilizationPercent =
    summary.totalAllocated > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (summary.totalExpenses /
              summary.totalAllocated) *
              100
          )
        )
      : 0;

  return (
    <View style={styles.background}>
      <CivicBackground />

      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.title}>
          Finance
        </Text>

        <View style={styles.flagAccent}>
          <View
            style={[
              styles.flagAccentSection,
              styles.flagAccentBlue,
            ]}
          />

          <View
            style={[
              styles.flagAccentSection,
              styles.flagAccentGold,
            ]}
          />

          <View
            style={[
              styles.flagAccentSection,
              styles.flagAccentRed,
            ]}
          />
        </View>

        <Text style={styles.subtitle}>
          {youthMember
            ? "Public budget and expense information"
            : "Manage SK budget and expenses"}
        </Text>

        <View
          style={styles.overviewCard}
        >
          <View
            style={
              styles.overviewHeader
            }
          >
            <Text
              style={
                styles.overviewTitle
              }
            >
              Budget Overview
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.detailsLink,
                pressed &&
                  styles.pressed,
              ]}
              onPress={() =>
                router.push(
                  "/budget-balance"
                )
              }
            >
              <Text
                style={
                  styles.detailsLinkText
                }
              >
                Details
              </Text>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </Pressable>
          </View>

          <View
            style={
              styles.overviewMetrics
            }
          >
            <Metric
              label="Allocated"
              value={
                isLoading
                  ? "—"
                  : formatCurrency(
                      summary.totalAllocated
                    )
              }
            />

            <View
              style={
                styles.metricDivider
              }
            />

            <Metric
              label="Expenses"
              value={
                isLoading
                  ? "—"
                  : formatCurrency(
                      summary.totalExpenses
                    )
              }
            />

            <View
              style={
                styles.metricDivider
              }
            />

            <Metric
              label="Remaining"
              value={
                isLoading
                  ? "—"
                  : formatCurrency(
                      summary.remainingBalance
                    )
              }
              positive={
                summary.remainingBalance >=
                0
              }
            />
          </View>

          <View
            style={
              styles.utilizationHeader
            }
          >
            <Text
              style={
                styles.utilizationLabel
              }
            >
              Budget utilization
            </Text>

            <Text
              style={
                styles.utilizationValue
              }
            >
              {isLoading
                ? "—"
                : `${utilizationPercent.toFixed(
                    1
                  )}%`}
            </Text>
          </View>

          <View
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    `${utilizationPercent}%`,
                },
              ]}
            />
          </View>
        </View>

        {canManage ? (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Quick Actions
            </Text>

            <View
              style={
                styles.quickActions
              }
            >
              <QuickAction
                icon="add-circle-outline"
                label="Add Expense"
                onPress={() =>
                  router.push(
                    "/add-expense"
                  )
                }
              />

              <View
                style={
                  styles.actionSpacer
                }
              />

              <QuickAction
                icon="wallet-outline"
                label="Add Allocation"
                onPress={() =>
                  router.push(
                    "/add-budget-allocation"
                  )
                }
              />
            </View>
          </>
        ) : null}

        <Text
          style={styles.sectionTitle}
        >
          Finance Records
        </Text>

        <View style={styles.recordsList}>
          {canManage ? (
            <>
              <RecordRow
                icon="albums-outline"
                label="Budget Categories"
                value={
                  summary.categoryCount
                }
                onPress={() =>
                  router.push(
                    "/budget-categories"
                  )
                }
              />

              <View
                style={styles.divider}
              />
            </>
          ) : null}

          <RecordRow
            icon="pie-chart-outline"
            label="Budget Allocations"
            value={
              summary.allocationCount
            }
            onPress={() =>
              router.push(
                "/budget-allocations"
              )
            }
          />

          <View
            style={styles.divider}
          />

          <RecordRow
            icon="receipt-outline"
            label="Expense Records"
            value={
              summary.expenseCount
            }
            onPress={() =>
              router.push(
                "/expenses"
              )
            }
          />
        </View>

        {youthMember ? (
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />

            <Text
              style={styles.infoText}
            >
              Only records approved for
              youth-member viewing are
              shown. Internal notes and
              receipt photos remain private.
            </Text>
          </View>
        ) : null}
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.metricValue,
          positive === true &&
            styles.positiveValue,
          positive === false &&
            styles.negativeValue,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
      >
        {value}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon:
    | "add-circle-outline"
    | "wallet-outline";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickAction,
        pressed &&
          styles.pressed,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={colors.primary}
      />

      <Text
        style={
          styles.quickActionLabel
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RecordRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon:
    | "albums-outline"
    | "pie-chart-outline"
    | "receipt-outline";
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.recordRow,
        pressed &&
          styles.pressed,
      ]}
      onPress={onPress}
    >
      <View
        style={styles.recordIcon}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <Text
        style={styles.recordLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.recordValue}
      >
        {value}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingHorizontal:
      spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom:
      spacing.xxxl +
      spacing.xl,
  },

  title: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.xxl,
    lineHeight: 36,
    fontWeight:
      typography.fontWeight.bold,
    color: "#0038A8",
    flexShrink: 1,
  },

  flagAccent: {
    width: 104,
    height: 4,
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
  },

  flagAccentSection: {
    height: "100%",
  },

  flagAccentBlue: {
    flex: 5,
    backgroundColor: "#0038A8",
  },

  flagAccentGold: {
    flex: 1,
    backgroundColor: "#FCD116",
  },

  flagAccentRed: {
    flex: 5,
    backgroundColor: "#CE1126",
  },

  subtitle: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
  },

  overviewCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor:
      colors.white,
  
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },

  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  overviewTitle: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  detailsLink: {
    minHeight: 34,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  detailsLinkText: {
    fontSize:
      typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  overviewMetrics: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: spacing.lg,
  },

  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 2,
  },

  metricDivider: {
    width: 1,
    marginHorizontal:
      spacing.xs,
    backgroundColor:
      colors.border,
  },

  metricLabel: {
    width: "100%",
    minWidth: 0,
    fontSize: 9,
    lineHeight: 14,
    color: colors.textMuted,
    textAlign: "center",
  },

  metricValue: {
    width: "100%",
    minWidth: 0,
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  positiveValue: {
    color: colors.success,
  },

  negativeValue: {
    color: colors.danger,
  },

  utilizationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },

  utilizationLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 16,
    color:
      colors.textSecondary,
  },

  utilizationValue: {
    minWidth: 52,
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 16,
    fontWeight:
      typography.fontWeight.semibold,
    color:
      colors.textSecondary,
    textAlign: "right",
  },

  progressTrack: {
    height: 9,
    marginTop: spacing.xs,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor:
      colors.border,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor:
      colors.primary,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  quickActions: {
    flexDirection: "row",
  },

  quickAction: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor:
      colors.white,
  
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },

  quickActionLabel: {
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize: 11,
    lineHeight: 17,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
    flexShrink: 1,
  },

  actionSpacer: {
    width: spacing.sm,
  },

  recordsList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  recordRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical:
      spacing.sm,
  },

  recordIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor:
      "#EFF6FF",
  },

  recordLabel: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },

  recordValue: {
    minWidth: 32,
    flexShrink: 0,
    marginRight: spacing.xs,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "right",
  },

  divider: {
    height: 1,
    marginLeft: 54,
    backgroundColor:
      colors.border,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  infoText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },

  pressed: {
    opacity: 0.68,
  },
});
