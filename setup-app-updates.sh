#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "Installing Expo SDK-compatible update dependencies..."
npx expo install expo-file-system expo-constants expo-intent-launcher expo-updates

echo "Configuring Android APK updates and EAS Update..."
node scripts/configure-app-updates.mjs "$PROJECT_ROOT"

echo "Running TypeScript verification..."
npx tsc --noEmit

echo
echo "Updater setup complete."
echo "Because this adds native modules/Android permissions, create and install a new Development Build before testing the updater:"
echo "  eas build --platform android --profile development"
