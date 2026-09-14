const fs = require("fs");
const path = require("path");

const rel = "src/components/QRScanner.tsx";
const full = path.join(process.cwd(), rel);

let s = fs.readFileSync(full, "utf8");

const before = s;

// Current expo-status-bar typings in this SDK do not accept
// translucent or backgroundColor on <StatusBar />.
s = s.replace(
  /\s+backgroundColor="transparent"/,
  ""
);

if (s === before) {
  throw new Error(
    'Could not find backgroundColor="transparent" in src/components/QRScanner.tsx'
  );
}

fs.writeFileSync(full, s, "utf8");

console.log("fixed: src/components/QRScanner.tsx");
console.log("Run: npx tsc --noEmit");
