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
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import QRScanner from "../components/QRScanner";
import {
  parseProfileQrPayload,
} from "../services/profile-qr-data";
import {
  addMeetingAttendance,
  AttendanceStatus,
  deleteMeetingAttendance,
  getMeetingAttendance,
  markYouthPresentAtMeeting,
  MeetingAttendanceRecord,
  updateMeetingAttendanceStatus,
} from "../services/meetings";
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

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Excused",
];

function nextStatus(
  current: AttendanceStatus
): AttendanceStatus {
  if (current === "Present") {
    return "Absent";
  }

  if (current === "Absent") {
    return "Excused";
  }

  return "Present";
}

export default function MeetingAttendanceScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const meetingId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [records, setRecords] =
    useState<MeetingAttendanceRecord[]>(
      []
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [showAdd, setShowAdd] =
    useState(false);

  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState("");

  const [status, setStatus] =
    useState<AttendanceStatus>(
      "Present"
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [scannerOpen, setScannerOpen] =
    useState(false);
  const [scanError, setScanError] =
    useState("");

  const loadAttendance =
    useCallback(async () => {
      if (!meetingId) {
        setError(
          "Meeting not found."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const rows =
          await getMeetingAttendance(
            meetingId
          );

        setRecords(rows);
      } catch (loadError) {
        console.error(
          "Attendance loading error:",
          loadError
        );

        setError(
          "Unable to load attendance."
        );
      } finally {
        setIsLoading(false);
      }
    }, [meetingId]);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance])
  );

  async function handleProfileScan(
    rawValue: string
  ) {
    if (!meetingId) {
      setScanError(
        "Meeting information is missing."
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
        await markYouthPresentAtMeeting({
          meetingId,
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
          ? `${youth.fullName} is already marked Present for this meeting.`
          : `${youth.fullName} has been marked Present.`
      );

      return true;
    } catch (scanFailure) {
      console.error(
        "Meeting QR attendance error:",
        scanFailure
      );

      setScanError(
        "Unable to record attendance from this Profile QR. Please try again."
      );
      return false;
    }
  }

  async function handleAdd() {
    if (!meetingId) {
      return;
    }

    if (!name.trim()) {
      setError(
        "Please enter an attendee name."
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const user =
        await getCurrentSessionUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await addMeetingAttendance({
        meetingId,
        attendeeName: name,
        attendeeRole: role,
        attendanceStatus: status,
        createdBy: user.id,
      });

      setName("");
      setRole("");
      setStatus("Present");
      setShowAdd(false);

      await loadAttendance();
    } catch (saveError) {
      console.error(
        "Attendance saving error:",
        saveError
      );

      setError(
        "Unable to add the attendee."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCycleStatus(
    record: MeetingAttendanceRecord
  ) {
    try {
      await updateMeetingAttendanceStatus(
        record.id,
        nextStatus(
          record.attendanceStatus
        )
      );

      await loadAttendance();
    } catch (updateError) {
      console.error(
        "Attendance status error:",
        updateError
      );
    }
  }

  function confirmDelete(
    record: MeetingAttendanceRecord
  ) {
    Alert.alert(
      "Remove Attendee",
      `Remove ${record.attendeeName} from this meeting attendance?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteMeetingAttendance(
              record.id
            );

            await loadAttendance();
          },
        },
      ]
    );
  }

  if (scannerOpen) {
    return (
      <QRScanner
        title="Meeting Attendance"
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

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Attendance
          </Text>

          <Pressable
            style={styles.headerAction}
            onPress={() =>
              setShowAdd(
                (current) => !current
              )
            }
          >
            <Ionicons
              name={
                showAdd
                  ? "close"
                  : "add"
              }
              size={25}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryStats}>
            <Text
              style={styles.summaryText}
            >
              {presentCount} present
            </Text>

            <Text
              style={styles.summaryMuted}
            >
              {records.length} total
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.scanButton,
              pressed &&
                styles.buttonPressed,
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

        {showAdd ? (
          <View style={styles.addPanel}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError("");
              }}
              placeholder="Attendee name"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="words"
            />

            <TextInput
              style={[
                styles.input,
                styles.secondaryInput,
              ]}
              value={role}
              onChangeText={setRole}
              placeholder="Position / Role (optional)"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="words"
            />

            <View
              style={styles.statusRow}
            >
              {STATUS_OPTIONS.map(
                (option) => {
                  const selected =
                    option === status;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.statusChip,
                        selected &&
                          styles.statusChipSelected,
                      ]}
                      onPress={() =>
                        setStatus(option)
                      }
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          selected &&
                            styles.statusChipTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                (pressed ||
                  isSaving) &&
                  styles.buttonPressed,
              ]}
              onPress={handleAdd}
              disabled={isSaving}
            >
              <Text
                style={
                  styles.addButtonText
                }
              >
                {isSaving
                  ? "Adding..."
                  : "Add Attendee"}
              </Text>
            </Pressable>
          </View>
        ) : null}

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
              No attendees yet
            </Text>

            <Text
              style={styles.stateText}
            >
              Tap + to add an attendee,
              or scan a registered youth QR.
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
              (record, index) => (
                <View
                  key={record.id}
                  style={[
                    styles.attendeeRow,
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

                  <View
                    style={
                      styles.attendeeText
                    }
                  >
                    <Text
                      style={
                        styles.attendeeName
                      }
                      numberOfLines={1}
                    >
                      {record.attendeeName}
                    </Text>

                    <Text
                      style={
                        styles.attendeeRole
                      }
                      numberOfLines={1}
                    >
                      {record.attendeeRole ||
                        "Role not set"}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.attendanceBadge,
                      record.attendanceStatus ===
                        "Present" &&
                        styles.presentBadge,
                      record.attendanceStatus ===
                        "Absent" &&
                        styles.absentBadge,
                      record.attendanceStatus ===
                        "Excused" &&
                        styles.excusedBadge,
                    ]}
                    onPress={() =>
                      handleCycleStatus(
                        record
                      )
                    }
                  >
                    <Text
                      style={
                        styles.attendanceBadgeText
                      }
                    >
                      {
                        record.attendanceStatus
                      }
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() =>
                      confirmDelete(record)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              )
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },
  flex: {
    flex: 1,
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
    textAlign: "center",
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
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
  summaryStats: {
    flex: 1,
    minWidth: 0,
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
  summaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  summaryMuted: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  addPanel: {
    elevation: 3,
    margin: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  secondaryInput: {
    marginTop: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statusChip: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
  },
  statusChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  statusChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statusChipTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
  addButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  errorText: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
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
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
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
  attendeeRow: {
    minHeight: 76,
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
  attendeeText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  attendeeName: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  attendeeRole: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  attendanceBadge: {
    minWidth: 65,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },
  presentBadge: {
    backgroundColor: "#ECFDF3",
  },
  absentBadge: {
    backgroundColor: "#FEF2F2",
  },
  excusedBadge: {
    backgroundColor: "#FFF7ED",
  },
  attendanceBadgeText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
});
