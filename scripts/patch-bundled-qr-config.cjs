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
config.expo.android =
  config.expo.android || {};

const permissions = Array.isArray(
  config.expo.android.permissions
)
  ? config.expo.android.permissions
  : [];

if (
  !permissions.includes(
    "android.permission.CAMERA"
  )
) {
  permissions.push(
    "android.permission.CAMERA"
  );
}

config.expo.android.permissions =
  permissions;

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
  "Bundled QR scanner Android camera permission is configured."
);
