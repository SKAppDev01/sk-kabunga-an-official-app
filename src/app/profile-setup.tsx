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

import {
  savePendingFullName,
  updateLocalProfile,
} from "../services/auth";
import {
  YOUTH_MEMBER_ROLE,
} from "../services/authorization";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type AccountType =
  | "youth_member"
  | "official"
  | "";

type ProfileErrors = {
  fullName?: string;
  accountType?: string;
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

  const [accountType, setAccountType] =
    useState<AccountType>("");

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

    if (!accountType) {
      newErrors.accountType =
        "Please choose your account type.";
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

      if (
        accountType === "youth_member"
      ) {
        await updateLocalProfile({
          userId,
          fullName: cleanFullName,
          role: YOUTH_MEMBER_ROLE,
        });

        router.replace("/home");
        return;
      }

      await savePendingFullName({
        userId,
        fullName: cleanFullName,
      });

      router.replace({
        pathname:
          "/official-verification",
        params: {
          userId,
          username,
          fullName: cleanFullName,
        },
      });
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
                Choose how you will use the
                SK Kabunga-an app
              </Text>
            </View>

            <View
              style={styles.accountCard}
            >
              <View
                style={styles.accountIcon}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View
                style={styles.accountInfo}
              >
                <Text
                  style={styles.accountLabel}
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
              <View
                style={styles.fieldGroup}
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
                    style={styles.errorText}
                  >
                    {errors.fullName}
                  </Text>
                )}
              </View>

              <Text style={styles.label}>
                Account Type
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.typeCard,
                  accountType ===
                    "youth_member" &&
                    styles.typeCardSelected,
                  pressed &&
                    styles.cardPressed,
                ]}
                onPress={() => {
                  setAccountType(
                    "youth_member"
                  );
                  clearError(
                    "accountType"
                  );
                }}
                disabled={isSaving}
              >
                <View
                  style={
                    styles.typeIcon
                  }
                >
                  <Ionicons
                    name="people-outline"
                    size={25}
                    color={
                      accountType ===
                      "youth_member"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>

                <View
                  style={
                    styles.typeContent
                  }
                >
                  <Text
                    style={
                      styles.typeTitle
                    }
                  >
                    SK Youth Member
                  </Text>

                  <Text
                    style={
                      styles.typeDescription
                    }
                  >
                    Read-only access to
                    projects, finances and
                    records made available
                    for youth members.
                  </Text>
                </View>

                <Ionicons
                  name={
                    accountType ===
                    "youth_member"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color={
                    accountType ===
                    "youth_member"
                      ? colors.primary
                      : colors.textMuted
                  }
                />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.typeCard,
                  accountType ===
                    "official" &&
                    styles.typeCardSelected,
                  pressed &&
                    styles.cardPressed,
                ]}
                onPress={() => {
                  setAccountType(
                    "official"
                  );
                  clearError(
                    "accountType"
                  );
                }}
                disabled={isSaving}
              >
                <View
                  style={
                    styles.typeIcon
                  }
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={25}
                    color={
                      accountType ===
                      "official"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>

                <View
                  style={
                    styles.typeContent
                  }
                >
                  <Text
                    style={
                      styles.typeTitle
                    }
                  >
                    SK Official
                  </Text>

                  <Text
                    style={
                      styles.typeDescription
                    }
                  >
                    Chairperson, Secretary,
                    Treasurer or Kagawad.
                    Official verification is
                    required before access is
                    granted.
                  </Text>
                </View>

                <Ionicons
                  name={
                    accountType ===
                    "official"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color={
                    accountType ===
                    "official"
                      ? colors.primary
                      : colors.textMuted
                  }
                />
              </Pressable>

              {errors.accountType && (
                <Text
                  style={[
                    styles.errorText,
                    styles.accountTypeError,
                  ]}
                >
                  {errors.accountType}
                </Text>
              )}

              <View
                style={styles.securityNote}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={colors.textSecondary}
                />

                <Text
                  style={
                    styles.securityNoteText
                  }
                >
                  Official positions can no
                  longer be selected freely.
                  A verified authorization is
                  required.
                </Text>
              </View>

              {errors.form && (
                <View
                  style={styles.formErrorBox}
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

              <Pressable
                onPress={handleContinue}
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
                    ? "Saving..."
                    : "Continue"}
                </Text>
              </Pressable>

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
                  style={styles.backText}
                >
                  Back to Sign In
                </Text>
              </Pressable>
            </View>

            <Text style={styles.footer}>
              Your local account remains
              stored on this device.
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
    width: 112,
    height: 112,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },

  accountCard: {
    elevation: 3,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
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
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
  },

  accountUsername: {
    marginTop: 2,
    fontSize: typography.fontSize.md,
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

  label: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  input: {
    elevation: 2,
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
  },

  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },

  typeCard: {
    elevation: 3,
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  typeCardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: "#EFF6FF",
  },

  cardPressed: {
    opacity: 0.72,
  },

  typeIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  typeContent: {
    flex: 1,
    marginHorizontal: spacing.md,
  },

  typeTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  typeDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  accountTypeError: {
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },

  securityNote: {
    elevation: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },

  securityNoteText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.danger,
  },

  formErrorBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },

  formErrorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.danger,
  },

  continueButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  continueButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  backButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },

  backText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  footer: {
    marginTop: spacing.xl,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
});
