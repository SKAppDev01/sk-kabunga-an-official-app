import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
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
  createProjectParticipant,
} from "../services/project-participants";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type ParticipantErrors = {
  participantName?: string;
  form?: string;
};

export default function AddProjectParticipantScreen() {
  const params = useLocalSearchParams<{
    projectId?: string | string[];
  }>();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [participantName, setParticipantName] =
    useState("");
  const [participantRole, setParticipantRole] =
    useState("");
  const [contactNumber, setContactNumber] =
    useState("");
  const [notes, setNotes] =
    useState("");
  const [isSaving, setIsSaving] =
    useState(false);
  const [errors, setErrors] =
    useState<ParticipantErrors>({});

  async function handleSave() {
    if (!projectId) {
      setErrors({
        form: "Project information is missing.",
      });
      return;
    }

    const cleanName = participantName.trim();

    if (!cleanName) {
      setErrors({
        participantName:
          "Please enter the participant's name.",
      });
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      const user = await getCurrentSessionUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await createProjectParticipant({
        projectId,
        participantName: cleanName,
        participantRole,
        contactNumber,
        notes,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Add project participant error:",
        error
      );

      setErrors({
        form:
          "Unable to add the participant. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Add Participant
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.introTitle}>
            Project Participant
          </Text>

          <Text style={styles.introText}>
            Add someone to this project's participant
            list. This can later be linked to the
            Youth Registry.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.participantName &&
                  styles.inputError,
              ]}
              value={participantName}
              onChangeText={(text) => {
                setParticipantName(text);
                if (errors.participantName) {
                  setErrors({});
                }
              }}
              placeholder="Enter participant name"
              placeholderTextColor={colors.textMuted}
              editable={!isSaving}
            />

            {errors.participantName && (
              <Text style={styles.errorText}>
                {errors.participantName}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Role / Participation
            </Text>

            <TextInput
              style={styles.input}
              value={participantRole}
              onChangeText={setParticipantRole}
              placeholder="Example: Player, Volunteer"
              placeholderTextColor={colors.textMuted}
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Contact Number
            </Text>

            <TextInput
              style={styles.input}
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Optional"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Notes
            </Text>

            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          {errors.form && (
            <View style={styles.formError}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={colors.danger}
              />
              <Text style={styles.formErrorText}>
                {errors.form}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed &&
                !isSaving &&
                styles.buttonPressed,
              isSaving && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving
                ? "Adding Participant..."
                : "Add Participant"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: { width: 44 },
  scrollView: { flex: 1 },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  introText: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  fieldGroup: { marginBottom: spacing.lg },
  label: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  notesInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },
  formError: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
  },
  formErrorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.danger,
  },
  saveButton: {
    height: 54,
    marginTop: spacing.sm,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.65 },
});
