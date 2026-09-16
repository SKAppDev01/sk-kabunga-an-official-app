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
  getMeetingById,
  updateMeetingMinutes,
} from "../services/meetings";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function MeetingMinutesScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const meetingId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [meetingTitle, setMeetingTitle] =
    useState("");

  const [minutes, setMinutes] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadMinutes() {
        if (!meetingId) {
          if (active) {
            setError(
              "Meeting not found."
            );
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setError("");

          const meeting =
            await getMeetingById(
              meetingId
            );

          if (!active) {
            return;
          }

          if (!meeting) {
            setError(
              "Meeting not found."
            );
            return;
          }

          setMeetingTitle(
            meeting.title
          );
          setMinutes(
            meeting.minutes || ""
          );
        } catch (loadError) {
          console.error(
            "Minutes loading error:",
            loadError
          );

          if (active) {
            setError(
              "Unable to load the minutes."
            );
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadMinutes();

      return () => {
        active = false;
      };
    }, [meetingId])
  );

  async function handleSave() {
    if (!meetingId) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await updateMeetingMinutes(
        meetingId,
        minutes
      );

      router.back();
    } catch (saveError) {
      console.error(
        "Minutes saving error:",
        saveError
      );

      setError(
        "Unable to save the minutes. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Minutes"
        showBack
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading minutes...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={
              styles.content
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >

            <Text
              style={styles.meetingTitle}
            >
              {meetingTitle}
            </Text>

            <Text
              style={styles.helpText}
            >
              Record the official discussion,
              decisions and actions taken during
              the meeting.
            </Text>

            <TextInput
              style={styles.multilineInput}
              value={minutes}
              onChangeText={setMinutes}
              placeholder={
                "Record the discussion, decisions, motions, action items and other important meeting notes."
              }
              placeholderTextColor={
                colors.textMuted
              }
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />

            {error ? (
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                (pressed ||
                  isSaving) &&
                  styles.buttonPressed,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text
                style={
                  styles.saveButtonText
                }
              >
                {isSaving
                  ? "Saving..."
                  : "Save Minutes"}
              </Text>
            </Pressable>
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
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  meetingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  helpText: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  multilineInput: {
    elevation: 2,
    minHeight: 260,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    color: colors.text,
    backgroundColor: colors.white,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    textAlign: "center",
  },
  saveButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
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
