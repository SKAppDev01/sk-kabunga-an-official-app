import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useEffect, useState } from "react";
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
  getYouthById,
  updateYouthRecord,
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


function parseStorageDate(
  value: string | null
) {
  if (!value) {
    return null;
  }

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

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export default function EditYouthScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const youthId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;
  const [fullName, setFullName] =
    useState("");
  const [birthday, setBirthday] =
    useState<Date | null>(null);
  const [sex, setSex] =
    useState("");
  const [purokSitio, setPurokSitio] =
    useState("");
  const [
    contactNumber,
    setContactNumber,
  ] = useState("");
  const [education, setEducation] =
    useState("");
  const [
    employmentStatus,
    setEmploymentStatus,
  ] = useState("");
  const [
    youthClassification,
    setYouthClassification,
  ] = useState("");

  const [showDatePicker, setShowDatePicker] =
    useState(false);
  const [sexOpen, setSexOpen] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);
  const [errors, setErrors] =
    useState<FormErrors>({});

  const [isLoading, setIsLoading] =
    useState(true);
  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadYouth() {
      if (!youthId) {
        if (active) {
          setNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setNotFound(false);

        const record =
          await getYouthById(youthId);

        if (!active) {
          return;
        }

        if (!record) {
          setNotFound(true);
          return;
        }

        setFullName(record.fullName);
        setBirthday(
          parseStorageDate(
            record.birthday
          )
        );
        setSex(record.sex || "");
        setPurokSitio(
          record.purokSitio || ""
        );
        setContactNumber(
          record.contactNumber || ""
        );
        setEducation(
          record.education || ""
        );
        setEmploymentStatus(
          record.employmentStatus || ""
        );
        setYouthClassification(
          record.youthClassification || ""
        );
      } catch (error) {
        console.error(
          "Load youth for editing error:",
          error
        );

        if (active) {
          setNotFound(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadYouth();

    return () => {
      active = false;
    };
  }, [youthId]);

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
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    if (!selectedDate) {
      return;
    }

    setBirthday(selectedDate);
    clearError("birthday");
    setShowDatePicker(false);
  }

  function handleBirthdayDismiss() {
    setShowDatePicker(false);
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

      if (!youthId) {
        setErrors({
          form:
            "This youth record could not be found.",
        });
        return;
      }

      await updateYouthRecord({
        youthId,
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
      });

      router.back();
    } catch (error) {
      console.error(
        "Update youth record error:",
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
          "YOUTH_NOT_FOUND"
        )
      ) {
        setErrors({
          form:
            "This youth record could not be found.",
        });
        return;
      }

      setErrors({
        form:
          "Unable to save the changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading youth record...
          </Text>
        </View>
      ) : notFound ? (
        <>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.text}
              />
            </Pressable>

            <Text style={styles.headerTitle}>
              Edit Youth
            </Text>

            <View
              style={styles.headerSpacer}
            />
          </View>

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
        </>
      ) : (
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
            Edit Youth
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
            Update this youth record in the local SK Youth
            Registry.
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
                onValueChange={
                  handleBirthdayValueChange
                }
                onDismiss={
                  handleBirthdayDismiss
                }
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
                ? "Saving Changes..."
                : "Save Changes"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  headerSpacer: {
    width: 44,
  },

  scrollView: {
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
    textAlign: "center",
  },

  stateText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
