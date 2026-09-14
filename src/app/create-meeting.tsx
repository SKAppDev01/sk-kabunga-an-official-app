import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import {
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
  createMeetingRecord,
  MeetingStatus,
} from "../services/meetings";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type FormErrors = {
  title?: string;
  meetingDate?: string;
  meetingTime?: string;
  form?: string;
};

const STATUS_OPTIONS: MeetingStatus[] = [
  "Scheduled",
  "Ongoing",
  "Completed",
  "Cancelled",
];

function formatDateForStorage(
  value: Date
) {
  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    value.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(
  value: Date
) {
  return value.toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

function formatTimeForStorage(
  value: Date
) {
  const hour = String(
    value.getHours()
  ).padStart(2, "0");
  const minute = String(
    value.getMinutes()
  ).padStart(2, "0");

  return `${hour}:${minute}`;
}

function formatTimeForDisplay(
  value: Date
) {
  return value.toLocaleTimeString(
    "en-PH",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

export default function CreateMeetingScreen() {
  const [title, setTitle] =
    useState("");

  const [
    meetingDate,
    setMeetingDate,
  ] = useState<Date | null>(
    new Date()
  );

  const [
    meetingTime,
    setMeetingTime,
  ] = useState<Date | null>(null);

  const [location, setLocation] =
    useState("");

  const [status, setStatus] =
    useState<MeetingStatus>(
      "Scheduled"
    );

  const [
    showDatePicker,
    setShowDatePicker,
  ] = useState(false);

  const [
    showTimePicker,
    setShowTimePicker,
  ] = useState(false);

  const [
    statusOpen,
    setStatusOpen,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errors, setErrors] =
    useState<FormErrors>({});

  function clearError(
    field: keyof FormErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  function handleDateValueChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowDatePicker(false);

    if (
      event.type === "dismissed" ||
      !selectedDate
    ) {
      return;
    }

    setMeetingDate(selectedDate);
    clearError("meetingDate");
  }

  function handleTimeValueChange(
    _event: unknown,
    selectedTime: Date
  ) {
    if (!selectedTime) {
      return;
    }

    setMeetingTime(selectedTime);
    clearError("meetingTime");
    setShowTimePicker(false);
  }

  function handleTimeDismiss() {
    setShowTimePicker(false);
  }

  async function handleSave() {
    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      setErrors({
        title:
          "Please enter a meeting title.",
      });
      return;
    }

    if (!meetingDate) {
      setErrors({
        meetingDate:
          "Please choose a meeting date.",
      });
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      const user =
        await getCurrentSessionUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await createMeetingRecord({
        title: cleanTitle,
        meetingDate:
          formatDateForStorage(
            meetingDate
          ),
        meetingTime: meetingTime
          ? formatTimeForStorage(
              meetingTime
            )
          : "",
        location,
        status,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Create meeting error:",
        error
      );

      const message =
        String(error);

      if (
        message.includes(
          "INVALID_MEETING_DATE"
        )
      ) {
        setErrors({
          meetingDate:
            "Please choose a valid meeting date.",
        });
        return;
      }

      if (
        message.includes(
          "INVALID_MEETING_TIME"
        )
      ) {
        setErrors({
          meetingTime:
            "Please choose a valid meeting time.",
        });
        return;
      }

      setErrors({
        form:
          "Unable to create the meeting. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
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
            disabled={isSaving}
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
            Create Meeting
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <Text
            style={styles.introTitle}
          >
            Meeting Information
          </Text>

          <Text
            style={styles.introText}
          >
            Create an official SK meeting record.
            Agenda, attendance, minutes and
            resolutions will be added in the next
            meeting steps.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Meeting Title
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.title &&
                  styles.inputError,
              ]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);

                if (errors.title) {
                  clearError("title");
                }
              }}
              placeholder="Example: Regular SK Meeting"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="sentences"
              editable={!isSaving}
            />

            {errors.title ? (
              <Text
                style={styles.errorText}
              >
                {errors.title}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Meeting Date
            </Text>

            <Pressable
              style={[
                styles.selector,
                errors.meetingDate &&
                  styles.inputError,
              ]}
              onPress={() =>
                setShowDatePicker(true)
              }
              disabled={isSaving}
            >
              <View
                style={styles.selectorLeft}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text
                  style={styles.selectorText}
                >
                  {meetingDate
                    ? formatDateForDisplay(
                        meetingDate
                      )
                    : "Choose date"}
                </Text>
              </View>

              <Ionicons
                name="chevron-down-outline"
                size={19}
                color={colors.textMuted}
              />
            </Pressable>

            {errors.meetingDate ? (
              <Text
                style={styles.errorText}
              >
                {errors.meetingDate}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Meeting Time
            </Text>

            <Pressable
              style={[
                styles.selector,
                errors.meetingTime &&
                  styles.inputError,
              ]}
              onPress={() =>
                setShowTimePicker(true)
              }
              disabled={isSaving}
            >
              <View
                style={styles.selectorLeft}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={
                    meetingTime
                      ? colors.primary
                      : colors.textMuted
                  }
                />

                <Text
                  style={[
                    styles.selectorText,
                    !meetingTime &&
                      styles.placeholderText,
                  ]}
                >
                  {meetingTime
                    ? formatTimeForDisplay(
                        meetingTime
                      )
                    : "Optional"}
                </Text>
              </View>

              {meetingTime ? (
                <Pressable
                  onPress={() =>
                    setMeetingTime(null)
                  }
                  hitSlop={8}
                  disabled={isSaving}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              ) : (
                <Ionicons
                  name="chevron-down-outline"
                  size={19}
                  color={colors.textMuted}
                />
              )}
            </Pressable>

            {errors.meetingTime ? (
              <Text
                style={styles.errorText}
              >
                {errors.meetingTime}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Location
            </Text>

            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Example: Barangay Hall"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="words"
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Status
            </Text>

            <Pressable
              style={styles.selector}
              onPress={() =>
                setStatusOpen(
                  (current) => !current
                )
              }
              disabled={isSaving}
            >
              <View
                style={styles.selectorLeft}
              >
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text
                  style={styles.selectorText}
                >
                  {status}
                </Text>
              </View>

              <Ionicons
                name={
                  statusOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={19}
                color={colors.textMuted}
              />
            </Pressable>

            {statusOpen ? (
              <View
                style={styles.optionsList}
              >
                {STATUS_OPTIONS.map(
                  (option) => {
                    const selected =
                      status === option;

                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.optionRow,
                          selected &&
                            styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          setStatus(option);
                          setStatusOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected &&
                              styles.optionTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {option}
                        </Text>

                        <View
                          style={styles.optionCheckSlot}
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={
                                colors.primary
                              }
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>
            ) : null}
          </View>

          {errors.form ? (
            <Text
              style={
                styles.formErrorText
              }
            >
              {errors.form}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (pressed || isSaving) &&
                styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text
              style={styles.saveButtonText}
            >
              {isSaving
                ? "Creating Meeting..."
                : "Create Meeting"}
            </Text>
          </Pressable>
        </ScrollView>

        {showDatePicker ? (
          <DateTimePicker
            value={
              meetingDate ||
              new Date()
            }
            mode="date"
            display="default"
            onChange={handleDateValueChange}
          />
        ) : null}

        {showTimePicker ? (
          <DateTimePicker
            value={
              meetingTime ||
              new Date()
            }
            mode="time"
            display={
              Platform.OS ===
              "android"
                ? "default"
                : "spinner"
            }
            onValueChange={
              handleTimeValueChange
            }
            onDismiss={
              handleTimeDismiss
            }
          />
        ) : null}
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

  headerSpacer: {
    width: 44,
  },

  scrollView: {
    backgroundColor: "#E3F2FD",
    flex: 1,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  introText: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  fieldGroup: {
    marginBottom: spacing.lg,
  },

  label: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  input: {
    elevation: 2,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    backgroundColor: colors.white,
  },

  selector: {
    elevation: 2,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  selectorLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
  },

  selectorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  placeholderText: {
    color: colors.textMuted,
  },

  inputError: {
    borderColor: colors.danger,
  },

  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },

  formErrorText: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.danger,
    textAlign: "center",
  },

  optionsList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
  },

  optionRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  optionRowSelected: {
    backgroundColor: "#EFF6FF",
  },

  optionText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  optionCheckSlot: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  optionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  saveButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  buttonPressed: {
    opacity: 0.72,
  },
});
