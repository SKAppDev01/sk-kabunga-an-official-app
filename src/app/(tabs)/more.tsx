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

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          const currentUser =
            await getCurrentSessionUser();

          if (active) {
            setUser(currentUser);
          }
        } catch (error) {
          console.error(
            "More screen loading error:",
            error
          );
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [])
  );

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
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.title}>
          More
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
            <Text
              style={styles.fullName}
              numberOfLines={2}
            >
              {user?.fullName ||
                user?.username ||
                "SK User"}
            </Text>

            <Text
              style={styles.username}
              numberOfLines={1}
            >
              @{user?.username || ""}
            </Text>

            <Text
              style={styles.role}
              numberOfLines={2}
            >
              {user?.role ||
                "Role not assigned"}
            </Text>
          </View>
        </View>

        <SettingsSection
          title="Data & Sharing"
          icon="swap-horizontal-outline"
          rowTitle="Data Management"
          description="Export, import, backup and restore offline data"
          onPress={() =>
            router.push(
              "/data-management"
            )
          }
        />

        <SettingsSection
          title="Security & Audit"
          icon="shield-checkmark-outline"
          rowTitle="Security & Audit"
          description="Account protection, access level and record traceability"
          onPress={() =>
            router.push(
              "/security-audit"
            )
          }
        />

        <SettingsSection
          title="App Settings"
          icon="settings-outline"
          rowTitle="Application Settings"
          description="App preferences, storage shortcuts and information"
          onPress={() =>
            router.push(
              "/app-settings"
            )
          }
        />


      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SettingsSection({
  title,
  icon,
  rowTitle,
  description,
  onPress,
}: {
  title: string;
  icon:
    | "swap-horizontal-outline"
    | "shield-checkmark-outline"
    | "settings-outline";
  rowTitle: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.settingsSection}>
      <Text
        style={
          styles.settingsSectionTitle
        }
      >
        {title}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.settingsRow,
          pressed &&
            styles.pressed,
        ]}
        onPress={onPress}
      >
        <View
          style={styles.settingsIcon}
        >
          <Ionicons
            name={icon}
            size={23}
            color={colors.primary}
          />
        </View>

        <View
          style={styles.settingsText}
        >
          <Text
            style={styles.settingsTitle}
          >
            {rowTitle}
          </Text>

          <Text
            style={
              styles.settingsDescription
            }
          >
            {description}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={colors.textMuted}
        />
      </Pressable>
    </View>
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

  container: {
    flexGrow: 1,
    paddingHorizontal:
      spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    backgroundColor:
      colors.border,
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
    flexShrink: 1,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
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

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  fullName: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.md,
    lineHeight: 22,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    flexShrink: 1,
  },

  username: {
    width: "100%",
    minWidth: 0,
    marginTop: 2,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
  },

  role: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.primary,
    flexShrink: 1,
  },

  settingsSection: {
    marginTop: spacing.xl,
  },

  settingsSectionTitle: {
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.lg,
    lineHeight: 26,
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
    flexShrink: 0,
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

  settingsDescription: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
    flexShrink: 1,
  },


  pressed: {
    opacity: 0.65,
  },
});
