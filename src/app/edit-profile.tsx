import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
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

import { CivicBackground } from "../components/CivicBackground";
import {
  getOrCreatePersonalProfile,
  PersonalProfile,
  savePersonalProfile,
} from "../services/personal-profile";
import {
  getCurrentSessionUser,
  SessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

const SEX_OPTIONS = [
  "Male",
  "Female",
  "Prefer not to say",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


function parseBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatBirthDate(value: string) {
  const date = parseBirthDate(value);

  if (!date) {
    return "Select your birthday";
  }

  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function isFutureDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  return candidate.getTime() > today.getTime();
}

function getInitialBirthdayPickerDate(value: string) {
  const savedDate = parseBirthDate(value);

  if (savedDate) {
    return savedDate;
  }

  const suggested = new Date();
  suggested.setHours(0, 0, 0, 0);
  suggested.setFullYear(
    suggested.getFullYear() - 18
  );

  return suggested;
}

function isValidBirthDate(value: string) {
  const date = parseBirthDate(value);
  return Boolean(date && !isFutureDate(date));
}

export default function EditProfileScreen() {
  const [user, setUser] =
    useState<SessionUser | null>(null);
  const [profile, setProfile] =
    useState<PersonalProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [purokSitio, setPurokSitio] = useState("");
  const [contactNumber, setContactNumber] =
    useState("");
  const [educationStatus, setEducationStatus] =
    useState("");
  const [employmentStatus, setEmploymentStatus] =
    useState("");
  const [youthClassification, setYouthClassification] =
    useState("");
  const [showSexOptions, setShowSexOptions] =
    useState(false);
  const [showBirthdayPicker, setShowBirthdayPicker] =
    useState(false);
  const [birthdayPickerDate, setBirthdayPickerDate] =
    useState(() =>
      getInitialBirthdayPickerDate("")
    );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);
          setError("");

          const currentUser =
            await getCurrentSessionUser();

          if (!active) return;

          if (!currentUser) {
            router.replace("/login");
            return;
          }

          const currentProfile =
            await getOrCreatePersonalProfile(
              currentUser
            );

          if (!active) return;

          setUser(currentUser);
          setProfile(currentProfile);
          setFullName(currentProfile.fullName);
          setBirthDate(currentProfile.birthDate);
          setBirthdayPickerDate(
            getInitialBirthdayPickerDate(
              currentProfile.birthDate
            )
          );
          setSex(currentProfile.sex);
          setPurokSitio(currentProfile.purokSitio);
          setContactNumber(
            currentProfile.contactNumber
          );
          setEducationStatus(
            currentProfile.educationStatus
          );
          setEmploymentStatus(
            currentProfile.employmentStatus
          );
          setYouthClassification(
            currentProfile.youthClassification
          );
        } catch (loadError) {
          console.error(
            "Edit profile loading error:",
            loadError
          );
          if (active) {
            setError(
              "Unable to load your profile. Please try again."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [])
  );

  function openBirthdayPicker() {
    setBirthdayPickerDate(
      getInitialBirthdayPickerDate(birthDate)
    );
    setShowBirthdayPicker(true);
  }

  function handleBirthdayChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    setShowBirthdayPicker(false);

    if (
      event.type === "dismissed" ||
      !selectedDate
    ) {
      return;
    }

    if (isFutureDate(selectedDate)) {
      return;
    }

    setBirthdayPickerDate(selectedDate);
    setBirthDate(toIsoDate(selectedDate));
    setError("");
  }

  async function handleSave() {
    if (!user || !profile || saving) return;

    const cleanName = fullName.trim();
    const cleanBirthDate = birthDate.trim();
    const cleanSex = sex.trim();
    const cleanPurok = purokSitio.trim();

    if (!cleanName) {
      setError("Full name is required.");
      return;
    }

    if (!isValidBirthDate(cleanBirthDate)) {
      setError(
        "Please choose a valid birthday."
      );
      return;
    }

    if (!cleanSex) {
      setError("Please select your sex.");
      return;
    }

    if (!cleanPurok) {
      setError("Purok / Sitio is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await savePersonalProfile({
        userId: user.id,
        profileId: profile.profileId,
        fullName: cleanName,
        birthDate: cleanBirthDate,
        sex: cleanSex,
        purokSitio: cleanPurok,
        contactNumber: contactNumber.trim(),
        educationStatus: educationStatus.trim(),
        employmentStatus: employmentStatus.trim(),
        youthClassification:
          youthClassification.trim(),
      });

      Alert.alert(
        "Profile Updated",
        "Your personal profile has been saved on this device.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (saveError) {
      console.error(
        "Save personal profile error:",
        saveError
      );
      setError(
        "Unable to save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.background}>
      <CivicBackground />

      <SafeAreaView
        style={styles.safeArea}
      edges={["left", "right", "bottom"]}
      >
        <AppHeader
          title="Edit Profile"
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
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            <Text style={styles.introText}>
              Complete the required information to enable your SK Local Profile QR for attendance and Youth Registration.
            </Text>

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#B91C1C"
                />
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Field
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              editable={!loading && !saving}
            />

            <View style={styles.field}>
              <Text style={styles.label}>
                Birthday *
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.birthdayPicker,
                  pressed && styles.pressed,
                  (loading || saving) &&
                    styles.disabledButton,
                ]}
                onPress={openBirthdayPicker}
                disabled={loading || saving}
                accessibilityRole="button"
                accessibilityLabel="Choose birthday"
              >
                <Text
                  style={[
                    styles.birthdayPickerText,
                    !birthDate &&
                      styles.placeholderText,
                  ]}
                >
                  {formatBirthDate(birthDate)}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color={colors.primary}
                />
              </Pressable>

              <Text style={styles.fieldHint}>
                Tap to choose your birthday.
              </Text>
            </View>

            <Text style={styles.label}>
              Sex *
            </Text>

            <Pressable
              style={styles.selectBox}
              onPress={() =>
                setShowSexOptions(
                  (current) => !current
                )
              }
              disabled={loading || saving}
            >
              <Text
                style={[
                  styles.selectText,
                  !sex && styles.placeholderText,
                ]}
              >
                {sex || "Select"}
              </Text>

              <Ionicons
                name={
                  showSexOptions
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={19}
                color={colors.textSecondary}
              />
            </Pressable>

            {showSexOptions ? (
              <View style={styles.optionsBox}>
                {SEX_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    style={styles.option}
                    onPress={() => {
                      setSex(option);
                      setShowSexOptions(false);
                    }}
                  >
                    <Text style={styles.optionText}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Field
              label="Purok / Sitio *"
              value={purokSitio}
              onChangeText={setPurokSitio}
              placeholder="Example: Purok 2"
              editable={!loading && !saving}
            />

            <Field
              label="Contact Number"
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Optional"
              keyboardType="phone-pad"
              editable={!loading && !saving}
            />

            <Field
              label="Education Status"
              value={educationStatus}
              onChangeText={setEducationStatus}
              placeholder="Example: College / In School"
              editable={!loading && !saving}
            />

            <Field
              label="Employment Status"
              value={employmentStatus}
              onChangeText={setEmploymentStatus}
              placeholder="Example: Student / Employed"
              editable={!loading && !saving}
            />

            <Field
              label="Youth Classification"
              value={youthClassification}
              onChangeText={setYouthClassification}
              placeholder="Example: In-School Youth"
              editable={!loading && !saving}
            />

            <View style={styles.qrPrivacyNote}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color={colors.primary}
              />
              <Text style={styles.qrPrivacyText}>
                Your contact number stays in your local profile and is not included in the Profile QR by default.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && !saving && styles.pressed,
                (loading || saving) &&
                  styles.disabledButton,
              ]}
              disabled={loading || saving}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {saving
                  ? "Saving..."
                  : "Save Profile"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showBirthdayPicker && (
        <DateTimePicker
          value={birthdayPickerDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleBirthdayChange}
        />
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?:
    | "default"
    | "phone-pad"
    | "numbers-and-punctuation";
  editable: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? "default"}
        autoCorrect={false}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.88)",
  },



  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  introText: {
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  errorCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
  },

  errorText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  input: {
    elevation: 2,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: typography.fontSize.md,
  },

  birthdayPicker: {
    elevation: 2,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  birthdayPickerText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSize.md,
  },

  fieldHint: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },

  selectBox: {
    elevation: 3,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  selectText: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    color: colors.text,
    fontSize: typography.fontSize.md,
  },

  placeholderText: {
    color: colors.textMuted,
  },

  optionsBox: {
    elevation: 3,
    marginBottom: spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  optionText: {
    color: colors.text,
    fontSize: typography.fontSize.md,
  },

  qrPrivacyNote: {

    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },

  qrPrivacyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },


  saveButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primary,
  },

  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },

  disabledButton: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.8,
  },
});
