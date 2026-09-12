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
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteLocalAccount,
  getAllLocalAccounts,
  LocalAccount,
} from "../../services/auth";
import {
  clearSession,
  getCurrentSessionUser,
  SessionUser,
} from "../../services/session";
import {
  colors,
  spacing,
  typography,
} from "../../theme";

export default function MoreScreen() {
  const [user, setUser] =
    useState<SessionUser | null>(null);
  const [accounts, setAccounts] =
    useState<LocalAccount[]>([]);
  const [isDeleting, setIsDeleting] =
    useState<string | null>(null);

  const loadData = useCallback(
    async () => {
      try {
        const [
          currentUser,
          registeredAccounts,
        ] = await Promise.all([
          getCurrentSessionUser(),
          getAllLocalAccounts(),
        ]);

        setUser(currentUser);
        setAccounts(registeredAccounts);
      } catch (error) {
        console.error(
          "More screen loading error:",
          error
        );
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        try {
          const [
            currentUser,
            registeredAccounts,
          ] = await Promise.all([
            getCurrentSessionUser(),
            getAllLocalAccounts(),
          ]);

          if (active) {
            setUser(currentUser);
            setAccounts(
              registeredAccounts
            );
          }
        } catch (error) {
          console.error(
            "More screen loading error:",
            error
          );
        }
      }

      run();

      return () => {
        active = false;
      };
    }, [])
  );

  async function handleSignOut() {
    try {
      await clearSession();
      router.replace("/login");
    } catch (error) {
      console.error(
        "Sign out error:",
        error
      );
    }
  }

  function handleDeleteAccount(
    account: LocalAccount
  ) {
    if (account.id === user?.id) {
      Alert.alert(
        "Current Account",
        "You cannot delete the account that is currently signed in."
      );
      return;
    }

    Alert.alert(
      "Delete Registered User?",
      `Delete @${account.username} from this device? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(
                account.id
              );

              await deleteLocalAccount(
                account.id
              );

              await loadData();
            } catch (error) {
              console.error(
                "Delete local account error:",
                error
              );

              Alert.alert(
                "Delete Failed",
                "Unable to delete this registered user."
              );
            } finally {
              setIsDeleting(null);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.title}>
          More
        </Text>

        <Text style={styles.subtitle}>
          Account and application settings
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={26}
              color={colors.primary}
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.fullName}>
              {user?.fullName ||
                user?.username ||
                "SK User"}
            </Text>

            <Text style={styles.username}>
              @{user?.username || ""}
            </Text>

            <Text style={styles.role}>
              {user?.role ||
                "Role not assigned"}
            </Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>
            Data & Sharing
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingsRow,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.push(
                "/data-management"
              )
            }
          >
            <View style={styles.settingsIcon}>
              <Ionicons
                name="swap-horizontal-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingsText}>
              <Text
                style={styles.settingsTitle}
              >
                Data Management
              </Text>

              <Text
                style={styles.settingsDescription}
              >
                Export, import, backup and restore offline data
              </Text>
            </View>

            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>
            Security & Audit
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingsRow,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.push(
                "/security-audit"
              )
            }
          >
            <View style={styles.settingsIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingsText}>
              <Text
                style={styles.settingsTitle}
              >
                Security & Audit
              </Text>

              <Text
                style={styles.settingsDescription}
              >
                Account protection, access level and record traceability
              </Text>
            </View>

            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Registered Users
            </Text>

            <Text
              style={
                styles.temporaryText
              }
            >
              Temporary device account viewer
            </Text>
          </View>

          <Text style={styles.accountCount}>
            {accounts.length}
          </Text>
        </View>

        <View style={styles.usersList}>
          {accounts.length === 0 ? (
            <Text style={styles.emptyText}>
              No registered users found.
            </Text>
          ) : (
            accounts.map(
              (account, index) => {
                const isCurrent =
                  account.id === user?.id;
                const deleting =
                  isDeleting === account.id;

                return (
                  <View
                    key={account.id}
                    style={[
                      styles.userRow,
                      index <
                        accounts.length - 1 &&
                        styles.userRowBorder,
                    ]}
                  >
                    <View
                      style={
                        styles.userIcon
                      }
                    >
                      <Ionicons
                        name={
                          isCurrent
                            ? "person-circle-outline"
                            : "person-outline"
                        }
                        size={23}
                        color={
                          isCurrent
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.userInfo
                      }
                    >
                      <View
                        style={
                          styles.userNameRow
                        }
                      >
                        <Text
                          style={
                            styles.userName
                          }
                          numberOfLines={1}
                        >
                          {account.fullName ||
                            account.username}
                        </Text>

                        {isCurrent && (
                          <Text
                            style={
                              styles.currentBadge
                            }
                          >
                            Current
                          </Text>
                        )}
                      </View>

                      <Text
                        style={
                          styles.userUsername
                        }
                        numberOfLines={1}
                      >
                        @{account.username}
                      </Text>

                      <Text
                        style={
                          styles.userRole
                        }
                        numberOfLines={1}
                      >
                        {account.role ||
                          "Role not assigned"}
                      </Text>
                    </View>

                    {!isCurrent && (
                      <Pressable
                        style={({
                          pressed,
                        }) => [
                          styles.deleteButton,
                          pressed &&
                            styles.pressed,
                          deleting &&
                            styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleDeleteAccount(
                            account
                          )
                        }
                        disabled={deleting}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={21}
                          color={
                            colors.danger
                          }
                        />

                        <Text
                          style={
                            styles.deleteText
                          }
                        >
                          {deleting
                            ? "Deleting..."
                            : "Delete"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              }
            )
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed &&
              styles.pressed,
          ]}
          onPress={handleSignOut}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color={colors.danger}
          />

          <Text
            style={styles.signOutText}
          >
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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

  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  fullName: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  username: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  role: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.primary,
  },

  settingsSection: {
    marginTop: spacing.xl,
  },

  settingsSectionTitle: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  settingsRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  settingsIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  settingsText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },

  settingsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  settingsDescription: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xxxl,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  temporaryText: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  accountCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },

  usersList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  userRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  userRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  userIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },

  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  userName: {
    flexShrink: 1,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  currentBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  userUsername: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  userRole: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },

  deleteText: {
    marginLeft: 4,
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.danger,
  },

  emptyText: {
    paddingVertical: spacing.xl,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },

  signOutButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
  },

  signOutText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.danger,
  },

  pressed: {
    opacity: 0.65,
  },

  disabledButton: {
    opacity: 0.45,
  },
});
