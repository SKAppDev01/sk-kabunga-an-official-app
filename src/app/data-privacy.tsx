import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppHeader";

import {
  colors,
  spacing,
  typography,
} from "../theme";

type IconName =
  ComponentProps<typeof Ionicons>["name"];

type PrivacyItem = {
  icon: IconName;
  title: string;
  description: string;
};

const PRIVACY_ITEMS: PrivacyItem[] = [
  {
    icon: "phone-portrait-outline",
    title: "Local Device Storage",
    description:
      "Core app records are designed to be stored locally on this Android device so the app can continue working offline.",
  },
  {
    icon: "people-outline",
    title: "Youth & Official Records",
    description:
      "Personal youth information and internal official records are intended for authorized app users and are not part of the public youth-member view.",
  },
  {
    icon: "images-outline",
    title: "Photos & Attachments",
    description:
      "Receipt photos and document attachments are kept as app data on the device unless an authorized user deliberately exports, backs up or shares them.",
  },
  {
    icon: "qr-code-outline",
    title: "QR & Data Sharing",
    description:
      "Public sharing is limited to records prepared for public use. Official transfer packages can contain protected official data and should only be exchanged with authorized officials.",
  },
  {
    icon: "archive-outline",
    title: "Backup & Transfer",
    description:
      "Backups, exports and transfer files are created only when a user starts those actions. Anyone handling exported files should store and share them carefully.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Account Protection",
    description:
      "Local accounts, roles and official authorization are used to limit access to protected screens and records. Device security still matters because the app stores data locally.",
  },
];

export default function DataPrivacyScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Data & Privacy"
        showBack
      />
      

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              Your SK data stays under local
              control
            </Text>

            <Text
              style={styles.heroDescription}
            >
              SK Kabunga-an Official App is
              built as an offline-first
              Android application. This page
              explains how the app is
              designed to handle local
              records and sharing.
            </Text>
          </View>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          How the app handles data
        </Text>

        <View style={styles.listCard}>
          {PRIVACY_ITEMS.map(
            (item, index) => (
              <View key={item.title}>
                <View
                  style={styles.privacyRow}
                >
                  <View
                    style={styles.iconBox}
                  >
                    <Ionicons
                      name={item.icon}
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={styles.rowText}
                  >
                    <Text
                      style={styles.rowTitle}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={
                        styles.rowDescription
                      }
                    >
                      {item.description}
                    </Text>
                  </View>
                </View>

                {index <
                  PRIVACY_ITEMS.length -
                    1 && (
                  <View
                    style={styles.divider}
                  />
                )}
              </View>
            )
          )}
        </View>

        <Text
          style={styles.sectionTitle}
        >
          Important
        </Text>

        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={colors.primary}
          />

          <Text style={styles.noticeText}>
            Because the app is offline-first,
            protecting the Android device,
            screen lock, exported files and
            physical backups is an important
            part of protecting SK records.
          </Text>
        </View>

        <Text style={styles.footerText}>
          This is the in-app data and privacy
          summary for SK Kabunga-an Official
          App.
        </Text>
      </ScrollView>
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
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },



  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal:
      spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom:
      spacing.xxxl +
      spacing.xl,
  },

  heroCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor:
      colors.white,
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
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  heroText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  heroTitle: {
    width: "100%",
    fontSize:
      typography.fontSize.md,
    lineHeight: 22,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  heroDescription: {
    width: "100%",
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 19,
    color:
      colors.textSecondary,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.md,
    lineHeight: 22,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  listCard: {
    borderRadius: 16,
    backgroundColor:
      colors.white,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.09,
    shadowRadius: 4,
  },

  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.lg,
  },

  iconBox: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  rowText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  rowTitle: {
    width: "100%",
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  rowDescription: {
    width: "100%",
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },

  divider: {
    height: 1,
    marginLeft: 69,
    backgroundColor:
      colors.border,
  },

  noticeCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },

  noticeText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },

  footerText: {
    marginTop: spacing.xl,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: "center",
  },
});
