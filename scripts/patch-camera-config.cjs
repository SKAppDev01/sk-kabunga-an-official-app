const fs = require("fs");
const path = require("path");

const appJsonPath = path.resolve(
  process.cwd(),
  "app.json"
);

if (!fs.existsSync(appJsonPath)) {
  console.error(
    "app.json was not found in the project root."
  );
  process.exit(1);
}

const raw = fs.readFileSync(
  appJsonPath,
  "utf8"
);

const config = JSON.parse(raw);

config.expo = config.expo || {};
config.expo.plugins =
  Array.isArray(config.expo.plugins)
    ? config.expo.plugins
    : [];

const cameraOptions = {
  cameraPermission:
    "Allow SK Kabunga-an to use the camera to scan QR codes.",
  barcodeScannerEnabled: true,
  recordAudioAndroid: false,
};

const cameraIndex =
  config.expo.plugins.findIndex(
    (plugin) =>
      plugin === "expo-camera" ||
      (Array.isArray(plugin) &&
        plugin[0] ===
          "expo-camera")
  );

if (cameraIndex === -1) {
  config.expo.plugins.push([
    "expo-camera",
    cameraOptions,
  ]);
} else {
  const current =
    config.expo.plugins[
      cameraIndex
    ];

  if (Array.isArray(current)) {
    config.expo.plugins[
      cameraIndex
    ] = [
      "expo-camera",
      {
        ...(current[1] || {}),
        ...cameraOptions,
      },
    ];
  } else {
    config.expo.plugins[
      cameraIndex
    ] = [
      "expo-camera",
      cameraOptions,
    ];
  }
}

fs.writeFileSync(
  appJsonPath,
  `${JSON.stringify(
    config,
    null,
    2
  )}\n`,
  "utf8"
);

console.log(
  "expo-camera plugin is configured in app.json."
);
