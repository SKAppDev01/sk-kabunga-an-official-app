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

import { createLocalAccount } from "../services/auth";
import { colors, spacing, typography } from "../theme";

const RECOVERY_QUESTIONS = [
  "What was the name of your first school?",
  "What is the name of your childhood best friend?",
  "What is your mother's middle name?",
  "What is the name of your first pet?",
  "What is your favorite childhood place?",
  "What was your childhood nickname?",
];

type RegisterErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
  recoveryQuestion?: string;
  recoveryAnswer?: string;
  form?: string;
};

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [recoveryQuestion, setRecoveryQuestion] =
    useState("");
  const [recoveryAnswer, setRecoveryAnswer] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    showRecoveryAnswer,
    setShowRecoveryAnswer,
  ] = useState(false);

  const [
    showQuestionPicker,
    setShowQuestionPicker,
  ] = useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [errors, setErrors] =
    useState<RegisterErrors>({});

  function clearError(field: keyof RegisterErrors) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  async function handleCreateAccount() {
    const cleanUsername = username.trim();
    const cleanAnswer = recoveryAnswer.trim();

    const newErrors: RegisterErrors = {};

    if (!cleanUsername) {
      newErrors.username =
        "Please enter a username.";
    } else if (cleanUsername.length < 3) {
      newErrors.username =
        "Username must be at least 3 characters.";
    }

    if (!password) {
      newErrors.password =
        "Please enter a password.";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (!recoveryQuestion) {
      newErrors.recoveryQuestion =
        "Please choose a recovery question.";
    }

    if (!cleanAnswer) {
      newErrors.recoveryAnswer =
        "Please enter your recovery answer.";
    } else if (cleanAnswer.length < 3) {
      newErrors.recoveryAnswer =
        "Recovery answer must be at least 3 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsCreating(true);
      setErrors({});

      await createLocalAccount({
        username: cleanUsername,
        password,
        recoveryQuestion,
        recoveryAnswer: cleanAnswer,
      });

      Alert.alert(
        "Account Created",
        "Your local account was created successfully.",
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace("/login"),
          },
        ]
      );
    } catch (error) {
      console.error(
        "Create account error:",
        error
      );

      if (
        error instanceof Error &&
        error.message === "USERNAME_EXISTS"
      ) {
        setErrors({
          username:
            "This username is already in use.",
        });

        return;
      }

      setErrors({
        form:
          "Something went wrong while creating your account. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  }

  function handleSelectRecoveryQuestion(
    question: string
  ) {
    setRecoveryQuestion(question);
    setShowQuestionPicker(false);
    clearError("recoveryQuestion");
  }

  return (
    <ImageBackground
      source={require("../../assets/images/login-background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
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
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Image
                source={require("../../assets/images/sk-kabunga-an-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.title}>
                Create Account
              </Text>

              <Text style={styles.subtitle}>
                Create your local SK account
              </Text>
            </View>

            <View style={styles.form}>
              {/* Username */}
              <View style={styles.fieldGroup}>
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
                    clearError("username");
                  }}
                  placeholder="Create username"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isCreating}
                />

                {errors.username && (
                  <Text style={styles.errorText}>
                    {errors.username}
                  </Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Password
                </Text>

                <View
                  style={[
                    styles.passwordContainer,
                    errors.password &&
                      styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearError("password");

                      if (errors.confirmPassword) {
                        clearError(
                          "confirmPassword"
                        );
                      }
                    }}
                    placeholder="Create password"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isCreating}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    hitSlop={8}
                    disabled={isCreating}
                  >
                    <Ionicons
                      name={
                        showPassword
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

                {errors.password && (
                  <Text style={styles.errorText}>
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Confirm Password
                </Text>

                <View
                  style={[
                    styles.passwordContainer,
                    errors.confirmPassword &&
                      styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearError(
                        "confirmPassword"
                      );
                    }}
                    placeholder="Confirm password"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isCreating}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    hitSlop={8}
                    disabled={isCreating}
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
                  <Text style={styles.errorText}>
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>
                Account Recovery
              </Text>

              <Text style={styles.helperText}>
                Choose a recovery question and
                provide an answer you will remember.
              </Text>

              {/* Recovery Question */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Recovery Question
                </Text>

                <Pressable
                  style={[
                    styles.questionSelector,
                    errors.recoveryQuestion &&
                      styles.inputError,
                  ]}
                  onPress={() => {
                    setShowQuestionPicker(
                      (current) => !current
                    );

                    clearError(
                      "recoveryQuestion"
                    );
                  }}
                  disabled={isCreating}
                >
                  <Text
                    style={[
                      styles.questionSelectorText,
                      !recoveryQuestion &&
                        styles.questionPlaceholder,
                    ]}
                  >
                    {recoveryQuestion ||
                      "Choose a recovery question"}
                  </Text>

                  <Ionicons
                    name={
                      showQuestionPicker
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={21}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>

                {errors.recoveryQuestion && (
                  <Text style={styles.errorText}>
                    {errors.recoveryQuestion}
                  </Text>
                )}

                {showQuestionPicker && (
                  <View style={styles.questionList}>
                    {RECOVERY_QUESTIONS.map(
                      (question, index) => {
                        const isSelected =
                          recoveryQuestion ===
                          question;

                        return (
                          <Pressable
                            key={question}
                            style={[
                              styles.questionOption,
                              index ===
                                RECOVERY_QUESTIONS.length -
                                  1 &&
                                styles.lastQuestionOption,
                              isSelected &&
                                styles.questionOptionSelected,
                            ]}
                            onPress={() =>
                              handleSelectRecoveryQuestion(
                                question
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.questionOptionText,
                                isSelected &&
                                  styles.questionOptionTextSelected,
                              ]}
                            >
                              {question}
                            </Text>

                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={20}
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

              {/* Recovery Answer */}
              <View style={styles.fieldGroup}>
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
                    style={styles.passwordInput}
                    value={recoveryAnswer}
                    onChangeText={(text) => {
                      setRecoveryAnswer(text);
                      clearError(
                        "recoveryAnswer"
                      );
                    }}
                    placeholder="Enter your recovery answer"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    secureTextEntry={
                      !showRecoveryAnswer
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isCreating}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowRecoveryAnswer(
                        (current) => !current
                      )
                    }
                    hitSlop={8}
                    disabled={isCreating}
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
                  <Text style={styles.errorText}>
                    {errors.recoveryAnswer}
                  </Text>
                )}
              </View>

              {/* General Error */}
              {errors.form && (
                <View style={styles.formErrorBox}>
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
                onPress={handleCreateAccount}
                disabled={isCreating}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed &&
                    !isCreating &&
                    styles.buttonPressed,
                  isCreating &&
                    styles.buttonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  {isCreating
                    ? "Creating Account..."
                    : "Create Account"}
                </Text>
              </Pressable>

              <View style={styles.loginRow}>
                <Text
                  style={styles.loginQuestion}
                >
                  Already have an account?{" "}
                </Text>

                <Pressable
                  onPress={() =>
                    router.replace("/login")
                  }
                  hitSlop={8}
                  disabled={isCreating}
                >
                  <Text style={styles.loginLink}>
                    Sign in
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.footer}>
              Your account is stored only on this
              device.
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

  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  helperText: {
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
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
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor:
      "rgba(255,255,255,0.92)",
  },

  passwordContainer: {
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

  questionSelector: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor:
      "rgba(255,255,255,0.92)",
  },

  questionSelectorText: {
    flex: 1,
    marginRight: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 21,
  },

  questionPlaceholder: {
    color: colors.textMuted,
  },

  questionList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginTop: spacing.sm,
    overflow: "hidden",
    backgroundColor: colors.white,
  },

  questionOption: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  lastQuestionOption: {
    borderBottomWidth: 0,
  },

  questionOptionSelected: {
    backgroundColor: colors.surface,
  },

  questionOptionText: {
    flex: 1,
    marginRight: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },

  questionOptionTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
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
      "rgba(255,255,255,0.92)",
  },

  formErrorText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    lineHeight: 19,
  },

  createButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  createButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },

  loginQuestion: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  loginLink: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  footer: {
    marginTop: "auto",
    paddingTop: spacing.xl,
    textAlign: "center",
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
  },
});