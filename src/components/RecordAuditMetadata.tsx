import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AuditableRecordTable,
  getRecordAuditMetadata,
  RecordAuditMetadata as AuditMetadata,
} from "../services/record-audit";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type Props = {
  table: AuditableRecordTable;
  recordId: string;
  showCreator?: boolean;
};

function parseDatabaseDate(
  value: string
) {
  const trimmed =
    value.trim();

  const sqliteUtc =
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
      trimmed
    );

  const normalized =
    sqliteUtc
      ? `${trimmed.replace(
          " ",
          "T"
        )}Z`
      : trimmed;

  const date =
    new Date(normalized);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function formatDateTime(
  value: string
) {
  const date =
    parseDatabaseDate(value);

  if (!date) {
    return value;
  }

  return date.toLocaleString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone:
        "Asia/Manila",
    }
  );
}

function wasEdited(
  metadata: AuditMetadata
) {
  const created =
    parseDatabaseDate(
      metadata.createdAt
    );

  const updated =
    parseDatabaseDate(
      metadata.updatedAt
    );

  if (!created || !updated) {
    return (
      metadata.createdAt !==
      metadata.updatedAt
    );
  }

  return (
    Math.abs(
      updated.getTime() -
        created.getTime()
    ) > 1000
  );
}

function AuditRow({
  icon,
  label,
  value,
}: {
  icon:
    | "person-outline"
    | "calendar-outline"
    | "create-outline";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.value}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function RecordAuditMetadata({
  table,
  recordId,
  showCreator = true,
}: Props) {
  const [
    metadata,
    setMetadata,
  ] =
    useState<
      AuditMetadata | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setIsLoading(true);

          const result =
            await getRecordAuditMetadata(
              table,
              recordId
            );

          if (active) {
            setMetadata(result);
          }
        } catch (error) {
          console.error(
            "Record audit metadata error:",
            error
          );

          if (active) {
            setMetadata(null);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [table, recordId])
  );

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Record Traceability
        </Text>

        <Text style={styles.loadingText}>
          Loading record history...
        </Text>
      </View>
    );
  }

  if (!metadata) {
    return null;
  }

  const creatorText =
    metadata.creatorName
      ? metadata.creatorRole
        ? `${metadata.creatorName} • ${metadata.creatorRole}`
        : metadata.creatorName
      : metadata.creatorId
        ? "Local account unavailable"
        : "Unknown / imported record";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Record Traceability
      </Text>

      <Text style={styles.sectionDescription}>
        Local audit information for this
        record.
      </Text>

      <View style={styles.rows}>
        {showCreator ? (
          <>
            <AuditRow
              icon="person-outline"
              label="Record Creator"
              value={creatorText}
            />

            <View style={styles.divider} />
          </>
        ) : null}

        <AuditRow
          icon="calendar-outline"
          label="Created"
          value={formatDateTime(
            metadata.createdAt
          )}
        />

        <View style={styles.divider} />

        <AuditRow
          icon="create-outline"
          label="Last Edited"
          value={
            wasEdited(metadata)
              ? formatDateTime(
                  metadata.updatedAt
                )
              : "Not edited yet"
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  sectionDescription: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },
  loadingText: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textMuted,
  },
  rows: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  row: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  label: {
    width: "100%",
    minWidth: 0,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
  },
  value: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    marginLeft: 48,
    backgroundColor:
      colors.border,
  },
});
