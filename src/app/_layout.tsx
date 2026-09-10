import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initializeDatabase } from "../database/database";

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

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}