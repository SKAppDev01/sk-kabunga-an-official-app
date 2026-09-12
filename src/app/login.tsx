import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Image,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { loginLocalAccount } from "../services/auth";
import {
  AUTH_LEVEL_VERIFIED_OFFICIAL,
  isOfficialRole,
} from "../services/authorization";
import { saveSession } from "../services/session";
import {
    colors,
    spacing,
    typography,
} from "../theme";

type LoginErrors = {
  username?: string;
  password?: string;
};

export default function LoginScreen() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSigningIn,
    setIsSigningIn,
  ] = useState(false);

  const [errors, setErrors] =
    useState<LoginErrors>({});

  function clearError(
    field: keyof LoginErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSignIn() {
    const cleanUsername =
      username.trim();

    const newErrors: LoginErrors = {};

    if (!cleanUsername) {
      newErrors.username =
        "Please enter your username.";
    }

    if (!password) {
      newErrors.password =
        "Please enter your password.";
    }

    if (
      Object.keys(newErrors).length > 0
    ) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSigningIn(true);
      setErrors({});

      const user =
        await loginLocalAccount({
          username: cleanUsername,
          password,
        });

      // Remember this account locally
      await saveSession(user.id);

      // Account still needs profile setup
      if (
        !user.fullName ||
        !user.role
      ) {
        router.replace({
          pathname: "/profile-setup",
          params: {
            userId: user.id,
            username: user.username,
          },
        });

        return;
      }

      if (
        isOfficialRole(user.role) &&
        user.authorizationLevel !==
          AUTH_LEVEL_VERIFIED_OFFICIAL
      ) {
        router.replace({
          pathname: "/official-verification",
          params: {
            userId: user.id,
            username: user.username,
            fullName:
              user.fullName || "",
          },
        });

        return;
      }

      // Profile is already complete
      router.replace("/home");
    } catch (error) {
      console.error(
        "Sign in error:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "INVALID_CREDENTIALS"
      ) {
        setErrors({
          password:
            "Incorrect username or password.",
        });

        return;
      }

      setErrors({
        password:
          "Something went wrong while signing in. Please try again.",
      });
    } finally {
      setIsSigningIn(false);
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
        <View style={styles.container}>
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/sk-kabunga-an-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to your local SK
              account
            </Text>
          </View>

          <View style={styles.form}>
            {/* Username */}
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

                  if (errors.username) {
                    clearError(
                      "username"
                    );
                  }
                }}
                placeholder="Enter username"
                placeholderTextColor={
                  colors.textMuted
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSigningIn}
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

            {/* Password */}
            <View
              style={
                styles.passwordFieldGroup
              }
            >
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
                  style={
                    styles.passwordInput
                  }
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);

                    if (
                      errors.password
                    ) {
                      clearError(
                        "password"
                      );
                    }
                  }}
                  placeholder="Enter password"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSigningIn}
                  onSubmitEditing={
                    handleSignIn
                  }
                />

                <Pressable
                  style={
                    styles.eyeButton
                  }
                  onPress={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  hitSlop={8}
                  disabled={
                    isSigningIn
                  }
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
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Sign In */}
            <Pressable
              onPress={handleSignIn}
              disabled={isSigningIn}
              style={({ pressed }) => [
                styles.loginButton,

                pressed &&
                  !isSigningIn &&
                  styles.buttonPressed,

                isSigningIn &&
                  styles.buttonDisabled,
              ]}
            >
              <Text
                style={
                  styles.loginButtonText
                }
              >
                {isSigningIn
                  ? "Signing In..."
                  : "Sign In"}
              </Text>
            </Pressable>

            {/* Forgot Password */}
            <Pressable
              onPress={() =>
                router.push(
                  "/recovery"
                )
              }
              disabled={isSigningIn}
              hitSlop={8}
            >
              <Text
                style={
                  styles.forgotText
                }
              >
                Forgot password?
              </Text>
            </Pressable>

            {/* Register */}
            <View
              style={
                styles.registerRow
              }
            >
              <Text
                style={
                  styles.registerQuestion
                }
              >
                Don&apos;t have an
                account?{" "}
              </Text>

              <Pressable
                onPress={() =>
                  router.push(
                    "/register"
                  )
                }
                hitSlop={8}
                disabled={isSigningIn}
              >
                <Text
                  style={
                    styles.registerLink
                  }
                >
                  Create account
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.footer}>
            Your records stay on this
            device.
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
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
    fontSize:
      typography.fontSize.xxl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },

  form: {
    width: "100%",
  },

  fieldGroup: {
    marginBottom: spacing.lg,
  },

  passwordFieldGroup: {
    marginBottom: spacing.xl,
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
    fontSize:
      typography.fontSize.md,
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
    fontSize:
      typography.fontSize.xs,
    color: colors.danger,
  },

  loginButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.white,
  },

  forgotText: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },

  registerQuestion: {
    fontSize:
      typography.fontSize.sm,
    color: colors.textSecondary,
  },

  registerLink: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  footer: {
    marginTop: "auto",
    textAlign: "center",
    fontSize:
      typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
  },
});