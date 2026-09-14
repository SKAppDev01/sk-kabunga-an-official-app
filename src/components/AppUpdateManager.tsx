import { router } from "expo-router";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";

import {
  checkForGitHubApkUpdate,
  checkForOtaUpdate,
  fetchOtaUpdate,
  reloadToOtaUpdate,
} from "../services/app-updater";
import { getAutomaticUpdateCheckEnabled } from "../services/update-preferences";

const STARTUP_CHECK_DELAY_MS = 3000;

export function AppUpdateManager() {
  useEffect(() => {
    if (Platform.OS !== "android" || __DEV__) {
      return;
    }

    let active = true;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const enabled =
            await getAutomaticUpdateCheckEnabled();

          if (!active || !enabled) {
            return;
          }

          const nativeCheck =
            await checkForGitHubApkUpdate();

          if (!active) {
            return;
          }

          if (nativeCheck.status === "available") {
            Alert.alert(
              "App Update Available",
              `Version ${nativeCheck.update.version} is available.`,
              [
                {
                  text: "Later",
                  style: "cancel",
                },
                {
                  text: "View Update",
                  onPress: () =>
                    router.push("/app-update"),
                },
              ]
            );
            return;
          }

          const otaCheck = await checkForOtaUpdate();

          if (!active || otaCheck.status !== "available") {
            return;
          }

          const downloaded = await fetchOtaUpdate();

          if (!active || !downloaded) {
            return;
          }

          Alert.alert(
            "Update Ready",
            "A compatible app update has been downloaded and is ready to apply.",
            [
              {
                text: "Later",
                style: "cancel",
              },
              {
                text: "Restart Now",
                onPress: () => {
                  void reloadToOtaUpdate();
                },
              },
            ]
          );
        } catch (error) {
          console.log(
            "Automatic app update check skipped:",
            error
          );
        }
      })();
    }, STARTUP_CHECK_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
