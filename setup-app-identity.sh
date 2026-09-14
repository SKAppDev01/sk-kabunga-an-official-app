#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f "assets/images/sk-kabunga-an-logo.png" ]; then
  echo "Missing assets/images/sk-kabunga-an-logo.png"
  exit 1
fi

node scripts/configure-app-identity.mjs app.json
npx tsc --noEmit

echo
echo "App identity configured. Rebuild the Android app to see the new launcher and launch-screen icon."
