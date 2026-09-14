import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  colors,
  spacing,
  typography,
} from "../theme";

type IconName =
  ComponentProps<typeof Ionicons>["name"];

export default function SupportFeedbackScreen() {
  async function handleContactDeveloper() {
    const facebookUrl =
      "https://www.facebook.com/share/1DhbzqeNpK/";

    try {
      const supported =
        await Linking.canOpenURL(
          facebookUrl
        );

      if (!supported) {
        Alert.alert(
          "Unable to Open Facebook",
          "Facebook could not be opened on this device."
        );
        return;
      }

      await Linking.openURL(
        facebookUrl
      );
    } catch {
      Alert.alert(
        "Unable to Open Facebook",
        "Something went wrong while opening the developer profile."
      );
    }
  }

  async function handleOpenGitHub() {
    const githubUrl =
      "https://github.com/SKAppDev01";

    try {
      const supported =
        await Linking.canOpenURL(
          githubUrl
        );

      if (!supported) {
        Alert.alert(
          "Unable to Open GitHub",
          "GitHub could not be opened on this device."
        );
        return;
      }

      await Linking.openURL(
        githubUrl
      );
    } catch {
      Alert.alert(
        "Unable to Open GitHub",
        "Something went wrong while opening the developer GitHub profile."
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Support & Feedback
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={27}
              color={colors.primary}
            />
          </View>

          <Text style={styles.heroTitle}>
            Help us improve the app
          </Text>

          <Text style={styles.heroText}>
            Get basic support guidance, report
            problems, or share ideas that could
            make the SK Kabunga-an Official App
            more useful and easier to use.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Support
        </Text>

        <View style={styles.listCard}>
          <SupportItem
            icon="refresh-outline"
            title="If something does not work"
            description="Close and reopen the app first. If the issue continues, note the screen, action and message you saw."
          />

          <View style={styles.divider} />

          <SupportItem
            icon="images-outline"
            title="Keep useful details"
            description="A screenshot and a short description of what happened can make an issue easier to understand and fix."
          />

          <View style={styles.divider} />

          <SupportItem
            icon="cloud-offline-outline"
            title="Offline-first operation"
            description="Core app records are designed to work locally on the Android device. Some Android sharing actions may depend on other installed apps."
          />
        </View>

        <Text style={styles.sectionTitle}>
          Feedback
        </Text>

        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>
            Contact the Developer
          </Text>

          <Text style={styles.feedbackText}>
            Open the developer's Facebook profile to send feedback, report an issue, or share a suggestion about the app.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.pressed,
            ]}
            onPress={handleContactDeveloper}
          >
            <Ionicons
              name="logo-facebook"
              size={20}
              color={colors.white}
            />

            <Text style={styles.shareButtonText}>
              Contact Developer on Facebook
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.githubButton,
              pressed && styles.pressed,
            ]}
            onPress={handleOpenGitHub}
          >
            <Ionicons
              name="logo-github"
              size={20}
              color={colors.text}
            />

            <Text style={styles.githubButtonText}>
              View Developer on GitHub
            </Text>
          </Pressable>
        </View>

        <View style={styles.noticeBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />

          <Text style={styles.noticeText}>
            Opening Facebook does not automatically send any app records or private data. You decide what information to share when contacting the developer.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SupportItem({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.supportItem}>
      <View style={styles.itemIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>
          {title}
        </Text>

        <Text style={styles.itemDescription}>
          {description}
        </Text>
      </View>
    </View>
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
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.fontSize.lg,
    lineHeight: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  headerSpacer: {
    width: 44,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  heroCard: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: 18,
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.09,
    shadowRadius: 4,
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  heroTitle: {
    width: "100%",
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    fontWeight: typography.fontWeight.bold,
    color: "#0038A8",
    textAlign: "center",
  },

  heroText: {
    width: "100%",
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: "center",
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  listCard: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },

  supportItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
  },

  itemIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  itemText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  itemTitle: {
    width: "100%",
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  itemDescription: {
    width: "100%",
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  divider: {
    height: 1,
    marginLeft: 76,
    backgroundColor: colors.border,
  },

  feedbackCard: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },

  feedbackTitle: {
    width: "100%",
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  feedbackText: {
    width: "100%",
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  shareButton: {
    minHeight: 48,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },

  shareButtonText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },

  githubButton: {
    minHeight: 48,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
  },

  githubButtonText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  noticeBox: {
    elevation: 3,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
  },

  noticeText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  pressed: {
    opacity: 0.7,
  },
});
