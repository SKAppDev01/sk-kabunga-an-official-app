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

import { AppHeader } from "../components/AppHeader";

import {
  ActivityParticipantRecord,
  addActivityParticipant,
  deleteActivityParticipant,
  getActivityParticipants,
} from "../services/activities";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ActivityParticipantsScreen() {
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

  const [showAdd, setShowAdd] =
    useState(false);

  const [name, setName] =
    useState("");

  const [contactNumber, setContactNumber] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadParticipants =
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
          "Participant loading error:",
          loadError
        );

        setError(
          "Unable to load participants."
        );
      } finally {
        setIsLoading(false);
      }
    }, [activityId]);

  useFocusEffect(
    useCallback(() => {
      loadParticipants();
    }, [loadParticipants])
  );

  async function handleAdd() {
    if (!activityId) {
      return;
    }

    if (!name.trim()) {
      setError(
        "Please enter a participant name."
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

      await addActivityParticipant({
        activityId,
        participantName: name,
        contactNumber,
        notes,
        createdBy: user.id,
      });

      setName("");
      setContactNumber("");
      setNotes("");
      setShowAdd(false);

      await loadParticipants();
    } catch (saveError) {
      console.error(
        "Add participant error:",
        saveError
      );

      setError(
        "Unable to add the participant."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(
    record: ActivityParticipantRecord
  ) {
    Alert.alert(
      "Remove Participant",
      `Remove ${record.participantName} from this activity?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteActivityParticipant(
              record.id
            );

            await loadParticipants();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Participants"
        showBack
        right={
          <Pressable
            style={styles.headerAction}
            onPress={() => setShowAdd((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={showAdd ? "Close add participant form" : "Add participant"}
          >
            <Ionicons
              name={showAdd ? "close" : "add"}
              size={25}
              color={colors.primary}
            />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

        <View style={styles.summary}>
          <Text
            style={styles.summaryText}
          >
            Participant List
          </Text>

          <Text
            style={styles.summaryCount}
          >
            {records.length}
          </Text>
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
              placeholder="Participant name"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="words"
            />

            <TextInput
              style={[
                styles.input,
                styles.spacedInput,
              ]}
              value={contactNumber}
              onChangeText={
                setContactNumber
              }
              placeholder="Contact number (optional)"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
            />

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
                  : "Add Participant"}
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
              Loading participants...
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
              Tap + to add activity
              participants.
            </Text>
          </View>
        ) : (
          <View style={[styles.list, styles.listContent, { flex: 0 }]}>
            {records.map(
              (record, index) => (
                <View
                  key={record.id}
                  style={[
                    styles.participantRow,
                    index <
                      records.length - 1 &&
                      styles.rowDivider,
                  ]}
                >
                  <View
                    style={
                      styles.personIcon
                    }
                  >
                    <Ionicons
                      name="person-outline"
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={
                      styles.participantText
                    }
                  >
                    <Text
                      style={
                        styles.participantName
                      }
                      numberOfLines={1}
                    >
                      {record.participantName}
                    </Text>

                    <Text
                      style={
                        styles.participantMeta
                      }
                      numberOfLines={1}
                    >
                      {record.contactNumber ||
                        "Contact not set"}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.attendanceText
                    }
                  >
                    {record.attendanceStatus}
                  </Text>

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
          </View>
        )}
      
        </ScrollView>
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
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.white,
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
  summaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  summaryCount: {
    elevation: 3,
    minWidth: 28,
    height: 28,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 999,
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
    backgroundColor: "#EFF6FF",
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
  notesInput: {
    minHeight: 78,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: typography.fontSize.sm,
    color: colors.text,
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
  participantRow: {
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
  participantText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  participantName: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
  participantMeta: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  attendanceText: {
    maxWidth: 72,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "right",
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
});
