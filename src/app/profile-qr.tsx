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

import { CivicBackground } from "../components/CivicBackground";
import { ProfileQRCode } from "../components/ProfileQRCode";
import {
  buildProfileQrPayload,
  getOrCreatePersonalProfile,
  isProfileQrReady,
  PersonalProfile,
} from "../services/personal-profile";
import {
  getCurrentSessionUser,
  SessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ProfileQrScreen() {
  const [user, setUser] =
    useState<SessionUser | null>(null);
  const [profile, setProfile] =
    useState<PersonalProfile | null>(null);
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);

          const currentUser =
            await getCurrentSessionUser();

          if (!active) return;

          if (!currentUser) {
            router.replace("/login");
            return;
          }

          const currentProfile =
            await getOrCreatePersonalProfile(
              currentUser
            );

          if (!active) return;

          setUser(currentUser);
          setProfile(currentProfile);

          if (isProfileQrReady(currentProfile)) {
            setQrValue(
              buildProfileQrPayload(
                currentProfile
              )
            );
          } else {
            setQrValue("");
          }
        } catch (error) {
          console.error(
            "Profile QR loading error:",
            error
          );

          if (active) {
            Alert.alert(
              "QR Error",
              "Unable to prepare your profile QR. Please try again."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [])
  );

  const ready =
    Boolean(profile) &&
    Boolean(qrValue) &&
    isProfileQrReady(profile!);

  const displayPurok =
    profile?.purokSitio?.trim() ?? "";
  const displayRole =
    user?.role?.trim() ?? "";

  return (
    <View style={styles.background}>
      <CivicBackground />

      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons
              name="chevron-back"
              size={25}
              color={colors.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            My QR Code
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!loading && !ready ? (
            <View style={styles.incompleteCard}>
              <View style={styles.incompleteIcon}>
                <Ionicons
                  name="person-add-outline"
                  size={31}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.incompleteTitle}>
                Complete your profile first
              </Text>

              <Text style={styles.incompleteText}>
                Add your full name, Birthday, sex, and Purok / Sitio before creating your reusable SK Local Profile QR.
              </Text>

              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  router.push("/edit-profile")
                }
              >
                <Text style={styles.primaryButtonText}>
                  Complete Profile
                </Text>
              </Pressable>
            </View>
          ) : null}

          {ready && profile ? (
            <View style={styles.qrCard}>
              <View style={styles.badgeRow}>
                <View style={styles.skBadge}>
                  <Text style={styles.skBadgeText}>
                    SK
                  </Text>
                </View>

                <View style={styles.badgeTextBlock}>
                  <Text style={styles.badgeTitle}>
                    SK Local Profile
                  </Text>
                  <Text style={styles.badgeSubtitle}>
                    For SK Local services
                  </Text>
                </View>
              </View>

              <View style={styles.qrWrap}>
                <ProfileQRCode value={qrValue} />
              </View>

              <Text style={styles.profileName}>
                {profile.fullName}
              </Text>

              {(displayPurok || displayRole) ? (
                <View style={styles.profileMetaBlock}>
                  {displayPurok ? (
                    <Text style={styles.profileMetaLine}>
                      {displayPurok}
                    </Text>
                  ) : null}

                  {displayRole ? (
                    <Text style={styles.profileMetaLine}>
                      {displayRole}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.useCases}>
                <UseCase
                  icon="checkmark-done-outline"
                  text="Fast attendance identification"
                />
                <UseCase
                  icon="person-add-outline"
                  text="Youth Registration pre-fill"
                />
              </View>

              <View style={styles.privacyNote}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#15803D"
                />
                <Text style={styles.privacyText}>
                  This QR does not contain your username, password, recovery information, account permissions, or contact number.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function UseCase({
  icon,
  text,
}: {
  icon:
    | "checkmark-done-outline"
    | "person-add-outline";
  text: string;
}) {
  return (
    <View style={styles.useCaseRow}>
      <Ionicons
        name={icon}
        size={18}
        color={colors.primary}
      />
      <Text style={styles.useCaseText}>
        {text}
      </Text>
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

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.88)",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  headerSpacer: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  incompleteCard: {
    elevation: 3,
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.26)",
    backgroundColor: colors.white,
  },

  incompleteIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    marginBottom: spacing.md,
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  incompleteTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  incompleteText: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  primaryButton: {
    minHeight: 50,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    borderRadius: 15,
    backgroundColor: colors.primary,
  },

  primaryButtonText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },

  qrCard: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.26)",
    backgroundColor: colors.white,
    elevation: 4,
  },

  badgeRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  skBadge: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primary,
  },

  skBadgeText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },

  badgeTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },

  badgeTitle: {
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },

  badgeSubtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },

  qrWrap: {

    elevation: 3,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  profileName: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  profileMetaBlock: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 5,
    paddingHorizontal: spacing.sm,
  },

  profileMetaLine: {
    width: "100%",
    textAlign: "center",
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  useCases: {

    elevation: 3,
    alignSelf: "stretch",
    gap: 9,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },

  useCaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  useCaseText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSize.sm,
  },

  privacyNote: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: spacing.lg,
  },

  privacyText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
