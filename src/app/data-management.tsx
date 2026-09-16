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
  colors,
  spacing,
  typography,
} from "../theme";

type ActionRowProps = {
  icon:
    | "share-outline"
    | "download-outline"
    | "archive-outline"
    | "refresh-outline"
    | "scan-outline"
    | "qr-code-outline"
    | "lock-closed-outline"
    | "time-outline";
  title: string;
  description: string;
  stepLabel?: string;
  onPress?: () => void;
};

function ActionRow({
  icon,
  title,
  description,
  stepLabel,
  onPress,
}: ActionRowProps) {
  const enabled =
    Boolean(onPress);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        pressed &&
          enabled &&
          styles.actionRowPressed,
        !enabled &&
          styles.actionRowDisabled,
      ]}
      onPress={onPress}
      disabled={!enabled}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={23}
          color={colors.primary}
        />
      </View>

      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text
          style={styles.actionDescription}
        >
          {description}
        </Text>
      </View>

      {enabled ? (
        <Ionicons
          name="chevron-forward-outline"
          size={19}
          color={colors.textMuted}
        />
      ) : (
        <Text style={styles.stepLabel}>
          {stepLabel}
        </Text>
      )}
    </Pressable>
  );
}

export default function DataManagementScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Data Management"
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

        <Text style={styles.title}>
          Offline Data Sharing
        </Text>

        <Text style={styles.subtitle}>
          Move official records between
          authorized devices without
          requiring an internet connection.
        </Text>

        <Text style={styles.sectionTitle}>
          Transfer & Merge
        </Text>

        <View style={styles.actionList}>
          <ActionRow
            icon="share-outline"
            title="Export Data"
            description="Create an officials-only offline data package for another authorized device."
            onPress={() =>
              router.push(
                "/export-data"
              )
            }
          />

          <ActionRow
            icon="download-outline"
            title="Import Data"
            description="Preview a received package and import only new records."
            onPress={() =>
              router.push(
                "/import-data"
              )
            }
          />
        </View>

        <Text style={styles.sectionTitle}>
          Device Backup
        </Text>

        <View style={styles.actionList}>
          <ActionRow
            icon="archive-outline"
            title="Backup"
            description="Create a protected local database backup package for this device."
            onPress={() =>
              router.push(
                "/backup-data"
              )
            }
          />

          <ActionRow
            icon="refresh-outline"
            title="Restore"
            description="Preview and restore a valid SK database backup package."
            onPress={() =>
              router.push(
                "/restore-data"
              )
            }
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name="phone-portrait-outline"
            size={21}
            color={colors.primary}
          />

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Offline Transfer
            </Text>

            <Text style={styles.infoDescription}>
              Exported packages can be moved
              using Quick Share, Bluetooth,
              USB, or another Android
              file-sharing method.
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name="copy-outline"
            size={21}
            color={colors.primary}
          />

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Duplicate Protection
            </Text>

            <Text style={styles.infoDescription}>
              Imports will be previewed before
              merging so existing records are
              not blindly duplicated.
            </Text>
          </View>
        </View>

        <View style={styles.masterBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color={colors.primary}
          />

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Recommended Workflow
            </Text>

            <Text style={styles.infoDescription}>
              The Chairperson device can act
              as the main database while
              authorized officials export
              their updates for controlled
              merging.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Transfer Activity
        </Text>

        <View style={styles.actionList}>
          <ActionRow
            icon="time-outline"
            title="Transfer History"
            description="Review successful exports, imports, backups, restores and QR transfers on this device."
            onPress={() =>
              router.push(
                "/data-transfer-history"
              )
            }
          />
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>
            QR Data Sharing
          </Text>

          <View style={styles.actionList}>
            <ActionRow
              icon="scan-outline"
              title="Receive / Scan"
              description="Scan a Public QR or encrypted Officials QR completely offline."
              onPress={() =>
                router.push(
                  "/receive-data-qr"
                )
              }
            />

            <ActionRow
              icon="qr-code-outline"
              title="Generate Public QR"
              description="Share only records explicitly marked public/shareable."
              onPress={() =>
                router.push(
                  "/public-data-qr"
                )
              }
            />

            <ActionRow
              icon="lock-closed-outline"
              title="Generate Officials QR"
              description="Create a signed, encrypted quick-sync QR for verified officials."
              onPress={() =>
                router.push(
                  "/official-data-qr"
                )
              }
            />
          </View>

          <Text style={styles.qrDescription}>
            QR is intended for small data
            packages. Use Export Data for
            larger transfers.
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

  title: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  subtitle: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  actionList: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  actionRow: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical:
      spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  actionRowPressed: {
    opacity: 0.65,
  },

  actionRowDisabled: {
    opacity: 0.7,
  },

  actionIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },

  actionTitle: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  actionDescription: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
  },

  stepLabel: {
    minWidth: 42,
    flexShrink: 0,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "right",
  },

  infoBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#F9FAFB",
  },

  masterBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor:
      "#EFF6FF",
  },

  infoText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },

  infoTitle: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  infoDescription: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },

  qrSection: {
    marginTop: spacing.sm,
  },

  qrDescription: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
  },
});
