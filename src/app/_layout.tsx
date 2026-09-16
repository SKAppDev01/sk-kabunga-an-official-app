import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppUpdateManager } from "../components/AppUpdateManager";
import { initializeDatabase } from "../database/database";

async function enableImmersiveMode() {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    NavigationBar.setHidden(true);
  } catch (error) {
    console.warn("Unable to enable immersive system bars:", error);
  }
}

export default function RootLayout() {
  useEffect(() => {
    async function setupDatabase() {
      try {
        await initializeDatabase();
        console.log("SK Local database initialized successfully.");
      } catch (error) {
        console.error(
          "Failed to initialize SK Local database:",
          error
        );
      }
    }

    setupDatabase();
  }, []);

  useEffect(() => {
    void enableImmersiveMode();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void enableImmersiveMode();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden animated style="light" />
      <AppUpdateManager />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}
