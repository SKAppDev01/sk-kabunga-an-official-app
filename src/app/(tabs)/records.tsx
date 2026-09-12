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
} from "../../theme";

export default function RecordsScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          Records
        </Text>

        <Text style={styles.subtitle}>
          Manage official SK records stored locally
          on this device.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.recordRow,
            pressed &&
              styles.recordRowPressed,
          ]}
          onPress={() =>
            router.push("/youth-registry")
          }
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="people-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.recordText}>
            <Text style={styles.recordTitle}>
              Youth Registry
            </Text>

            <Text
              style={styles.recordDescription}
            >
              Youth profiles, search, filters and
              statistics
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={21}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.recordRow,
            pressed &&
              styles.recordRowPressed,
          ]}
          onPress={() =>
            router.push("/meetings")
          }
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.recordText}>
            <Text style={styles.recordTitle}>
              Meetings
            </Text>

            <Text
              style={styles.recordDescription}
            >
              Official meetings, agenda, attendance,
              minutes and resolutions
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={21}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.recordRow,
            pressed &&
              styles.recordRowPressed,
          ]}
          onPress={() =>
            router.push("/activities")
          }
        >
          <View
            style={styles.iconContainer}
          >
            <Ionicons
              name="people-circle-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.recordText}>
            <Text style={styles.recordTitle}>
              Activities
            </Text>

            <Text
              style={
                styles.recordDescription
              }
            >
              Youth activities, participants,
              attendance and event records
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={21}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.recordRow,
            pressed &&
              styles.recordRowPressed,
          ]}
          onPress={() =>
            router.push("/inventory")
          }
        >
          <View
            style={styles.iconContainer}
          >
            <Ionicons
              name="cube-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.recordText}>
            <Text style={styles.recordTitle}>
              Inventory
            </Text>

            <Text
              style={
                styles.recordDescription
              }
            >
              SK property, quantities,
              condition and borrow records
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={21}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.recordRow,
            pressed &&
              styles.recordRowPressed,
          ]}
          onPress={() =>
            router.push("/documents")
          }
        >
          <View
            style={styles.iconContainer}
          >
            <Ionicons
              name="documents-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.recordText}>
            <Text style={styles.recordTitle}>
              Documents
            </Text>

            <Text
              style={
                styles.recordDescription
              }
            >
              Resolutions, purchase requests,
              vouchers and liquidation records
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={21}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.recordRow,
            pressed &&
              styles.recordRowPressed,
          ]}
          onPress={() =>
            router.push("/reports")
          }
        >
          <View
            style={styles.iconContainer}
          >
            <Ionicons
              name="bar-chart-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.recordText}>
            <Text style={styles.recordTitle}>
              Reports
            </Text>

            <Text
              style={
                styles.recordDescription
              }
            >
              Offline summaries for projects,
              finance, youth and official records
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={21}
            color={colors.textMuted}
          />
        </Pressable>

        <View style={styles.futureNote}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textMuted}
          />

          <Text style={styles.futureNoteText}>
            Data sharing and remaining system tools
            will be added in the next roadmap phases.
          </Text>
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

  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  recordRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  recordRowPressed: {
    opacity: 0.65,
  },

  iconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  recordText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },

  recordTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  recordDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  futureNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
  },

  futureNoteText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
