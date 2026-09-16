import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import { useCallback, useState } from "react";
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

import { CivicBackground } from "../components/CivicBackground";
import {
  getOrCreatePersonalProfile,
  isProfileQrReady,
  PersonalProfile,
} from "../services/personal-profile";
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

export default function ProfileScreen() {
  const [user, setUser] =
    useState<SessionUser | null>(null);
  const [profile, setProfile] =
    useState<PersonalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        try {
          setLoading(true);

          const currentUser =
            await getCurrentSessionUser();

          if (!active) return;

          if (!currentUser) {
            router.replace("/login");
            return;
          }

          const personalProfile =
            await getOrCreatePersonalProfile(
              currentUser
            );

          if (!active) return;

          setUser(currentUser);
          setProfile(personalProfile);
        } catch (error) {
          console.error(
            "Profile loading error:",
            error
          );

          if (active) {
            Alert.alert(
              "Profile Error",
              "Unable to load your profile. Please try again."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  const profileReady =
    profile ? isProfileQrReady(profile) : false;

  function handleLogout() {
    Alert.alert(
      "Log out of SK Local?",
      "You will return to the login screen.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await clearSession();
              router.replace("/login");
            } catch (error) {
              console.error(
                "Profile logout error:",
                error
              );

              Alert.alert(
                "Logout Error",
                "Unable to log out. Please try again."
              );
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.background}>
      <CivicBackground />

      <SafeAreaView
        style={styles.safeArea}
      edges={["left", "right", "bottom"]}
      >
        <AppHeader
          title="My Profile"
          showBack
        />
        

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Ionicons
                name="person-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text style={styles.name}>
              {profile?.fullName ||
                user?.fullName ||
                user?.username ||
                "SK User"}
            </Text>

            <Text style={styles.username}>
              @{user?.username || ""}
            </Text>

            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
                {user?.role || "SK Official"}
              </Text>
            </View>

            {!loading ? (
              <View
                style={[
                  styles.profileStatus,
                  profileReady
                    ? styles.profileStatusReady
                    : styles.profileStatusIncomplete,
                ]}
              >
                <Ionicons
                  name={
                    profileReady
                      ? "checkmark-circle-outline"
                      : "alert-circle-outline"
                  }
                  size={16}
                  color={
                    profileReady
                      ? "#15803D"
                      : "#B45309"
                  }
                />

                <Text
                  style={[
                    styles.profileStatusText,
                    profileReady
                      ? styles.profileStatusTextReady
                      : styles.profileStatusTextIncomplete,
                  ]}
                >
                  {profileReady
                    ? "QR profile ready"
                    : "Complete your profile to enable QR services"}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>
            Profile Services
          </Text>

          <ActionRow
            icon="qr-code-outline"
            title="My QR Code"
            subtitle="For attendance and easy Youth Registration"
            onPress={() =>
              router.push("/profile-qr")
            }
          />

          <ActionRow
            icon="create-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() =>
              router.push("/edit-profile")
            }
          />

          <View style={styles.privacyCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={colors.primary}
            />

            <View style={styles.privacyTextBlock}>
              <Text style={styles.privacyTitle}>
                Offline & private
              </Text>

              <Text style={styles.privacyText}>
                Your account credentials and recovery information are never stored in your profile QR code.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={21}
              color="#C62828"
            />

            <Text style={styles.logoutText}>
              Log Out
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: "qr-code-outline" | "create-outline";
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={23}
          color={colors.primary}
        />
      </View>

      <View style={styles.actionTextBlock}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>
        <Text style={styles.actionSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.88)",
  },



  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  identityCard: {
    alignItems: "center",
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.26)",
    backgroundColor: colors.white,
    elevation: 4,
  },

  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    backgroundColor: "rgba(37,99,235,0.09)",
  },

  name: {
    textAlign: "center",
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  username: {
    alignSelf: "stretch",
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },

  rolePill: {
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  roleText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },

  profileStatus: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },

  profileStatusReady: {
    backgroundColor: "rgba(21,128,61,0.08)",
  },

  profileStatusIncomplete: {
    backgroundColor: "rgba(180,83,9,0.08)",
  },

  profileStatusText: {
    flexShrink: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },

  profileStatusTextReady: {
    color: "#15803D",
  },

  profileStatusTextIncomplete: {
    color: "#B45309",
  },

  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  actionRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.26)",
    backgroundColor: colors.white,
    elevation: 2,
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  actionTextBlock: {
    flex: 1,
  },

  actionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  actionSubtitle: {
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  privacyCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
  },

  privacyTextBlock: {
    flex: 1,
  },

  privacyTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  privacyText: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  logoutButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198,40,40,0.24)",
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  logoutText: {
    color: "#C62828",
    fontWeight: typography.fontWeight.semibold,
  },

  pressed: {
    opacity: 0.74,
  },
});
