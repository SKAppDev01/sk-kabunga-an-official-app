import { Ionicons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useState } from "react";
import {
    Image,
    ImageBackground,
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

import { updateLocalProfile } from "../services/auth";
import {
    colors,
    spacing,
    typography,
} from "../theme";

const SK_ROLES = [
  {
    value: "Chairperson",
    icon: "person-outline" as const,
  },
  {
    value: "Secretary",
    icon: "document-text-outline" as const,
  },
  {
    value: "Treasurer",
    icon: "wallet-outline" as const,
  },
  {
    value: "Kagawad",
    icon: "people-outline" as const,
  },
];

type ProfileErrors = {
  fullName?: string;
  role?: string;
  form?: string;
};

export default function ProfileSetupScreen() {
  const params =
    useLocalSearchParams<{
      userId?: string;
      username?: string;
    }>();

  const userId =
    typeof params.userId === "string"
      ? params.userId
      : "";

  const username =
    typeof params.username === "string"
      ? params.username
      : "";

  const [fullName, setFullName] =
    useState("");

  const [role, setRole] =
    useState("");

  const [
    showRolePicker,
    setShowRolePicker,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errors, setErrors] =
    useState<ProfileErrors>({});

  function clearError(
    field: keyof ProfileErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  function getRoleIcon() {
    const selectedRole =
      SK_ROLES.find(
        (item) =>
          item.value === role
      );

    return (
      selectedRole?.icon ??
      "briefcase-outline"
    );
  }

  function handleSelectRole(
    selectedRole: string
  ) {
    setRole(selectedRole);
    setShowRolePicker(false);

    if (errors.role) {
      clearError("role");
    }
  }

  async function handleContinue() {
    const cleanFullName =
      fullName.trim();

    const newErrors: ProfileErrors =
      {};

    if (!userId) {
      newErrors.form =
        "Account information could not be loaded. Please sign in again.";
    }

    if (!cleanFullName) {
      newErrors.fullName =
        "Please enter your full name.";
    } else if (
      cleanFullName.length < 3
    ) {
      newErrors.fullName =
        "Please enter your complete name.";
    }

    if (!role) {
      newErrors.role =
        "Please select your SK position.";
    }

    if (
      Object.keys(newErrors).length >
      0
    ) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});
      setShowRolePicker(false);

      await updateLocalProfile({
        userId,
        fullName: cleanFullName,
        role,
      });

      router.replace("/dashboard");
    } catch (error) {
      console.error(
        "Profile setup error:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "USER_NOT_FOUND"
      ) {
        setErrors({
          form:
            "This local account could not be found. Please sign in again.",
        });

        return;
      }

      setErrors({
        form:
          "Something went wrong while saving your profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ImageBackground
      source={require("../../assets/images/login-background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
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
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo and Header */}
            <View style={styles.header}>
              <Image
                source={require("../../assets/images/sk-kabunga-an-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.title}>
                Complete Profile
              </Text>

              <Text
                style={styles.subtitle}
              >
                Set up your SK official
                information
              </Text>
            </View>

            {/* Account */}
            <View
              style={styles.accountCard}
            >
              <View
                style={
                  styles.accountIcon
                }
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View
                style={
                  styles.accountInfo
                }
              >
                <Text
                  style={
                    styles.accountLabel
                  }
                >
                  Account
                </Text>

                <Text
                  style={
                    styles.accountUsername
                  }
                >
                  {username ||
                    "Local Account"}
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              {/* Full Name */}
              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={styles.label}
                >
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

                    if (
                      errors.fullName
                    ) {
                      clearError(
                        "fullName"
                      );
                    }
                  }}
                  onFocus={() =>
                    setShowRolePicker(
                      false
                    )
                  }
                  placeholder="Enter your full name"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSaving}
                />

                {errors.fullName && (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {errors.fullName}
                  </Text>
                )}
              </View>

              {/* SK Position */}
              <View
                style={[
                  styles.roleFieldGroup,
                  showRolePicker &&
                    styles.roleFieldGroupOpen,
                ]}
              >
                <Text
                  style={styles.label}
                >
                  SK Position
                </Text>

                <View
                  style={
                    styles.dropdownWrapper
                  }
                >
                  <Pressable
                    style={[
                      styles.roleSelector,
                      errors.role &&
                        styles.inputError,
                      showRolePicker &&
                        styles.roleSelectorOpen,
                    ]}
                    onPress={() => {
                      setShowRolePicker(
                        (current) =>
                          !current
                      );

                      if (errors.role) {
                        clearError(
                          "role"
                        );
                      }
                    }}
                    disabled={isSaving}
                  >
                    <View
                      style={
                        styles.roleSelectorLeft
                      }
                    >
                      <Ionicons
                        name={
                          getRoleIcon()
                        }
                        size={22}
                        color={
                          role
                            ? colors.primary
                            : colors.textMuted
                        }
                      />

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.roleSelectorText,
                          !role &&
                            styles.placeholderText,
                        ]}
                      >
                        {role ||
                          "Select your SK position"}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        showRolePicker
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                      size={21}
                      color={
                        colors.textSecondary
                      }
                    />
                  </Pressable>

                  {/* Dropdown */}
                  {showRolePicker && (
                    <View
                      style={
                        styles.dropdownMenu
                      }
                    >
                      {SK_ROLES.map(
                        (
                          item,
                          index
                        ) => {
                          const isSelected =
                            role ===
                            item.value;

                          return (
                            <Pressable
                              key={
                                item.value
                              }
                              style={({
                                pressed,
                              }) => [
                                styles.dropdownOption,

                                index ===
                                  SK_ROLES.length -
                                    1 &&
                                  styles.lastDropdownOption,

                                isSelected &&
                                  styles.dropdownOptionSelected,

                                pressed &&
                                  styles.dropdownOptionPressed,
                              ]}
                              onPress={() =>
                                handleSelectRole(
                                  item.value
                                )
                              }
                            >
                              <View
                                style={
                                  styles.dropdownOptionLeft
                                }
                              >
                                <Ionicons
                                  name={
                                    item.icon
                                  }
                                  size={
                                    21
                                  }
                                  color={
                                    isSelected
                                      ? colors.primary
                                      : colors.textSecondary
                                  }
                                />

                                <Text
                                  style={[
                                    styles.dropdownOptionText,
                                    isSelected &&
                                      styles.dropdownOptionTextSelected,
                                  ]}
                                >
                                  {
                                    item.value
                                  }
                                </Text>
                              </View>

                              {isSelected && (
                                <Ionicons
                                  name="checkmark"
                                  size={21}
                                  color={
                                    colors.primary
                                  }
                                />
                              )}
                            </Pressable>
                          );
                        }
                      )}
                    </View>
                  )}
                </View>

                {errors.role && (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {errors.role}
                  </Text>
                )}
              </View>

              {/* General Error */}
              {errors.form && (
                <View
                  style={
                    styles.formErrorBox
                  }
                >
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

              {/* Continue */}
              <Pressable
                onPress={
                  handleContinue
                }
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.continueButton,

                  pressed &&
                    !isSaving &&
                    styles.buttonPressed,

                  isSaving &&
                    styles.buttonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.continueButtonText
                  }
                >
                  {isSaving
                    ? "Saving Profile..."
                    : "Continue"}
                </Text>
              </Pressable>

              {/* Back */}
              <Pressable
                style={styles.backButton}
                onPress={() =>
                  router.replace(
                    "/login"
                  )
                }
                disabled={isSaving}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text
                  style={
                    styles.backText
                  }
                >
                  Back to Sign In
                </Text>
              </Pressable>
            </View>

            <Text style={styles.footer}>
              Your profile information
              stays on this device.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize:
      typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },

  accountCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: spacing.xl,
    backgroundColor:
      "rgba(255,255,255,0.94)",
  },

  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  accountInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  accountLabel: {
    fontSize:
      typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
  },

  accountUsername: {
    marginTop: 2,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  form: {
    width: "100%",
  },

  fieldGroup: {
    marginBottom: spacing.lg,
  },

  roleFieldGroup: {
    marginBottom: spacing.xl,
    zIndex: 100,
  },

  roleFieldGroupOpen: {
    zIndex: 1000,
  },

  label: {
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize:
      typography.fontSize.md,
    color: colors.text,
    backgroundColor:
      "rgba(255,255,255,0.95)",
  },

  dropdownWrapper: {
    position: "relative",
    zIndex: 1000,
  },

  roleSelector: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor:
      "rgba(255,255,255,0.95)",
  },

  roleSelectorOpen: {
    borderColor: colors.primary,
  },

  roleSelectorLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm,
  },

  roleSelectorText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize:
      typography.fontSize.md,
    color: colors.text,
  },

  placeholderText: {
    color: colors.textMuted,
  },

  dropdownMenu: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,

    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,

    backgroundColor: colors.white,

    overflow: "hidden",

    elevation: 10,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    zIndex: 2000,
  },

  dropdownOption: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    paddingHorizontal: spacing.lg,

    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,

    backgroundColor:
      colors.white,
  },

  lastDropdownOption: {
    borderBottomWidth: 0,
  },

  dropdownOptionSelected: {
    backgroundColor:
      "rgba(37,99,235,0.07)",
  },

  dropdownOptionPressed: {
    opacity: 0.7,
  },

  dropdownOptionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  dropdownOptionText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize:
      typography.fontSize.md,
    color: colors.text,
  },

  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight:
      typography.fontWeight.semibold,
  },

  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },

  errorText: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.xs,
    color: colors.danger,
  },

  formErrorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor:
      "rgba(255,255,255,0.95)",
  },

  formErrorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    color: colors.danger,
    lineHeight: 19,
  },

  continueButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  continueButtonText: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  backButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },

  backText: {
    marginLeft: spacing.xs,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  footer: {
    marginTop: "auto",
    paddingTop: spacing.lg,
    textAlign: "center",
    fontSize:
      typography.fontSize.xs,
    color: colors.textSecondary,
  },
});