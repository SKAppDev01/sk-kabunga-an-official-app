import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  OfficialRole,
  OFFICIAL_ROLES,
} from "../services/authorization";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function OfficialVerificationScreen() {
  const params =
    useLocalSearchParams<{
      userId?: string;
      username?: string;
      fullName?: string;
    }>();

  const userId =
    typeof params.userId === "string"
      ? params.userId
      : "";

  const username =
    typeof params.username === "string"
      ? params.username
      : "";

  const fullName =
    typeof params.fullName === "string"
      ? params.fullName
      : "";

  const [
    selectedRole,
    setSelectedRole,
  ] = useState<OfficialRole | "">("");

  const [
    showPositions,
    setShowPositions,
  ] = useState(false);

  const [roleError, setRoleError] =
    useState("");

  function continueFoundingSetup() {
    if (!selectedRole) {
      setRoleError(
        "Please select your actual SK position first."
      );
      return;
    }

    router.push({
      pathname:
        "/founding-official-setup",
      params: {
        userId,
        username,
        fullName,
        selectedRole,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.replace({
              pathname: "/profile-setup",
              params: {
                userId,
                username,
              },
            })
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Official Verification
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.shieldIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={44}
            color={colors.primary}
          />
        </View>

        <Text style={styles.title}>
          SK Official access requires verification
        </Text>

        <Text style={styles.description}>
          Select your real SK position, then verify
          your account using trusted authorization.
        </Text>

        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>
            Account
          </Text>

          <Text style={styles.accountValue}>
            {fullName ||
              username ||
              "Local account"}
          </Text>

          {username ? (
            <Text style={styles.username}>
              @{username}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>
          First official deployment
        </Text>

        <Text style={styles.fieldLabel}>
          SK Position
        </Text>

        <Pressable
          style={[
            styles.positionSelector,
            roleError
              ? styles.positionSelectorError
              : null,
          ]}
          onPress={() => {
            setShowPositions(
              (current) => !current
            );
            setRoleError("");
          }}
        >
          <View style={styles.positionLeft}>
            <Ionicons
              name="briefcase-outline"
              size={21}
              color={
                selectedRole
                  ? colors.primary
                  : colors.textMuted
              }
            />

            <Text
              style={[
                styles.positionText,
                !selectedRole &&
                  styles.placeholderText,
              ]}
            >
              {selectedRole ||
                "Select your SK position"}
            </Text>
          </View>

          <Ionicons
            name={
              showPositions
                ? "chevron-up-outline"
                : "chevron-down-outline"
            }
            size={21}
            color={colors.textSecondary}
          />
        </Pressable>

        {showPositions ? (
          <View style={styles.positionMenu}>
            {OFFICIAL_ROLES.map(
              (role, index) => (
                <Pressable
                  key={role}
                  style={[
                    styles.positionOption,
                    index <
                      OFFICIAL_ROLES.length -
                        1
                      ? styles.positionOptionBorder
                      : null,
                    selectedRole === role
                      ? styles.positionOptionSelected
                      : null,
                  ]}
                  onPress={() => {
                    setSelectedRole(role);
                    setShowPositions(false);
                    setRoleError("");
                  }}
                >
                  <Text
                    style={[
                      styles.positionOptionText,
                      selectedRole === role
                        ? styles.positionOptionTextSelected
                        : null,
                    ]}
                    numberOfLines={1}
                  >
                    {role}
                  </Text>

                  <View
                    style={styles.optionCheckSlot}
                  >
                    {selectedRole === role ? (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    ) : null}
                  </View>
                </Pressable>
              )
            )}
          </View>
        ) : null}

        {roleError ? (
          <Text style={styles.errorText}>
            {roleError}
          </Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.actionRow,
            pressed && styles.pressed,
          ]}
          onPress={continueFoundingSetup}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="qr-code-outline"
              size={25}
              color={colors.primary}
            />
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>
              Verify as Founding Official
            </Text>

            <Text style={styles.actionDescription}>
              Use the private Founding Official QR
              supplied during deployment. After
              verification, the selected position is
              assigned to this account.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={21}
            color={colors.textMuted}
          />
        </Pressable>

        <Text style={styles.sectionTitle}>
          Other SK officials
        </Text>

        <View style={styles.pendingRow}>
          <View style={styles.actionIcon}>
            <Ionicons
              name="people-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>
              Official Authorization QR
            </Text>

            <Text style={styles.actionDescription}>
              After the first trusted official is
              established, that founding official can
              authorize the remaining Chairperson,
              Secretary, Treasurer, or Kagawad accounts.
              We will build this as the next security step.
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            The first trusted user does not have to be
            the Chairperson. It may be the Secretary,
            Treasurer, Kagawad, or Chairperson who is
            present during the initial app deployment.
          </Text>
        </View>
      </ScrollView>
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

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  shieldIcon: {
    width: 78,
    height: 78,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  title: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  description: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },

  accountRow: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  accountLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  accountValue: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  username: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  sectionTitle: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  fieldLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  positionSelector: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  positionSelectorError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },

  positionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm,
  },

  positionText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  placeholderText: {
    color: colors.textMuted,
  },

  positionMenu: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
  },

  positionOption: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },

  positionOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  positionOptionSelected: {
    backgroundColor:
      "rgba(37,99,235,0.06)",
  },

  positionOptionText: {
    flex: 1,
    marginRight: spacing.md,
    paddingRight: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    includeFontPadding: true,
  },

  optionCheckSlot: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  positionOptionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },

  actionRow: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  pendingRow: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    opacity: 0.68,
  },

  actionIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    flex: 1,
    marginHorizontal: spacing.md,
  },

  actionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  actionDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xxxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  pressed: {
    opacity: 0.65,
  },
});
