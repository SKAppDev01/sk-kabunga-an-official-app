import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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

import { AppHeader } from "../components/AppHeader";

import {
    deleteLocalAccount,
    getAllLocalAccounts,
    LocalAccount,
} from "../services/auth";

import {
    clearSession,
    getCurrentSessionUser,
    SessionUser,
} from "../services/session";

import {
    colors,
    spacing,
    typography,
} from "../theme";

export default function DashboardScreen() {
  const [accounts, setAccounts] =
    useState<LocalAccount[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<SessionUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  async function loadDashboard() {
    try {
      setIsLoading(true);

      const [
        users,
        sessionUser,
      ] = await Promise.all([
        getAllLocalAccounts(),
        getCurrentSessionUser(),
      ]);

      setAccounts(users);
      setCurrentUser(sessionUser);

      if (!sessionUser) {
        router.replace("/login");
      }
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
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

      Alert.alert(
        "Sign Out Failed",
        "Unable to sign out. Please try again."
      );
    }
  }

  function handleDeleteAccount(
    account: LocalAccount
  ) {
    const deletingCurrentAccount =
      currentUser?.id === account.id;

    Alert.alert(
      "Delete Account",
      deletingCurrentAccount
        ? `You are about to permanently delete your own account "${account.username}". You will be signed out immediately.`
        : `Are you sure you want to permanently delete "${account.username}"?`,
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
              await deleteLocalAccount(
                account.id
              );

              if (
                deletingCurrentAccount
              ) {
                await clearSession();

                router.replace(
                  "/login"
                );

                return;
              }

              setAccounts(
                (currentAccounts) =>
                  currentAccounts.filter(
                    (item) =>
                      item.id !==
                      account.id
                  )
              );

              Alert.alert(
                "Account Deleted",
                `${account.username} was deleted successfully.`
              );
            } catch (error) {
              console.error(
                "Delete account error:",
                error
              );

              Alert.alert(
                "Delete Failed",
                "The account could not be deleted."
              );
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Dashboard"
        showBack
      />
      <View style={styles.container}>
        {/* Header */}
        

        {/* Signed-in Account */}
        {currentUser && (
          <View
            style={
              styles.currentUserCard
            }
          >
            <View
              style={
                styles.currentUserIcon
              }
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={colors.primary}
              />
            </View>

            <View
              style={
                styles.currentUserInfo
              }
            >
              <Text
                style={
                  styles.currentUserLabel
                }
              >
                Signed in as
              </Text>

              <Text
                style={
                  styles.currentUserName
                }
              >
                {currentUser.fullName ||
                  currentUser.username}
              </Text>

              <Text
                style={
                  styles.currentUserRole
                }
              >
                {currentUser.role ||
                  "Role not assigned"}
              </Text>
            </View>
          </View>
        )}

        {/* Account Count */}
        <View style={styles.summaryCard}>
          <View
            style={styles.summaryIcon}
          >
            <Ionicons
              name="people-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View>
            <Text
              style={
                styles.summaryNumber
              }
            >
              {accounts.length}
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Registered Accounts
            </Text>
          </View>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          Accounts on this device
        </Text>

        <ScrollView
          style={styles.accountList}
          contentContainerStyle={
            styles.accountListContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          {isLoading ? (
            <Text style={styles.emptyText}>
              Loading accounts...
            </Text>
          ) : accounts.length === 0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Ionicons
                name="people-outline"
                size={42}
                color={colors.textMuted}
              />

              <Text
                style={styles.emptyTitle}
              >
                No accounts found
              </Text>

              <Text
                style={styles.emptyText}
              >
                There are no local accounts
                stored on this device.
              </Text>
            </View>
          ) : (
            accounts.map((account) => {
              const isCurrentUser =
                currentUser?.id ===
                account.id;

              return (
                <View
                  key={account.id}
                  style={[
                    styles.accountCard,
                    isCurrentUser &&
                      styles.currentAccountCard,
                  ]}
                >
                  <View
                    style={
                      styles.accountLeft
                    }
                  >
                    <View
                      style={
                        styles.avatar
                      }
                    >
                      <Text
                        style={
                          styles.avatarText
                        }
                      >
                        {account.username
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.accountInfo
                      }
                    >
                      <View
                        style={
                          styles.usernameRow
                        }
                      >
                        <Text
                          style={
                            styles.username
                          }
                        >
                          {
                            account.username
                          }
                        </Text>

                        {isCurrentUser && (
                          <View
                            style={
                              styles.youBadge
                            }
                          >
                            <Text
                              style={
                                styles.youBadgeText
                              }
                            >
                              You
                            </Text>
                          </View>
                        )}
                      </View>

                      {account.fullName && (
                        <Text
                          style={
                            styles.fullName
                          }
                        >
                          {account.fullName}
                        </Text>
                      )}

                      <Text
                        style={
                          styles.accountDetail
                        }
                      >
                        {account.role ||
                          "Role not assigned"}
                      </Text>

                      <Text
                        style={
                          styles.createdAt
                        }
                      >
                        Created:{" "}
                        {account.createdAt}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed &&
                        styles.deleteButtonPressed,
                    ]}
                    onPress={() =>
                      handleDeleteAccount(
                        account
                      )
                    }
                    hitSlop={6}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },

  container: {
    backgroundColor: "#E3F2FD",
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  header: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  headerText: {
    flex: 1,
    marginRight: spacing.md,
  },

  title: {
    fontSize:
      typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.sm,
    color: colors.textSecondary,
  },

  signOutButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },

  currentUserCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor:
      "rgba(37,99,235,0.05)",
    marginBottom: spacing.md,
  },

  currentUserIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.10)",
  },

  currentUserInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  currentUserLabel: {
    fontSize:
      typography.fontSize.xs,
    color: colors.textSecondary,
  },

  currentUserName: {
    marginTop: 2,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  currentUserRole: {
    marginTop: 2,
    fontSize:
      typography.fontSize.sm,
    color: colors.primary,
  },

  summaryCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },

  summaryNumber: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  summaryLabel: {
    marginTop: 2,
    fontSize:
      typography.fontSize.sm,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  accountList: {
    flex: 1,
  },

  accountListContent: {
    paddingBottom: spacing.xxl,
  },

  accountCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },

  currentAccountCard: {
    borderColor: colors.primary,
  },

  accountLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  avatarText: {
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.white,
  },

  accountInfo: {
    flex: 1,
  },

  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  username: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  youBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor:
      "rgba(37,99,235,0.10)",
  },

  youBadgeText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  fullName: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },

  accountDetail: {
    marginTop: 2,
    fontSize:
      typography.fontSize.sm,
    color: colors.textSecondary,
  },

  createdAt: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },

  deleteButtonPressed: {
    opacity: 0.5,
  },

  buttonPressed: {
    opacity: 0.65,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: spacing.xxxl,
  },

  emptyTitle: {
    marginTop: spacing.md,
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  emptyText: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
});