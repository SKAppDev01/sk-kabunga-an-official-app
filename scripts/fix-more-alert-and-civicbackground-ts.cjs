const fs = require("fs");
const path = require("path");

const root = process.cwd();

const morePath = path.join(
  root,
  "src/app/(tabs)/more.tsx"
);

const bgPath = path.join(
  root,
  "src/components/CivicBackground.tsx"
);

if (!fs.existsSync(morePath)) {
  throw new Error(
    "src/app/(tabs)/more.tsx was not found."
  );
}

if (!fs.existsSync(bgPath)) {
  throw new Error(
    "src/components/CivicBackground.tsx was not found."
  );
}

/* -------------------------------------------------
 * 1. Fix Alert accidentally imported from expo-router
 * ------------------------------------------------- */

let more = fs.readFileSync(
  morePath,
  "utf8"
);

// Remove Alert from the expo-router named import only.
more = more.replace(
  /import\s*\{([\s\S]*?)\}\s*from\s*["']expo-router["'];?/m,
  (match, body) => {
    const cleaned = body
      .split("\n")
      .filter(
        (line) =>
          !/^\s*Alert\s*,?\s*$/.test(line)
      )
      .join("\n")
      .replace(
        /(^|,)\s*Alert\s*(?=,|$)/g,
        "$1"
      )
      .replace(/,\s*,/g, ",");

    return `import {${cleaned}} from "expo-router";`;
  }
);

// Remove duplicate NativeAlert imports, then add one explicit import.
more = more.replace(
  /import\s*\{\s*Alert\s+as\s+NativeAlert\s*\}\s*from\s*["']react-native["'];?\s*/g,
  ""
);

more =
  'import { Alert as NativeAlert } from "react-native";\n' +
  more;

// Make sure all alert calls use the explicit React Native API.
more = more.replace(
  /\bAlert\.alert\(/g,
  "NativeAlert.alert("
);

fs.writeFileSync(
  morePath,
  more,
  "utf8"
);

/* -------------------------------------------------
 * 2. Fix StyleSheet.absoluteFillObject typing
 * ------------------------------------------------- */

let bg = fs.readFileSync(
  bgPath,
  "utf8"
);

bg = bg.replace(
  /\.\.\.StyleSheet\.absoluteFillObject\s*,?/g,
  "...StyleSheet.absoluteFill,"
);

fs.writeFileSync(
  bgPath,
  bg,
  "utf8"
);

console.log("");
console.log("TypeScript fixes applied:");
console.log("- Removed Alert from expo-router import");
console.log("- Uses React Native NativeAlert explicitly");
console.log("- CivicBackground uses StyleSheet.absoluteFill");
console.log("");
console.log("Run: npx tsc --noEmit");
