const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/(tabs)/more.tsx"
);

if (!fs.existsSync(filePath)) {
  throw new Error(
    "src/app/(tabs)/more.tsx was not found."
  );
}

let source = fs.readFileSync(filePath, "utf8");

// Remove a previous explicit alias import if this patch
// is run more than once.
source = source.replace(
  /import \{\s*Alert as NativeAlert\s*\} from "react-native";\s*\n?/g,
  ""
);

// Add a dedicated React Native Alert import.
// Keeping it separate avoids interfering with the existing
// multi-line react-native import block.
source =
  'import { Alert as NativeAlert } from "react-native";\n' +
  source;

// Use the explicitly imported Alert implementation.
source = source.replace(
  /\bAlert\.alert\(/g,
  "NativeAlert.alert("
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log("Sign-out Alert runtime fix applied.");
console.log("- Uses explicit NativeAlert import");
console.log("- Sign-out confirmation stays unchanged");
console.log("");
console.log("Run: npx tsc --noEmit");
