import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
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

export default function UpcomingEventsScreen() {
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
          Upcoming Events
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.screen}>
        <View style={styles.emptyRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="calendar-outline"
              size={26}
              color={colors.primary}
            />
          </View>

          <View style={styles.emptyText}>
            <Text style={styles.emptyTitle}>
              No upcoming events
            </Text>

            <Text style={styles.emptyDescription}>
              Scheduled meetings and activities will
              appear here once those modules are added.
            </Text>
          </View>
        </View>
      </View>
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

  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  emptyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  iconContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  emptyDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
