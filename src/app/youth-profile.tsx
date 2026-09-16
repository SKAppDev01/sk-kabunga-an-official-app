import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import RecordAuditMetadata from "../components/RecordAuditMetadata";
import {
  useCallback,
  useState,
} from "react";
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
  getYouthById,
  YouthRecord,
} from "../services/youth";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function YouthProfileScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const youthId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [record, setRecord] =
    useState<YouthRecord | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [notFound, setNotFound] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        if (!youthId) {
          if (active) {
            setRecord(null);
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setNotFound(false);

          const result =
            await getYouthById(youthId);

          if (active) {
            setRecord(result);
            setNotFound(!result);
          }
        } catch (error) {
          console.error(
            "Youth profile loading error:",
            error
          );

          if (active) {
            setRecord(null);
            setNotFound(true);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadProfile();

      return () => {
        active = false;
      };
    }, [youthId])
  );

  function formatBirthday(
    value: string | null
  ) {
    if (!value) {
      return "Not set";
    }

    const parts =
      value.split("-").map(Number);

    if (parts.length !== 3) {
      return value;
    }

    const [year, month, day] = parts;

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  function valueOrNotSet(
    value: string | null
  ) {
    return value?.trim()
      ? value
      : "Not set";
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Youth Profile"
        showBack
      />
      

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading youth profile...
          </Text>
        </View>
      ) : notFound || !record ? (
        <View style={styles.centerState}>
          <Ionicons
            name="person-outline"
            size={42}
            color={colors.textMuted}
          />

          <Text style={styles.emptyTitle}>
            Youth record not found
          </Text>

          <Text style={styles.stateText}>
            This record may no longer be available.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          <View style={styles.profileTop}>
            <View
              style={
                styles.profileIcon
              }
            >
              <Ionicons
                name="person-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text
              style={styles.name}
              numberOfLines={2}
            >
              {record.fullName}
            </Text>

            <Text
              style={styles.profileMeta}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {record.age !== null
                ? `${record.age} ${
                    record.age === 1
                      ? "year"
                      : "years"
                  } old`
                : "Age not available"}
              {record.sex
                ? ` • ${record.sex}`
                : ""}
            </Text>

            <Text
              style={styles.location}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {record.purokSitio ||
                "Purok/Sitio not set"}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>

          <InfoRow
            icon="calendar-outline"
            label="Birthday"
            value={formatBirthday(
              record.birthday
            )}
          />

          <InfoRow
            icon="hourglass-outline"
            label="Age"
            value={
              record.age !== null
                ? `${record.age} ${
                    record.age === 1
                      ? "year old"
                      : "years old"
                  }`
                : "Not available"
            }
          />

          <InfoRow
            icon="male-female-outline"
            label="Sex"
            value={valueOrNotSet(
              record.sex
            )}
          />

          <InfoRow
            icon="location-outline"
            label="Purok / Sitio"
            value={valueOrNotSet(
              record.purokSitio
            )}
          />

          <InfoRow
            icon="call-outline"
            label="Contact Number"
            value={valueOrNotSet(
              record.contactNumber
            )}
          />

          <Text
            style={[
              styles.sectionTitle,
              styles.sectionSpacing,
            ]}
          >
            Youth Information
          </Text>

          <InfoRow
            icon="school-outline"
            label="Education"
            value={valueOrNotSet(
              record.education
            )}
          />

          <InfoRow
            icon="briefcase-outline"
            label="Employment Status"
            value={valueOrNotSet(
              record.employmentStatus
            )}
          />

          <InfoRow
            icon="people-outline"
            label="Youth Classification"
            value={valueOrNotSet(
              record.youthClassification
            )}
            isLast
          />
                <RecordAuditMetadata
          table="youth"
          recordId={record.id}
        />
</ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon:
    | "calendar-outline"
    | "hourglass-outline"
    | "male-female-outline"
    | "location-outline"
    | "call-outline"
    | "school-outline"
    | "briefcase-outline"
    | "people-outline";
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast &&
          styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={styles.infoValue}
        >
          {value}
        </Text>
      </View>
    </View>
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
    alignItems: "center",
    justifyContent: "center",
  },



  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  stateText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },

  scrollView: {
    backgroundColor: "#E3F2FD",
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  profileTop: {
    alignItems: "center",
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  profileIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  name: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  profileMeta: {
    width: "100%",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },

  location: {
    width: "100%",
    marginTop: 3,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  sectionSpacing: {
    marginTop: spacing.xxxl,
  },

  infoRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  infoIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  infoValue: {
    marginTop: 3,
    fontSize: typography.fontSize.md,
    lineHeight: 21,
    color: colors.text,
  },
});
