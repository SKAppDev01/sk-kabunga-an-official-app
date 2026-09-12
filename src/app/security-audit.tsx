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

import {
  getSecurityAuditOverview,
  SecurityAuditOverview,
} from "../services/security-audit";
import {
  colors,
  spacing,
  typography,
} from "../theme";

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

function formatAction(
  value: string
) {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function authorizationLabel(
  value: string
) {
  if (
    value ===
      "verified_official"
  ) {
    return "Verified Official";
  }

  if (value === "public") {
    return "Public / Youth";
  }

  return "Unverified";
}

export default function SecurityAuditScreen() {
  const [
    overview,
    setOverview,
  ] =
    useState<
      SecurityAuditOverview | null
    >(null);

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

          const result =
            await getSecurityAuditOverview();

          setOverview(result);
        } catch (loadError) {
          console.error(
            "Security & Audit loading error:",
            loadError
          );

          setError(
            String(loadError).includes(
              "NO_ACTIVE_ACCOUNT"
            )
              ? "No active local account was found."
              : "Unable to load security and audit information."
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

  const account =
    overview?.account;

  const traceability =
    overview?.traceability;

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
          Security & Audit
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

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Checking security...
          </Text>
        </View>
      ) : error ||
        !overview ||
        !account ||
        !traceability ? (
        <View style={styles.centerState}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.danger}
          />

          <Text
            style={styles.errorText}
          >
            {error ||
              "Security information unavailable."}
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
          <Text style={styles.title}>
            Local Protection
          </Text>

          <Text style={styles.subtitle}>
            Review the active account,
            authorization level and
            traceability of records stored
            on this device.
          </Text>

          <Text
            style={styles.sectionTitle}
          >
            Current Account
          </Text>

          <View style={styles.accountBox}>
            <View
              style={styles.accountIcon}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={colors.primary}
              />
            </View>

            <View style={styles.accountText}>
              <Text
                style={styles.accountName}
                numberOfLines={2}
              >
                {account.fullName ||
                  account.username}
              </Text>

              <Text
                style={styles.accountMeta}
              >
                {account.role ||
                  "No role"}
              </Text>

              <Text
                style={styles.accountMeta}
              >
                {authorizationLabel(
                  account.authorizationLevel
                )}
              </Text>
            </View>
          </View>

          <View style={styles.securityRows}>
            <View style={styles.securityRow}>
              <View
                style={styles.securityRowText}
              >
                <Text
                  style={styles.rowTitle}
                >
                  Password Protection
                </Text>
                <Text
                  style={styles.rowDescription}
                >
                  Local account sign-in
                  protection
                </Text>
              </View>

              <Text
                style={[
                  styles.statusValue,
                  account.passwordProtected &&
                    styles.goodValue,
                ]}
              >
                {account.passwordProtected
                  ? "Enabled"
                  : "Missing"}
              </Text>
            </View>

            <View style={styles.securityRow}>
              <View
                style={styles.securityRowText}
              >
                <Text
                  style={styles.rowTitle}
                >
                  Recovery Protection
                </Text>
                <Text
                  style={styles.rowDescription}
                >
                  Local recovery question
                  and answer
                </Text>
              </View>

              <Text
                style={[
                  styles.statusValue,
                  account.recoveryConfigured &&
                    styles.goodValue,
                ]}
              >
                {account.recoveryConfigured
                  ? "Configured"
                  : "Incomplete"}
              </Text>
            </View>

            <View style={styles.securityRow}>
              <View
                style={styles.securityRowText}
              >
                <Text
                  style={styles.rowTitle}
                >
                  User Role
                </Text>
                <Text
                  style={styles.rowDescription}
                >
                  Current local access role
                </Text>
              </View>

              <Text
                style={styles.statusValue}
                numberOfLines={2}
              >
                {account.role ||
                  "Not set"}
              </Text>
            </View>
          </View>

          <Text
            style={styles.sectionTitle}
          >
            Record Traceability
          </Text>

          <View style={styles.summaryBox}>
            <View style={styles.metric}>
              <Text
                style={styles.metricValue}
              >
                {traceability.totalRecords}
              </Text>
              <Text
                style={styles.metricLabel}
              >
                Tracked
              </Text>
            </View>

            <View
              style={styles.metricDivider}
            />

            <View style={styles.metric}>
              <Text
                style={styles.metricValue}
              >
                {
                  traceability.attributedRecords
                }
              </Text>
              <Text
                style={styles.metricLabel}
              >
                With Creator
              </Text>
            </View>

            <View
              style={styles.metricDivider}
            />

            <View style={styles.metric}>
              <Text
                style={[
                  styles.metricValue,
                  traceability
                    .unattributedRecords >
                    0 &&
                    styles.warningValue,
                ]}
              >
                {
                  traceability.unattributedRecords
                }
              </Text>
              <Text
                style={styles.metricLabel}
              >
                No Creator
              </Text>
            </View>
          </View>

          <View style={styles.moduleList}>
            {traceability.modules.map(
              (module, index) => (
                <View
                  key={module.key}
                  style={[
                    styles.moduleRow,
                    index <
                      traceability.modules
                        .length -
                        1 &&
                      styles.divider,
                  ]}
                >
                  <View
                    style={styles.moduleText}
                  >
                    <Text
                      style={styles.moduleTitle}
                    >
                      {module.label}
                    </Text>

                    <Text
                      style={styles.moduleMeta}
                    >
                      {module.attributed}
                      {" with creator • "}
                      {module.unattributed}
                      {" without"}
                    </Text>
                  </View>

                  <Text
                    style={styles.moduleTotal}
                  >
                    {module.total}
                  </Text>
                </View>
              )
            )}
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.infoText}>
              Core records already store
              created and last-edited
              timestamps. The next Phase 13
              step will expose creator and
              timestamp details directly on
              individual record screens.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text
              style={styles.sectionTitleInline}
            >
              Recent Audit Activity
            </Text>

            <Text
              style={styles.auditCount}
            >
              {
                overview.recentActivity
                  .length
              }
            </Text>
          </View>

          {overview.recentActivity
            .length === 0 ? (
            <View style={styles.emptyState}>
              <Text
                style={styles.emptyText}
              >
                No audit activity recorded
                yet.
              </Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {overview.recentActivity.map(
                (item) => (
                  <View
                    key={item.id}
                    style={styles.activityRow}
                  >
                    <View
                      style={styles.activityIcon}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={19}
                        color={colors.primary}
                      />
                    </View>

                    <View
                      style={styles.activityText}
                    >
                      <Text
                        style={styles.activityTitle}
                      >
                        {item.subject}
                      </Text>

                      <Text
                        style={styles.activityMeta}
                      >
                        {formatAction(
                          item.actionType
                        )}
                        {" • "}
                        {formatDateTime(
                          item.createdAt
                        )}
                      </Text>

                      {item.userName ||
                      item.userRole ? (
                        <Text
                          style={styles.activityUser}
                        >
                          {item.userName ||
                            "Local user"}
                          {item.userRole
                            ? ` • ${item.userRole}`
                            : ""}
                        </Text>
                      ) : null}

                      {item.detail ? (
                        <Text
                          style={styles.activityDetail}
                        >
                          {item.detail}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )
              )}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.historyButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.push(
                "/data-transfer-history"
              )
            }
          >
            <View
              style={styles.historyButtonText}
            >
              <Text
                style={styles.historyTitle}
              >
                Transfer History
              </Text>

              <Text
                style={styles.historyDescription}
              >
                {
                  overview.transferHistoryCount
                }
                {" recorded data-sharing event"}
                {overview.transferHistoryCount ===
                1
                  ? ""
                  : "s"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>

          <View style={styles.footerBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={colors.primary}
            />

            <Text style={styles.footerText}>
              Security and audit records stay
              local to the Android device.
              This screen does not transmit
              account or audit information
              online.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
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
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  stateText: {
    width: "100%",
    maxWidth: 280,
    minWidth: 0,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
    flexShrink: 1,
  },
  errorText: {
    width: "100%",
    maxWidth: 310,
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.danger,
    textAlign: "center",
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
  accountBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },
  accountIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  accountName: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    lineHeight: 21,
    color: colors.text,
  },
  accountMeta: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color:
      colors.textSecondary,
  },
  securityRows: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  securityRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  securityRowText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  rowTitle: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  rowDescription: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    flexShrink: 1,
  },
  statusValue: {
    width: 124,
    minWidth: 124,
    flexShrink: 0,
    paddingLeft: spacing.sm,
    fontSize: 10,
    lineHeight: 16,
    color:
      colors.textSecondary,
    textAlign: "right",
  },
  goodValue: {
    color: "#047857",
    fontWeight:
      typography.fontWeight.semibold,
  },
  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
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
  warningValue: {
    color: "#B45309",
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
  moduleList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  moduleRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  moduleText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
  },
  moduleTitle: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  moduleMeta: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    flexShrink: 1,
  },
  moduleTotal: {
    width: 52,
    minWidth: 52,
    flexShrink: 0,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "right",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitleInline: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  auditCount: {
    minWidth: 32,
    flexShrink: 0,
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: "right",
  },
  activityList: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  activityRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  activityIcon: {
    width: 36,
    paddingTop: 1,
  },
  activityText: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    lineHeight: 19,
    color: colors.text,
  },
  activityMeta: {
    width: "100%",
    minWidth: 0,
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color:
      colors.textSecondary,
  },
  activityUser: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
  },
  activityDetail: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    width: "100%",
    maxWidth: 300,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
  },
  historyButton: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  historyButtonText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  historyTitle: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  historyDescription: {
    width: "100%",
    minWidth: 0,
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
  },
  footerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
  },
  footerText: {
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
    opacity: 0.65,
  },
});
