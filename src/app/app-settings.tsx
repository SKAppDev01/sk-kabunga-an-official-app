import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useEffect,
  useState,
  type ComponentProps,
} from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppHeader";

import {
  getCurrentAppVersion,
} from "../services/app-updater";
import {
  getAutomaticUpdateCheckEnabled,
  setAutomaticUpdateCheckEnabled,
} from "../services/update-preferences";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type IconName =
  ComponentProps<typeof Ionicons>["name"];

export default function AppSettingsScreen() {
  const [autoCheckEnabled, setAutoCheckEnabled] =
    useState(true);
  const currentVersion = getCurrentAppVersion();

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const enabled =
          await getAutomaticUpdateCheckEnabled();

        if (active) {
          setAutoCheckEnabled(enabled);
        }
      } catch (error) {
        console.error(
          "Unable to load update preference:",
          error
        );
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleAutoCheckChange(
    enabled: boolean
  ) {
    const previous = autoCheckEnabled;
    setAutoCheckEnabled(enabled);

    try {
      await setAutomaticUpdateCheckEnabled(enabled);
    } catch (error) {
      console.error(
        "Unable to save update preference:",
        error
      );
      setAutoCheckEnabled(previous);
      Alert.alert(
        "Update Settings",
        "Unable to save the automatic update setting."
      );
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="App Settings"
        showBack
      />
      

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        <Text
          style={styles.sectionTitle}
        >
          Application
        </Text>

        <View style={styles.settingsList}>
          <InfoRow
            icon="phone-portrait-outline"
            title="Platform"
            value="Android"
          />

          <View
            style={styles.divider}
          />

          <InfoRow
            icon="cloud-offline-outline"
            title="Data Mode"
            value="Offline-first"
          />

          <View
            style={styles.divider}
          />

          <InfoRow
            icon="color-palette-outline"
            title="Appearance"
            value="Light"
          />
        </View>

        <Text
          style={styles.sectionTitle}
        >
          App Updates
        </Text>

        <View style={styles.settingsList}>
          <InfoRow
            icon="information-circle-outline"
            title="Current Version"
            value={`v${currentVersion}`}
          />

          <View style={styles.divider} />

          <ToggleRow
            icon="cloud-download-outline"
            title="Automatic Update Check"
            description="Check GitHub Releases when the app starts"
            value={autoCheckEnabled}
            onValueChange={(enabled) =>
              void handleAutoCheckChange(enabled)
            }
          />
        </View>

        <NavigationRow
          icon="refresh-circle-outline"
          title="Check for Updates"
          description="Check GitHub Releases and EAS updates now"
          onPress={() => router.push("/app-update")}
        />

        <Text
          style={styles.sectionTitle}
        >
          Data & Privacy
        </Text>

        <NavigationRow
          icon="shield-checkmark-outline"
          title="How Your Data Is Handled"
          description="Review local storage, privacy, sharing and protection"
          onPress={() =>
            router.push(
              "/data-privacy"
            )
          }
        />

        <View style={styles.infoBox}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={colors.primary}
          />

          <Text
            style={styles.infoText}
          >
            The SK Kabunga-an Official App
            is designed to keep its core
            records on this Android device
            and work without requiring a
            cloud connection.
          </Text>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          Support & Feedback
        </Text>

        <NavigationRow
          icon="chatbubbles-outline"
          title="Support & Feedback"
          description="Get help, report an issue, or share suggestions"
          onPress={() =>
            router.push(
              "/support-feedback"
            )
          }
        />


        <Text
          style={styles.sectionTitle}
        >
          About
        </Text>

        <View style={styles.aboutBox}>
          <Text style={styles.appName}>
            SK Kabunga-an Official App
          </Text>

          <Text
            style={styles.aboutText}
          >
            SK Kabunga-an Official App is an offline-first Android management system created to help Sangguniang Kabataan officials manage day-to-day records and services in one organized local workspace. It is designed specifically for Barangay Kabunga-an and keeps core information usable without an internet connection.
            {"\n\n"}
            The app brings together project and program tracking, budgeting and expenses, the Youth Registry, QR-assisted attendance for meetings and activities, inventory, documents and records, reports, and local accounts. Profile QR codes can also support faster youth registration and attendance identification while keeping sensitive account credentials out of the QR data.
            {"\n\n"}
            Because the app is built for offline use, important records remain on the device by default. Privacy-focused local storage, backup and restore, export and import, and offline data sharing are designed to help officials maintain control of their records even when internet access is unavailable.
            {"\n\n"}
            The goal of the application is to make SK work more organized, accessible, and reliable by giving officials a practical tool for managing information, monitoring activities and finances, maintaining youth records, and keeping important local data available when it is needed.
          </Text>

          <View style={styles.aboutLogoRow}>
            <Image
              source={require(
                "../../assets/images/baybay-logo.png"
              )}
              style={styles.aboutLogo}
              resizeMode="contain"
            />

            <Image
              source={require(
                "../../assets/images/barangay-kabunga-an-logo.png"
              )}
              style={styles.aboutLogo}
              resizeMode="contain"
            />

            <Image
              source={require(
                "../../assets/images/sk-kabunga-an-seal.png"
              )}
              style={styles.aboutLogo}
              resizeMode="contain"
            />

            <Image
              source={require(
                "../../assets/images/sk-kabunga-an-logo.png"
              )}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
          </View>
        </View>


        <Text
          style={styles.sectionTitle}
        >
          Developer Information
        </Text>

        <View style={styles.developerBox}>
          <Image
            source={require(
              "../../assets/images/developer-profile.jpg"
            )}
            style={styles.developerPhoto}
            resizeMode="cover"
          />

          <Text style={styles.developerTitle}>
            Developer
          </Text>

          <View style={styles.bioDivider} />

          <Text style={styles.biographyLabel}>
            Biography
          </Text>

          <Text style={styles.biographyText}>
            I am a self-taught developer with
            a genuine passion for programming,
            technology, and creating useful
            digital solutions. I enjoy learning
            through hands-on projects,
            experimenting with new ideas, and
            continuously improving my skills as
            I build applications from the ground
            up.

            My focus is on developing practical
            apps that can help solve real
            problems, simplify everyday tasks,
            and make important processes easier
            to manage. I am especially interested
            in creating applications that can be
            useful to local communities,
            organizations, and people who can
            benefit from simple and accessible
            technology.

            I believe that programming is not
            only about writing code, but also
            about understanding problems and
            finding better ways to solve them.
            Every project I work on is an
            opportunity for me to learn something
            new, improve my approach, and
            challenge myself to build applications
            that are reliable, organized, and
            meaningful.

            As a self-taught developer, I continue
            to grow through curiosity, persistence,
            and constant practice. My goal is to
            keep learning, build more useful
            applications, and use technology to
            create solutions that can have a
            positive impact on people and
            communities.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  title,
  value,
}: {
  icon: IconName;
  title: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <Text style={styles.infoRowTitle}>
        {title}
      </Text>

      <Text style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.toggleTextWrap}>
        <Text style={styles.navigationTitle}>
          {title}
        </Text>
        <Text style={styles.rowDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: "#D1D5DB",
          true: "#93C5FD",
        }}
        thumbColor={
          value ? colors.primary : colors.white
        }
      />
    </View>
  );
}

function NavigationRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.navigationRow,
        pressed &&
          styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.navigationText}>
        <Text
          style={styles.navigationTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.rowDescription}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward-outline"
        size={20}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
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
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },



  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal:
      spacing.xl,
    paddingBottom:
      spacing.xxxl +
      spacing.xl,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize:
      typography.fontSize.md,
    lineHeight: 22,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  settingsList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  infoRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 2,
  },

  iconBox: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  infoRowTitle: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },

  toggleTextWrap: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    paddingVertical: spacing.sm,
  },

  navigationTitle: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },

  rowValue: {
    width: 126,
    minWidth: 126,
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 16,
    color:
      colors.textSecondary,
    textAlign: "right",
  },

  divider: {
    height: 1,
    marginLeft: 48,
    backgroundColor:
      colors.border,
  },

  navigationRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  navigationText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    paddingVertical: spacing.sm,
  },

  rowDescription: {
    width: "100%",
    minWidth: 0,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    flexShrink: 1,
  },

  infoBox: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
  },

  infoText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
  },

  aboutBox: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor:
      colors.white,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  appName: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.md,
    lineHeight: 22,
    fontWeight:
      typography.fontWeight.bold,
    color: "#0038A8",
  },

  aboutText: {
    width: "100%",
    minWidth: 0,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
    textAlign: "justify",
  },

  aboutLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    marginTop: spacing.lg,
    width: "100%",
  },

  aboutLogo: {
    width: 48,
    height: 48,
    flexShrink: 0,
  },

  developerBox: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.09,
    shadowRadius: 4,
  },

  developerPhoto: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: "#E3F2FD",
  },

  developerTitle: {
    width: "100%",
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    fontWeight: typography.fontWeight.bold,
    color: "#0038A8",
    textAlign: "center",
  },

  bioDivider: {
    width: "100%",
    height: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },

  biographyLabel: {
    width: "100%",
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "left",
  },

  biographyText: {
    width: "100%",
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: "justify",
  },

  pressed: {
    opacity: 0.65,
  },
});
