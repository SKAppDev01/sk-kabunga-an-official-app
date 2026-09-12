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

import {
  getMeetingById,
  updateMeetingAgenda,
} from "../services/meetings";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function MeetingAgendaScreen() {
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

  const [agenda, setAgenda] =
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

      async function loadAgenda() {
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
          setAgenda(
            meeting.agenda || ""
          );
        } catch (loadError) {
          console.error(
            "Agenda loading error:",
            loadError
          );

          if (active) {
            setError(
              "Unable to load the agenda."
            );
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadAgenda();

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

      await updateMeetingAgenda(
        meetingId,
        agenda
      );

      router.back();
    } catch (saveError) {
      console.error(
        "Agenda saving error:",
        saveError
      );

      setError(
        "Unable to save the agenda. Please try again."
      );
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
            Agenda
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading agenda...
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
              Record the topics and items that
              will be discussed during the
              meeting. You may use one line per
              agenda item.
            </Text>

            <TextInput
              style={styles.multilineInput}
              value={agenda}
              onChangeText={setAgenda}
              placeholder={
                "1. Opening\n2. Previous matters\n3. New business\n4. Other matters"
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
                  : "Save Agenda"}
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
    backgroundColor: colors.background,
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
