import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  ReportType,
} from "../services/reports";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type ReportItem = {
  type: ReportType;
  title: string;
  description: string;
  icon:
    | "folder-open-outline"
    | "wallet-outline"
    | "receipt-outline"
    | "people-outline"
    | "calendar-outline"
    | "checkmark-circle-outline"
    | "cube-outline"
    | "people-circle-outline";
};

const REPORTS: ReportItem[] = [
  {
    type: "projects",
    title: "Projects Report",
    description:
      "Project status, budget and expenses",
    icon: "folder-open-outline",
  },
  {
    type: "budget",
    title: "Budget Report",
    description:
      "Budget allocations and balances",
    icon: "wallet-outline",
  },
  {
    type: "expenses",
    title: "Expenses Report",
    description:
      "Expense records and totals",
    icon: "receipt-outline",
  },
  {
    type: "youth",
    title: "Youth Registry Report",
    description:
      "Registered youth and statistics",
    icon: "people-outline",
  },
  {
    type: "meetings",
    title: "Meetings Report",
    description:
      "Meetings and meeting records",
    icon: "calendar-outline",
  },
  {
    type: "attendance",
    title: "Attendance Report",
    description:
      "Meeting and activity attendance",
    icon: "checkmark-circle-outline",
  },
  {
    type: "inventory",
    title: "Inventory Report",
    description:
      "SK property and inventory status",
    icon: "cube-outline",
  },
  {
    type: "activities",
    title: "Activities Report",
    description:
      "Activities, participants and expenses",
    icon: "people-circle-outline",
  },
];

export default function ReportsScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Reports"
        showBack
      />
      

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        <Text
          style={styles.introTitle}
        >
          Offline Reports
        </Text>

        <Text
          style={styles.introText}
        >
          Generate useful summaries from
          records stored locally on this
          device.
        </Text>

        <View style={styles.reportList}>
          {REPORTS.map(
            (report, index) => (
              <Pressable
                key={report.type}
                style={({ pressed }) => [
                  styles.reportRow,
                  index <
                    REPORTS.length - 1 &&
                    styles.rowDivider,
                  pressed &&
                    styles.reportRowPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      "/report-viewer",
                    params: {
                      type:
                        report.type,
                    },
                  })
                }
              >
                <View
                  style={
                    styles.iconContainer
                  }
                >
                  <Ionicons
                    name={report.icon}
                    size={23}
                    color={colors.primary}
                  />
                </View>

                <View
                  style={styles.reportText}
                >
                  <Text
                    style={styles.reportTitle}
                  >
                    {report.title}
                  </Text>

                  <Text
                    style={
                      styles.reportDescription
                    }
                  >
                    {report.description}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            )
          )}
        </View>

        <View style={styles.noteBox}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colors.primary}
          />

          <Text style={styles.noteText}>
            All report screens support
            offline PDF saving, Android
            printing and PDF sharing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom:
      spacing.xxxl,
  },
  introTitle: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  introText: {
    marginTop: spacing.sm,
    marginBottom:
      spacing.lg,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
  },
  reportList: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },
  reportRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical:
      spacing.md,
  },
  reportRowPressed: {
    opacity: 0.65,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  reportText: {
    flex: 1,
    minWidth: 0,
    marginLeft:
      spacing.md,
    marginRight:
      spacing.sm,
  },
  reportTitle: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  reportDescription: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color:
      colors.textMuted,
  },
  noteBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#EFF6FF",
  },
  noteText: {
    flex: 1,
    minWidth: 0,
    marginLeft:
      spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },
});
