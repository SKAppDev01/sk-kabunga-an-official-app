import fs from "node:fs";
import path from "node:path";

const configPath = path.resolve(process.argv[2] || "app.json");
const raw = fs.readFileSync(configPath, "utf8");
const config = JSON.parse(raw);

if (!config.expo || typeof config.expo !== "object") {
  throw new Error("app.json is missing the expo configuration object.");
}

const logo = "./assets/images/sk-kabunga-an-logo.png";
const backgroundColor = "#E3F2FD";

config.expo.icon = logo;
config.expo.android = {
  ...(config.expo.android || {}),
  adaptiveIcon: {
    ...(config.expo.android?.adaptiveIcon || {}),
    foregroundImage: logo,
    backgroundColor,
  },
};

const plugins = Array.isArray(config.expo.plugins)
  ? [...config.expo.plugins]
  : [];

const splashOptions = {
  image: logo,
  imageWidth: 180,
  resizeMode: "contain",
  backgroundColor,
  dark: {
    image: logo,
    backgroundColor,
  },
};

const splashIndex = plugins.findIndex((plugin) =>
  plugin === "expo-splash-screen" ||
  (Array.isArray(plugin) && plugin[0] === "expo-splash-screen")
);

if (splashIndex >= 0) {
  const existing = plugins[splashIndex];
  const existingOptions = Array.isArray(existing) && existing[1] && typeof existing[1] === "object"
    ? existing[1]
    : {};

  plugins[splashIndex] = [
    "expo-splash-screen",
    {
      ...existingOptions,
      ...splashOptions,
    },
  ];
} else {
  plugins.push(["expo-splash-screen", splashOptions]);
}

config.expo.plugins = plugins;
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log("Configured SK Kabunga-an launcher and Android launch-screen identity.");
