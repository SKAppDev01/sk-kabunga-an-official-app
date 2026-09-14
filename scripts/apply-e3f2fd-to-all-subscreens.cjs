const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appDir = path.join(root, "src/app");
const themeDir = path.join(root, "src/theme");

const TARGET = "#E3F2FD";

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }

  return out;
}

function rel(file) {
  return path
    .relative(root, file)
    .replace(/\\/g, "/");
}

function findStyleBlock(source, styleName) {
  const marker = `${styleName}: {`;
  let start = source.indexOf(marker);

  if (start < 0) {
    const quotedMarker = `"${styleName}": {`;
    start = source.indexOf(quotedMarker);
  }

  if (start < 0) return null;

  const open = source.indexOf("{", start);
  let depth = 0;

  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;

    if (source[i] === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start,
          open,
          close: i,
        };
      }
    }
  }

  return null;
}

function setBlockBackground(
  source,
  styleName
) {
  const block = findStyleBlock(
    source,
    styleName
  );

  if (!block) {
    return {
      source,
      changed: false,
    };
  }

  let body = source.slice(
    block.open,
    block.close + 1
  );

  // Only touch layout/root-like blocks.
  if (
    !/\bflex\s*:\s*1\b/.test(body) &&
    !/\bflexGrow\s*:\s*1\b/.test(body)
  ) {
    return {
      source,
      changed: false,
    };
  }

  const originalBody = body;

  // Replace any normal screen background already set on a root block.
  body = body.replace(
    /backgroundColor\s*:\s*(?:colors\.(?:background|white|surface)|["']#(?:FFFFFF|ffffff|FFF|fff|F8FAFC|F9FAFB|FAFAFA|F5F8FD|F6F8FC|8ACFF8|90CAF9|E3F2FD)["'])\s*,?/g,
    `backgroundColor: "${TARGET}",`
  );

  // If the root block has no background at all, add it.
  if (!/\bbackgroundColor\s*:/.test(body)) {
    body = body.replace(
      "{",
      `{\n    backgroundColor: "${TARGET}",`
    );
  }

  if (body === originalBody) {
    return {
      source,
      changed: false,
    };
  }

  return {
    source:
      source.slice(0, block.open) +
      body +
      source.slice(block.close + 1),
    changed: true,
  };
}

function shouldSkip(file) {
  const relative = rel(file);
  const base = path.basename(file);

  if (base === "_layout.tsx") {
    return "layout";
  }

  // The five main tabs are already themed.
  if (
    relative ===
      "src/app/(tabs)/home.tsx" ||
    relative ===
      "src/app/(tabs)/projects.tsx" ||
    relative ===
      "src/app/(tabs)/finance.tsx" ||
    relative ===
      "src/app/(tabs)/records.tsx" ||
    relative ===
      "src/app/(tabs)/more.tsx"
  ) {
    return "main tab already themed";
  }

  // Keep dedicated auth / splash branding unchanged.
  if (
    relative === "src/app/index.tsx" ||
    relative === "src/app/login.tsx" ||
    relative === "src/app/register.tsx" ||
    relative === "src/app/recovery.tsx" ||
    relative === "src/app/profile-setup.tsx"
  ) {
    return "auth/splash screen";
  }

  // Camera preview must remain camera/dark rather than blue.
  if (
    /qr-scanner/i.test(base) ||
    /camera/i.test(base)
  ) {
    return "camera/scanner screen";
  }

  return null;
}

// ------------------------------------------------------------
// 1. Make the app theme background itself #E3F2FD.
// This automatically updates every sub-screen already using
// colors.background.
// ------------------------------------------------------------
const themeFiles = walk(themeDir).filter(
  (file) =>
    /\.(ts|tsx)$/.test(file)
);

const themeChanged = [];

for (const file of themeFiles) {
  let source = fs.readFileSync(
    file,
    "utf8"
  );

  if (
    !/background\s*:/.test(source)
  ) {
    continue;
  }

  const before = source;

  source = source.replace(
    /(\bbackground\s*:\s*)["']#[0-9A-Fa-f]{6}["']/,
    `$1"${TARGET}"`
  );

  if (source !== before) {
    fs.writeFileSync(
      file,
      source,
      "utf8"
    );

    themeChanged.push(rel(file));
  }
}

// ------------------------------------------------------------
// 2. Sweep all regular Expo Router sub-screens.
// If a screen has a root-like style that hardcodes white or an
// old background, change that root layer to #E3F2FD as well.
// ------------------------------------------------------------
const screenFiles = walk(appDir).filter(
  (file) => file.endsWith(".tsx")
);

const changedScreens = [];
const unchangedScreens = [];
const skippedScreens = [];

const rootStyleNames = [
  "safeArea",
  "screen",
  "root",
  "page",
  "container",
  "scrollView",
  "keyboardView",
  "keyboardAvoidingView",
  "wrapper",
];

for (const file of screenFiles) {
  const reason = shouldSkip(file);

  if (reason) {
    skippedScreens.push(
      `${rel(file)} — ${reason}`
    );
    continue;
  }

  let source = fs.readFileSync(
    file,
    "utf8"
  );

  const before = source;
  let touched = false;

  for (
    const styleName of rootStyleNames
  ) {
    const result =
      setBlockBackground(
        source,
        styleName
      );

    source = result.source;

    if (result.changed) {
      touched = true;
    }
  }

  // Also normalize explicit use of colors.background to the
  // global theme by leaving it intact. No need to replace it.
  // The theme update above handles those automatically.

  if (
    touched &&
    source !== before
  ) {
    fs.writeFileSync(
      file,
      source,
      "utf8"
    );

    changedScreens.push(rel(file));
  } else {
    unchangedScreens.push(rel(file));
  }
}

// ------------------------------------------------------------
// 3. Write a report so you can see exactly what was touched.
// ------------------------------------------------------------
const report = [
  "SK Kabunga-an — #E3F2FD Sub-screen Theme Sweep",
  "",
  "Theme files updated:",
  ...(
    themeChanged.length
      ? themeChanged.map(
          (x) => `  - ${x}`
        )
      : [
          "  - No theme file needed a direct change",
        ]
  ),
  "",
  `Sub-screens directly updated: ${changedScreens.length}`,
  ...changedScreens.map(
    (x) => `  - ${x}`
  ),
  "",
  `Sub-screens already compatible / no direct root patch needed: ${unchangedScreens.length}`,
  ...unchangedScreens.map(
    (x) => `  - ${x}`
  ),
  "",
  "Intentionally skipped:",
  ...skippedScreens.map(
    (x) => `  - ${x}`
  ),
  "",
  "Notes:",
  `  - Global app background is ${TARGET}`,
  "  - White cards/forms remain white",
  "  - Main tabs remain unchanged",
  "  - Login/Register/Recovery/Splash stay on their dedicated branding",
  "  - Camera/QR scanner preview stays camera/dark",
  "",
].join("\n");

fs.writeFileSync(
  path.join(
    root,
    "SUBSCREEN-THEME-REPORT.txt"
  ),
  report,
  "utf8"
);

console.log("");
console.log(
  "Sub-screen theme sweep complete."
);
console.log(
  `Theme background: ${TARGET}`
);
console.log(
  `Directly updated sub-screens: ${changedScreens.length}`
);
console.log(
  `Already compatible: ${unchangedScreens.length}`
);
console.log(
  `Intentionally skipped: ${skippedScreens.length}`
);
console.log("");
console.log(
  "Report: SUBSCREEN-THEME-REPORT.txt"
);
console.log(
  "Next: npx tsc --noEmit"
);
