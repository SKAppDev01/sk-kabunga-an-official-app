import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
  FinanceSummary,
  getFinanceSummary,
} from "../../services/finance";
import {
  getCurrentSessionUser,
  SessionUser,
} from "../../services/session";
import { isYouthMemberRole } from "../../services/access";
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

export default function FinanceScreen() {
  const [currentUser, setCurrentUser] =
    useState<SessionUser | null>(null);
  const [summary, setSummary] =
    useState<FinanceSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadFinance() {
        try {
          setIsLoading(true);
          const user =
            await getCurrentSessionUser();

          if (!user) {
            router.replace("/login");
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

  function formatCurrency(value: number) {
    return `₱${value.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const youthMember =
    isYouthMemberRole(currentUser?.role);
  const canManage =
    Boolean(currentUser) && !youthMember;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Finance
        </Text>
        <Text style={styles.subtitle}>
          {youthMember
            ? "Financial information available to youth members"
            : "Budget and financial overview"}
        </Text>

        <Text style={styles.sectionTitle}>
          Financial Summary
        </Text>

        <View style={styles.primaryCard}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="wallet-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <Text style={styles.primaryLabel}>
            Total Budget Allocated
          </Text>
          <Text style={styles.primaryValue}>
            {isLoading
              ? "—"
              : formatCurrency(
                  summary.totalAllocated
                )}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.smallCard}>
            <View style={styles.smallCardHeader}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.smallLabel}>
                Expenses
              </Text>
            </View>
            <Text style={styles.smallValue}>
              {isLoading
                ? "—"
                : formatCurrency(
                    summary.totalExpenses
                  )}
            </Text>
          </View>

          <View style={styles.rowSpacer} />

          <View style={styles.smallCard}>
            <View style={styles.smallCardHeader}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={
                  summary.remainingBalance < 0
                    ? colors.danger
                    : colors.success
                }
              />
              <Text
                style={styles.smallLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                Remaining Budget
              </Text>
            </View>
            <Text
              style={[
                styles.smallValue,
                summary.remainingBalance < 0 &&
                  styles.negativeValue,
              ]}
            >
              {isLoading
                ? "—"
                : formatCurrency(
                    summary.remainingBalance
                  )}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.balanceDetailsButton,
            pressed &&
              styles.balanceDetailsButtonPressed,
          ]}
          onPress={() =>
            router.push("/budget-balance")
          }
        >
          <View style={styles.balanceDetailsLeft}>
            <Ionicons
              name="analytics-outline"
              size={19}
              color={colors.primary}
            />

            <Text
              style={styles.balanceDetailsText}
            >
              View Balance Details
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={18}
            color={colors.primary}
          />
        </Pressable>

        <Text style={styles.sectionTitle}>
          Records Overview
        </Text>

        <View style={styles.recordsCard}>
          {canManage && (
            <>
              <RecordRow
                icon="albums-outline"
                label="Budget Categories"
                value={summary.categoryCount}
                onPress={() =>
                  router.push("/budget-categories")
                }
              />
              <View style={styles.divider} />
            </>
          )}
          <RecordRow
            icon="pie-chart-outline"
            label="Budget Allocations"
            value={summary.allocationCount}
            onPress={() =>
              router.push("/budget-allocations")
            }
          />
          <View style={styles.divider} />
          <RecordRow
            icon="receipt-outline"
            label="Expense Records"
            value={summary.expenseCount}
            onPress={() =>
              router.push("/expenses")
            }
          />
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            {youthMember
              ? "Only budget allocations and expenses approved for youth-member viewing are shown here. Internal notes and receipt photos remain private."
              : "Finance is the source of truth for official budget and expense records. Project expenses linked to a project also appear in its Project Details."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.recordRow,
        pressed &&
          onPress &&
          styles.recordRowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.recordIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <Text style={styles.recordLabel}>
        {label}
      </Text>

      <Text style={styles.recordValue}>
        {value}
      </Text>

      {onPress && (
        <Ionicons
          name="chevron-forward-outline"
          size={19}
          color={colors.textMuted}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  primaryCard: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  primaryLabel: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  primaryValue: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  summaryRow: {
    flexDirection: "row",
    marginTop: spacing.md,
  },

  smallCard: {
    flex: 1,
    minHeight: 116,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  rowSpacer: {
    width: spacing.md,
  },

  smallCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  smallLabel: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  smallValue: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  negativeValue: {
    color: colors.danger,
  },

  balanceDetailsButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "rgba(37,99,235,0.06)",
  },

  balanceDetailsButtonPressed: {
    opacity: 0.7,
  },

  balanceDetailsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  balanceDetailsText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  recordsCard: {
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  recordRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
  },

  recordRowPressed: {
    opacity: 0.72,
  },

  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  recordLabel: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  recordValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  divider: {
    height: 1,
    marginLeft: 52,
    backgroundColor: colors.border,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: "rgba(37,99,235,0.06)",
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
