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

import {
  addMeetingResolution,
  deleteMeetingResolution,
  getMeetingResolutions,
  MeetingResolutionRecord,
  ResolutionStatus,
  updateMeetingResolutionStatus,
} from "../services/meetings";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const STATUS_OPTIONS: ResolutionStatus[] = [
  "Draft",
  "Approved",
  "Rejected",
];

function nextStatus(
  current: ResolutionStatus
): ResolutionStatus {
  if (current === "Draft") {
    return "Approved";
  }

  if (current === "Approved") {
    return "Rejected";
  }

  return "Draft";
}

export default function MeetingResolutionsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const meetingId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [records, setRecords] =
    useState<MeetingResolutionRecord[]>(
      []
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [showAdd, setShowAdd] =
    useState(false);

  const [resolutionNumber, setResolutionNumber] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [details, setDetails] =
    useState("");

  const [status, setStatus] =
    useState<ResolutionStatus>("Draft");

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadResolutions =
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
          await getMeetingResolutions(
            meetingId
          );

        setRecords(rows);
      } catch (loadError) {
        console.error(
          "Resolutions loading error:",
          loadError
        );

        setError(
          "Unable to load resolutions."
        );
      } finally {
        setIsLoading(false);
      }
    }, [meetingId]);

  useFocusEffect(
    useCallback(() => {
      loadResolutions();
    }, [loadResolutions])
  );

  async function handleAdd() {
    if (!meetingId) {
      return;
    }

    if (!title.trim()) {
      setError(
        "Please enter a resolution title."
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

      await addMeetingResolution({
        meetingId,
        resolutionNumber,
        title,
        details,
        status,
        createdBy: user.id,
      });

      setResolutionNumber("");
      setTitle("");
      setDetails("");
      setStatus("Draft");
      setShowAdd(false);

      await loadResolutions();
    } catch (saveError) {
      console.error(
        "Resolution saving error:",
        saveError
      );

      setError(
        "Unable to add the resolution."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCycleStatus(
    record: MeetingResolutionRecord
  ) {
    try {
      await updateMeetingResolutionStatus(
        record.id,
        nextStatus(record.status)
      );

      await loadResolutions();
    } catch (updateError) {
      console.error(
        "Resolution status error:",
        updateError
      );
    }
  }

  function confirmDelete(
    record: MeetingResolutionRecord
  ) {
    Alert.alert(
      "Delete Resolution",
      "Delete this resolution from the meeting?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMeetingResolution(
              record.id
            );

            await loadResolutions();
          },
        },
      ]
    );
  }

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
            Resolutions
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

        {showAdd ? (
          <View style={styles.addPanel}>
            <TextInput
              style={styles.input}
              value={resolutionNumber}
              onChangeText={
                setResolutionNumber
              }
              placeholder="Resolution No. (optional)"
              placeholderTextColor={
                colors.textMuted
              }
            />

            <TextInput
              style={[
                styles.input,
                styles.spacedInput,
              ]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError("");
              }}
              placeholder="Resolution title"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="sentences"
            />

            <TextInput
              style={styles.detailsInput}
              value={details}
              onChangeText={setDetails}
              placeholder="Details (optional)"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
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
                  : "Add Resolution"}
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
              Loading resolutions...
            </Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name="reader-outline"
              size={42}
              color={colors.textMuted}
            />

            <Text
              style={styles.emptyTitle}
            >
              No resolutions yet
            </Text>

            <Text
              style={styles.stateText}
            >
              Tap + to add a meeting
              resolution.
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
                    styles.resolutionRow,
                    index <
                      records.length - 1 &&
                      styles.rowDivider,
                  ]}
                >
                  <View style={styles.resolutionText}>
                    <Text
                      style={styles.resolutionTitle}
                    >
                      {record.resolutionNumber
                        ? `${record.resolutionNumber} • ${record.title}`
                        : record.title}
                    </Text>

                    {record.details ? (
                      <Text
                        style={styles.resolutionDetails}
                        numberOfLines={2}
                      >
                        {record.details}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    style={[
                      styles.resolutionBadge,
                      record.status ===
                        "Approved" &&
                        styles.approvedBadge,
                      record.status ===
                        "Rejected" &&
                        styles.rejectedBadge,
                    ]}
                    onPress={() =>
                      handleCycleStatus(
                        record
                      )
                    }
                  >
                    <Text
                      style={styles.resolutionBadgeText}
                    >
                      {record.status}
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
  spacedInput: {
    marginTop: spacing.sm,
  },
  detailsInput: {
    minHeight: 92,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: typography.fontSize.sm,
    color: colors.text,
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
    fontSize: 11,
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
  resolutionRow: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resolutionText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  resolutionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  resolutionDetails: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  resolutionBadge: {
    minWidth: 64,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  approvedBadge: {
    backgroundColor: "#ECFDF3",
  },
  rejectedBadge: {
    backgroundColor: "#FEF2F2",
  },
  resolutionBadgeText: {
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
