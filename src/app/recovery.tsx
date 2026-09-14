import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
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
    getRecoveryQuestion,
    resetPasswordWithRecovery,
} from "../services/auth";
import { colors, spacing, typography } from "../theme";

type RecoveryErrors = {
  username?: string;
  recoveryAnswer?: string;
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

export default function RecoveryScreen() {
  const [username, setUsername] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] =
    useState("");

  const [recoveryAnswer, setRecoveryAnswer] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [
    showRecoveryAnswer,
    setShowRecoveryAnswer,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [step, setStep] = useState<
    "username" | "reset"
  >("username");

  const [isLoading, setIsLoading] =
    useState(false);

  const [errors, setErrors] =
    useState<RecoveryErrors>({});

  function clearError(
    field: keyof RecoveryErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleFindAccount() {
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setErrors({
        username:
          "Please enter your username.",
      });
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      const result =
        await getRecoveryQuestion(
          cleanUsername
        );

      setUsername(result.username);

      setRecoveryQuestion(
        result.recoveryQuestion
      );

      setStep("reset");
    } catch (error) {
      console.error(
        "Recovery lookup error:",
        error
      );

      if (
        error instanceof Error &&
        error.message === "USER_NOT_FOUND"
      ) {
        setErrors({
          username:
            "No local account was found with that username.",
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message ===
          "RECOVERY_NOT_SETUP"
      ) {
        setErrors({
          username:
            "This account does not have recovery information.",
        });
        return;
      }

      setErrors({
        form:
          "Something went wrong while finding the account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword() {
    const cleanAnswer =
      recoveryAnswer.trim();

    const newErrors: RecoveryErrors = {};

    if (!cleanAnswer) {
      newErrors.recoveryAnswer =
        "Please enter your recovery answer.";
    }

    if (!newPassword) {
      newErrors.newPassword =
        "Please enter a new password.";
    } else if (newPassword.length < 6) {
      newErrors.newPassword =
        "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your new password.";
    } else if (
      newPassword !== confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (
      Object.keys(newErrors).length > 0
    ) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      await resetPasswordWithRecovery({
        username,
        recoveryAnswer: cleanAnswer,
        newPassword,
      });

      Alert.alert(
        "Password Reset",
        "Your password was changed successfully.",
        [
          {
            text: "Sign In",
            onPress: () =>
              router.replace("/login"),
          },
        ]
      );
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "INVALID_RECOVERY_ANSWER"
      ) {
        setErrors({
          recoveryAnswer:
            "The recovery answer you entered is incorrect.",
        });
        return;
      }

      setErrors({
        form:
          "Something went wrong while resetting your password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleChangeAccount() {
    setStep("username");

    setRecoveryQuestion("");
    setRecoveryAnswer("");
    setNewPassword("");
    setConfirmPassword("");

    setShowRecoveryAnswer(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setErrors({});
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >
            <View style={styles.header}>
              <Image
                source={require("../../assets/images/sk-kabunga-an-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.title}>
                Recover Account
              </Text>

              <Text style={styles.subtitle}>
                Reset your password using
                your recovery question
              </Text>
            </View>

            {step === "username" ? (
              <View style={styles.form}>
                <View
                  style={styles.fieldGroup}
                >
                  <Text style={styles.label}>
                    Username
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      errors.username &&
                        styles.inputError,
                    ]}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);

                      if (
                        errors.username
                      ) {
                        clearError(
                          "username"
                        );
                      }
                    }}
                    placeholder="Enter your username"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    onSubmitEditing={
                      handleFindAccount
                    }
                  />

                  {errors.username && (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {errors.username}
                    </Text>
                  )}
                </View>

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

                <Pressable
                  onPress={
                    handleFindAccount
                  }
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed &&
                      !isLoading &&
                      styles.buttonPressed,
                    isLoading &&
                      styles.buttonDisabled,
                  ]}
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    {isLoading
                      ? "Finding Account..."
                      : "Continue"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <View
                  style={styles.accountBox}
                >
                  <View
                    style={
                      styles.accountHeader
                    }
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={24}
                      color={colors.primary}
                    />

                    <Text
                      style={
                        styles.accountUsername
                      }
                    >
                      {username}
                    </Text>
                  </View>

                  <Pressable
                    onPress={
                      handleChangeAccount
                    }
                    disabled={isLoading}
                  >
                    <Text
                      style={
                        styles.changeAccountText
                      }
                    >
                      Change account
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.label}>
                  Recovery Question
                </Text>

                <View
                  style={
                    styles.questionBox
                  }
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={21}
                    color={colors.primary}
                  />

                  <Text
                    style={
                      styles.questionText
                    }
                  >
                    {recoveryQuestion}
                  </Text>
                </View>

                <View
                  style={styles.fieldGroup}
                >
                  <Text style={styles.label}>
                    Recovery Answer
                  </Text>

                  <View
                    style={[
                      styles.passwordContainer,
                      errors.recoveryAnswer &&
                        styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={
                        styles.passwordInput
                      }
                      value={recoveryAnswer}
                      onChangeText={(text) => {
                        setRecoveryAnswer(
                          text
                        );

                        if (
                          errors.recoveryAnswer
                        ) {
                          clearError(
                            "recoveryAnswer"
                          );
                        }
                      }}
                      placeholder="Enter your answer"
                      placeholderTextColor={
                        colors.textMuted
                      }
                      secureTextEntry={
                        !showRecoveryAnswer
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />

                    <Pressable
                      style={
                        styles.eyeButton
                      }
                      onPress={() =>
                        setShowRecoveryAnswer(
                          (current) =>
                            !current
                        )
                      }
                      hitSlop={8}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={
                          showRecoveryAnswer
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={23}
                        color={
                          colors.textSecondary
                        }
                      />
                    </Pressable>
                  </View>

                  {errors.recoveryAnswer && (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        errors.recoveryAnswer
                      }
                    </Text>
                  )}
                </View>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Create New Password
                </Text>

                <View
                  style={styles.fieldGroup}
                >
                  <Text style={styles.label}>
                    New Password
                  </Text>

                  <View
                    style={[
                      styles.passwordContainer,
                      errors.newPassword &&
                        styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={
                        styles.passwordInput
                      }
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);

                        if (
                          errors.newPassword
                        ) {
                          clearError(
                            "newPassword"
                          );
                        }

                        if (
                          errors.confirmPassword
                        ) {
                          clearError(
                            "confirmPassword"
                          );
                        }
                      }}
                      placeholder="Enter new password"
                      placeholderTextColor={
                        colors.textMuted
                      }
                      secureTextEntry={
                        !showNewPassword
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />

                    <Pressable
                      style={
                        styles.eyeButton
                      }
                      onPress={() =>
                        setShowNewPassword(
                          (current) =>
                            !current
                        )
                      }
                      hitSlop={8}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={
                          showNewPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={23}
                        color={
                          colors.textSecondary
                        }
                      />
                    </Pressable>
                  </View>

                  {errors.newPassword && (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {errors.newPassword}
                    </Text>
                  )}
                </View>

                <View
                  style={styles.fieldGroup}
                >
                  <Text style={styles.label}>
                    Confirm New Password
                  </Text>

                  <View
                    style={[
                      styles.passwordContainer,
                      errors.confirmPassword &&
                        styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={
                        styles.passwordInput
                      }
                      value={
                        confirmPassword
                      }
                      onChangeText={(text) => {
                        setConfirmPassword(
                          text
                        );

                        if (
                          errors.confirmPassword
                        ) {
                          clearError(
                            "confirmPassword"
                          );
                        }
                      }}
                      placeholder="Confirm new password"
                      placeholderTextColor={
                        colors.textMuted
                      }
                      secureTextEntry={
                        !showConfirmPassword
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      onSubmitEditing={
                        handleResetPassword
                      }
                    />

                    <Pressable
                      style={
                        styles.eyeButton
                      }
                      onPress={() =>
                        setShowConfirmPassword(
                          (current) =>
                            !current
                        )
                      }
                      hitSlop={8}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={23}
                        color={
                          colors.textSecondary
                        }
                      />
                    </Pressable>
                  </View>

                  {errors.confirmPassword && (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        errors.confirmPassword
                      }
                    </Text>
                  )}
                </View>

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

                <Pressable
                  onPress={
                    handleResetPassword
                  }
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed &&
                      !isLoading &&
                      styles.buttonPressed,
                    isLoading &&
                      styles.buttonDisabled,
                  ]}
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    {isLoading
                      ? "Resetting Password..."
                      : "Reset Password"}
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.replace("/login")
              }
              disabled={isLoading}
            >
              <Ionicons
                name="arrow-back-outline"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.backText}>
                Back to Sign In
              </Text>
            </Pressable>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  logo: {
    width: 140,
    height: 140,
    marginBottom: spacing.md,
  },

  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: "center",
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
    backgroundColor:
      "rgba(255,255,255,0.92)",
  },

  passwordContainer: {
    elevation: 2,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    backgroundColor:
      "rgba(255,255,255,0.92)",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  eyeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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

  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: typography.fontSize.md,
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

  accountBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor:
      "rgba(255,255,255,0.92)",
    marginBottom: spacing.xl,
  },

  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  accountUsername: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  changeAccountText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  questionBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: spacing.lg,
    backgroundColor:
      "rgba(255,255,255,0.92)",
  },

  questionText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },

  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  formErrorBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor:
      "rgba(255,255,255,0.92)",
  },

  formErrorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    lineHeight: 19,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },

  backText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },
});