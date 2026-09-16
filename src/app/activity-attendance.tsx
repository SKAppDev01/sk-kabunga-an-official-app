import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppHeader";

import QRScanner from "../components/QRScanner";
import {
  parseProfileQrPayload,
} from "../services/profile-qr-data";
import {
  ActivityAttendanceStatus,
  ActivityParticipantRecord,
  getActivityParticipants,
  markYouthPresentAtActivity,
  updateActivityAttendanceStatus,
} from "../services/activities";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  resolveYouthFromProfileQr,
} from "../services/youth";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const STATUS_OPTIONS: ActivityAttendanceStatus[] = [
  "Not Marked",
  "Present",
  "Absent",
  "Excused",
];

function getNextStatus(
  current: ActivityAttendanceStatus
) {
  const index =
    STATUS_OPTIONS.indexOf(
      current
    );

  return STATUS_OPTIONS[
    (index + 1) %
      STATUS_OPTIONS.length
  ];
}

function getBadgeStyle(
  status: ActivityAttendanceStatus
) {
  switch (status) {
    case "Present":
      return {
        backgroundColor:
          "#ECFDF3",
        textColor: "#047857",
      };

    case "Absent":
      return {
        backgroundColor:
          "#FEF2F2",
        textColor: "#B91C1C",
      };

    case "Excused":
      return {
        backgroundColor:
          "#FFF7ED",
        textColor: "#C2410C",
      };

    default:
      return {
        backgroundColor:
          "#F3F4F6",
        textColor:
          colors.textSecondary,
      };
  }
}

export default function ActivityAttendanceScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const activityId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [records, setRecords] =
    useState<ActivityParticipantRecord[]>(
      []
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [scannerOpen, setScannerOpen] =
    useState(false);
  const [scanError, setScanError] =
    useState("");

  const loadAttendance =
    useCallback(async () => {
      if (!activityId) {
        setError(
          "Activity not found."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const rows =
          await getActivityParticipants(
            activityId
          );

        setRecords(rows);
      } catch (loadError) {
        console.error(
          "Activity attendance loading error:",
          loadError
        );

        setError(
          "Unable to load attendance."
        );
      } finally {
        setIsLoading(false);
      }
    }, [activityId]);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance])
  );

  async function handleProfileScan(
    rawValue: string
  ) {
    if (!activityId) {
      setScanError(
        "Activity information is missing."
      );
      return false;
    }

    const payload =
      parseProfileQrPayload(rawValue);

    if (!payload) {
      setScanError(
        "This is not a valid SK Local Profile QR."
      );
      return false;
    }

    try {
      setScanError("");

      const youth =
        await resolveYouthFromProfileQr(
          payload
        );

      if (!youth) {
        setScannerOpen(false);

        Alert.alert(
          "Youth Not Registered",
          `${payload.fullName} is not yet linked to the Youth Registry. Register the profile first, then scan again for attendance.`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Register Youth",
              onPress: () =>
                router.push({
                  pathname: "/add-youth",
                  params: {
                    profileId:
                      payload.profileId,
                    fullName:
                      payload.fullName,
                    birthday:
                      payload.birthDate,
                    sex: payload.sex,
                    purokSitio:
                      payload.purokSitio,
                    education:
                      payload.educationStatus ||
                      "",
                    employmentStatus:
                      payload.employmentStatus ||
                      "",
                    youthClassification:
                      payload.youthClassification ||
                      "",
                  },
                }),
            },
          ]
        );

        return true;
      }

      const user =
        await getCurrentSessionUser();

      if (!user) {
        setScannerOpen(false);
        router.replace("/login");
        return true;
      }

      const result =
        await markYouthPresentAtActivity({
          activityId,
          youthId: youth.id,
          createdBy: user.id,
        });

      setScannerOpen(false);
      await loadAttendance();

      Alert.alert(
        result === "already-present"
          ? "Already Present"
          : "Attendance Recorded",
        result === "already-present"
          ? `${youth.fullName} is already marked Present for this activity.`
          : `${youth.fullName} has been marked Present.`
      );

      return true;
    } catch (scanFailure) {
      console.error(
        "Activity QR attendance error:",
        scanFailure
      );

      setScanError(
        "Unable to record attendance from this Profile QR. Please try again."
      );
      return false;
    }
  }

  async function handleStatusPress(
    record: ActivityParticipantRecord
  ) {
    try {
      await updateActivityAttendanceStatus(
        record.id,
        getNextStatus(
          record.attendanceStatus
        )
      );

      await loadAttendance();
    } catch (updateError) {
      console.error(
        "Attendance update error:",
        updateError
      );

      setError(
        "Unable to update attendance."
      );
    }
  }

  if (scannerOpen) {
    return (
      <QRScanner
        title="Activity Attendance"
        hint="Scan a registered youth Profile QR"
        errorMessage={scanError}
        onClose={() => {
          setScannerOpen(false);
          setScanError("");
        }}
        onScan={handleProfileScan}
      />
    );
  }

  const presentCount =
    records.filter(
      (record) =>
        record.attendanceStatus ===
        "Present"
    ).length;

  const markedCount =
    records.filter(
      (record) =>
        record.attendanceStatus !==
        "Not Marked"
    ).length;

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Attendance"
        showBack
      />
      

      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text
            style={styles.summaryMain}
          >
            {presentCount} present
          </Text>

          <Text
            style={styles.summarySub}
          >
            {`${markedCount} of ${records.length} marked`}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.scanButton,
            pressed &&
              styles.scanButtonPressed,
          ]}
          onPress={() => {
            setScanError("");
            setScannerOpen(true);
          }}
        >
          <Ionicons
            name="scan-outline"
            size={18}
            color={colors.primary}
          />
          <Text
            style={styles.scanButtonText}
          >
            Scan QR
          </Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading attendance...
          </Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons
            name="people-outline"
            size={42}
            color={colors.textMuted}
          />

          <Text
            style={styles.emptyTitle}
          >
            No participants yet
          </Text>

          <Text
            style={styles.stateText}
          >
            Scan a registered youth QR,
            {"\n"}
            or add participants manually.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          {records.map(
            (record, index) => {
              const badgeStyle =
                getBadgeStyle(
                  record.attendanceStatus
                );

              return (
                <View
                  key={record.id}
                  style={[
                    styles.row,
                    index <
                      records.length - 1 &&
                      styles.rowDivider,
                  ]}
                >
                  <View
                    style={styles.personIcon}
                  >
                    <Ionicons
                      name="person-outline"
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    style={styles.name}
                    numberOfLines={1}
                  >
                    {record.participantName}
                  </Text>

                  <Pressable
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          badgeStyle.backgroundColor,
                      },
                    ]}
                    onPress={() =>
                      handleStatusPress(
                        record
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            badgeStyle.textColor,
                        },
                      ]}
                    >
                      {record.attendanceStatus}
                    </Text>
                  </Pressable>
                </View>
              );
            }
          )}
        </ScrollView>
      )}
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
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLeft: {
    flex: 1,
    minWidth: 0,
  },

  summaryMain: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  summarySub: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  scanButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginLeft: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    backgroundColor: colors.white,
    elevation: 2,
  },
  scanButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  scanButtonPressed: {
    opacity: 0.72,
  },
  errorText: {
    margin: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    textAlign: "center",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  stateText: {
    width: "100%",
    maxWidth: 280,
    flexShrink: 0,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personIcon: {
    width: 38,
    alignItems: "center",
  },
  name: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    paddingRight: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },
  statusBadge: {
    minWidth: 82,
    minHeight: 32,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },
});
