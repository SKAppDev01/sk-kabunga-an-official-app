import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
  getCurrentSessionUser,
} from "../services/session";
import {
  createYouthRecord,
} from "../services/youth";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type FormErrors = {
  fullName?: string;
  birthday?: string;
  form?: string;
};

const SEX_OPTIONS = [
  "Male",
  "Female",
  "Prefer not to say",
];

type AddYouthParams = {
  profileId?: string | string[];
  fullName?: string | string[];
  birthday?: string | string[];
  sex?: string | string[];
  purokSitio?: string | string[];
  education?: string | string[];
  employmentStatus?: string | string[];
  youthClassification?: string | string[];
};

function readParam(
  value?: string | string[]
) {
  return (
    Array.isArray(value)
      ? value[0]
      : value
  )?.trim() || "";
}

function parseStorageDate(
  value: string
) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

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

export default function AddYouthScreen() {
  const params =
    useLocalSearchParams<AddYouthParams>();

  const profileId =
    readParam(params.profileId);

  const [fullName, setFullName] =
    useState(() =>
      readParam(params.fullName)
    );
  const [birthday, setBirthday] =
    useState<Date | null>(() =>
      parseStorageDate(
        readParam(params.birthday)
      )
    );
  const [sex, setSex] =
    useState(() =>
      readParam(params.sex)
    );
  const [purokSitio, setPurokSitio] =
    useState(() =>
      readParam(params.purokSitio)
    );
  const [
    contactNumber,
    setContactNumber,
  ] = useState("");
  const [education, setEducation] =
    useState(() =>
      readParam(params.education)
    );
  const [
    employmentStatus,
    setEmploymentStatus,
  ] = useState(() =>
    readParam(params.employmentStatus)
  );
  const [
    youthClassification,
    setYouthClassification,
  ] = useState(() =>
    readParam(params.youthClassification)
  );

  const [showDatePicker, setShowDatePicker] =
    useState(false);
  const [sexOpen, setSexOpen] =
    useState(false);
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

  function handleBirthdayValueChange(
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

    setBirthday(selectedDate);
    clearError("birthday");
  }

  async function handleSave() {
    const cleanName =
      fullName.trim();

    if (!cleanName) {
      setErrors({
        fullName:
          "Please enter the youth's full name.",
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

      await createYouthRecord({
        profileId,
        fullName: cleanName,
        birthday: birthday
          ? formatDateForStorage(
              birthday
            )
          : "",
        sex,
        purokSitio,
        contactNumber,
        education,
        employmentStatus,
        youthClassification,
        createdBy: user.id,
      });

      router.back();
    } catch (error) {
      console.error(
        "Create youth record error:",
        error
      );

      const message = String(error);

      if (
        message.includes(
          "INVALID_BIRTHDAY"
        ) ||
        message.includes(
          "BIRTHDAY_IN_FUTURE"
        )
      ) {
        setErrors({
          birthday:
            "Please choose a valid birthday.",
        });
        return;
      }

      if (
        message.includes(
          "PROFILE_ALREADY_REGISTERED"
        )
      ) {
        setErrors({
          form:
            "This Profile QR is already linked to a Youth Registry record.",
        });
        return;
      }

      setErrors({
        form:
          "Unable to save the youth record. Please try again.",
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
            Add Youth
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
          <Text style={styles.introTitle}>
            Youth Information
          </Text>

          <Text style={styles.introText}>
            {profileId
              ? "Review the information scanned from the Profile QR before saving it to the Youth Registry."
              : "Add a youth record to the local SK Youth Registry."}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <TextInput
              style={[
                styles.input,
                errors.fullName &&
                  styles.inputError,
              ]}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);

                if (errors.fullName) {
                  clearError("fullName");
                }
              }}
              placeholder="Example: Juan Dela Cruz"
              placeholderTextColor={
                colors.textMuted
              }
              autoCapitalize="words"
              editable={!isSaving}
            />

            {errors.fullName && (
              <Text
                style={styles.errorText}
              >
                {errors.fullName}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Birthday
            </Text>

            <Pressable
              style={[
                styles.selector,
                errors.birthday &&
                  styles.inputError,
              ]}
              onPress={() =>
                setShowDatePicker(true)
              }
              disabled={isSaving}
            >
              <View
                style={
                  styles.selectorLeft
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={
                    birthday
                      ? colors.primary
                      : colors.textMuted
                  }
                />

                <Text
                  style={[
                    styles.selectorText,
                    !birthday &&
                      styles.placeholderText,
                  ]}
                >
                  {birthday
                    ? formatDateForDisplay(
                        birthday
                      )
                    : "Select birthday"}
                </Text>
              </View>

              {birthday ? (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    setBirthday(null);
                  }}
                  hitSlop={10}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              ) : null}
            </Pressable>

            {errors.birthday && (
              <Text
                style={styles.errorText}
              >
                {errors.birthday}
              </Text>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={
                  birthday ||
                  new Date(
                    new Date().getFullYear() -
                      18,
                    0,
                    1
                  )
                }
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleBirthdayValueChange}
              />
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Sex
            </Text>

            <Pressable
              style={styles.selector}
              onPress={() =>
                setSexOpen(
                  (current) => !current
                )
              }
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.selectorText,
                  !sex &&
                    styles.placeholderText,
                ]}
              >
                {sex || "Select sex"}
              </Text>

              <Ionicons
                name={
                  sexOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={20}
                color={
                  colors.textSecondary
                }
              />
            </Pressable>

            {sexOpen && (
              <View
                style={
                  styles.dropdownMenu
                }
              >
                {SEX_OPTIONS.map(
                  (option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.dropdownOption,
                        sex === option &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSex(option);
                        setSexOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          sex === option &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>

                      {sex === option && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={
                            colors.primary
                          }
                        />
                      )}
                    </Pressable>
                  )
                )}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Purok / Sitio
            </Text>

            <TextInput
              style={styles.input}
              value={purokSitio}
              onChangeText={setPurokSitio}
              placeholder="Example: Purok 2"
              placeholderTextColor={
                colors.textMuted
              }
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
              onChangeText={
                setContactNumber
              }
              placeholder="Example: 09123456789"
              placeholderTextColor={
                colors.textMuted
              }
              keyboardType="phone-pad"
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Education
            </Text>

            <TextInput
              style={styles.input}
              value={education}
              onChangeText={setEducation}
              placeholder="Example: College"
              placeholderTextColor={
                colors.textMuted
              }
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Employment Status
            </Text>

            <TextInput
              style={styles.input}
              value={employmentStatus}
              onChangeText={
                setEmploymentStatus
              }
              placeholder="Example: Student"
              placeholderTextColor={
                colors.textMuted
              }
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Youth Classification
            </Text>

            <TextInput
              style={styles.input}
              value={youthClassification}
              onChangeText={
                setYouthClassification
              }
              placeholder="Optional"
              placeholderTextColor={
                colors.textMuted
              }
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

              <Text
                style={
                  styles.formErrorText
                }
              >
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
              isSaving &&
                styles.buttonDisabled,
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
                ? "Saving Youth..."
                : "Add Youth"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
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
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },

  selector: {
    elevation: 2,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  selectorLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm,
  },

  selectorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  placeholderText: {
    color: colors.textMuted,
  },

  dropdownMenu: {
    elevation: 2,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    overflow: "hidden",
  },

  dropdownOption: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  dropdownOptionSelected: {
    backgroundColor:
      "rgba(37,99,235,0.06)",
  },

  dropdownOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  dropdownOptionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },

  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
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
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.65,
  },
});
