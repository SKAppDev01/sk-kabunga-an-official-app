#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(process.argv[2] || process.cwd());
const appJsonPath = path.join(projectRoot, "app.json");
const easJsonPath = path.join(projectRoot, "eas.json");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

if (!fs.existsSync(appJsonPath)) {
  console.error(`Unable to configure app updates: app.json was not found at ${appJsonPath}`);
  process.exit(1);
}

const appConfig = readJson(appJsonPath, {});
if (!appConfig.expo || typeof appConfig.expo !== "object" || Array.isArray(appConfig.expo)) {
  console.error("Unable to configure app updates: app.json must contain an expo object.");
  process.exit(1);
}

const expo = appConfig.expo;

expo.android =
  expo.android && typeof expo.android === "object" && !Array.isArray(expo.android)
    ? expo.android
    : {};

const existingPermissions = Array.isArray(expo.android.permissions)
  ? expo.android.permissions.filter((value) => typeof value === "string")
  : [];

const installPermission = "android.permission.REQUEST_INSTALL_PACKAGES";
expo.android.permissions = Array.from(
  new Set([...existingPermissions, installPermission]),
);

expo.runtimeVersion = { policy: "appVersion" };
expo.updates =
  expo.updates && typeof expo.updates === "object" && !Array.isArray(expo.updates)
    ? expo.updates
    : {};
expo.updates.checkAutomatically = "NEVER";

const projectId = expo.extra?.eas?.projectId;
if (typeof projectId === "string" && projectId.trim()) {
  expo.updates.url = `https://u.expo.dev/${projectId.trim()}`;
  console.log(`Configured EAS Update URL using projectId ${projectId.trim()}.`);
} else {
  // Do not invent a project ID. The user can run `eas init`/`eas update:configure`
  // later, then re-run this script so the real project ID is used.
  if (Object.prototype.hasOwnProperty.call(expo.updates, "url")) {
    delete expo.updates.url;
  }
  console.warn(
    "EAS project ID was not found at expo.extra.eas.projectId. APK updates are configured, but EAS OTA publishing needs an EAS project ID before it can be enabled.",
  );
}

const easConfig = readJson(easJsonPath, {});
easConfig.build =
  easConfig.build && typeof easConfig.build === "object" && !Array.isArray(easConfig.build)
    ? easConfig.build
    : {};
easConfig.build.production =
  easConfig.build.production &&
  typeof easConfig.build.production === "object" &&
  !Array.isArray(easConfig.build.production)
    ? easConfig.build.production
    : {};
easConfig.build.production.channel = "production";
easConfig.build.production.autoIncrement = true;
easConfig.build.production.android =
  easConfig.build.production.android &&
  typeof easConfig.build.production.android === "object" &&
  !Array.isArray(easConfig.build.production.android)
    ? easConfig.build.production.android
    : {};
easConfig.build.production.android.buildType = "apk";

writeJson(appJsonPath, appConfig);
writeJson(easJsonPath, easConfig);

console.log("App update configuration applied safely.");
console.log("- Android APK installer permission: enabled");
console.log("- EAS runtimeVersion: appVersion");
console.log("- Automatic Expo update loading: disabled (the app controls checks)");
console.log("- Production EAS channel: production");
console.log("- Production Android versionCode auto-increment: enabled");
console.log("- Production Android artifact: APK");
