import { router } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AUTH_LEVEL_VERIFIED_OFFICIAL,
  isOfficialRole,
} from "../services/authorization";
import { getCurrentSessionUser } from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function SplashScreen() {
  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(
      async () => {
        try {
          const user =
            await getCurrentSessionUser();

          if (!isMounted) {
            return;
          }

          if (!user) {
            router.replace("/login");
            return;
          }

          if (
            !user.fullName ||
            !user.role
          ) {
            router.replace({
              pathname: "/profile-setup",
              params: {
                userId: user.id,
                username:
                  user.username,
              },
            });

            return;
          }

          if (
            isOfficialRole(user.role) &&
            user.authorizationLevel !==
              AUTH_LEVEL_VERIFIED_OFFICIAL
          ) {
            router.replace({
              pathname:
                "/official-verification",
              params: {
                userId: user.id,
                username: user.username,
                fullName:
                  user.fullName || "",
              },
            });

            return;
          }

          router.replace("/home");
        } catch (error) {
          console.error(
            "Session check error:",
            error
          );

          if (isMounted) {
            router.replace("/login");
          }
        }
      },
      3000
    );

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Official logos */}
          <View style={styles.officialLogoRow}>
            <Image
              source={require("../../assets/images/baybay-logo.png")}
              style={styles.officialLogo}
              resizeMode="contain"
            />

            <Image
              source={require("../../assets/images/barangay-kabunga-an-logo.png")}
              style={styles.officialLogo}
              resizeMode="contain"
            />

            <Image
              source={require("../../assets/images/sk-kabunga-an-seal.png")}
              style={styles.officialLogo}
              resizeMode="contain"
            />
          </View>

          {/* Main app logo */}
          <Image
            source={require("../../assets/images/sk-kabunga-an-logo.png")}
            style={styles.appLogo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            SK KABUNGA-AN
          </Text>

          <Text
            style={styles.subtitle}
          >
            Official SK Management &
            Records App
          </Text>
        </View>

        <View
          style={
            styles.footerContainer
          }
        >
          <Text style={styles.footer}>
            Local • Secure • Organized
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  officialLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  officialLogo: {
    width: 72,
    height: 72,
  },

  appLogo: {
    width: 130,
    height: 130,
    marginBottom: spacing.md,
  },

  title: {
    fontSize:
      typography.fontSize.display,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },

  footerContainer: {
    paddingBottom: spacing.xl,
    alignItems: "center",
  },

  footer: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textMuted,
    textAlign: "center",
  },
});
