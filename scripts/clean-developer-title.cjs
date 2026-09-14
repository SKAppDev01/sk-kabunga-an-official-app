const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/app-settings.tsx"
);

let source = fs.readFileSync(
  filePath,
  "utf8"
);

// Change title.
source = source.replace(
  ">App Developer<",
  ">Developer<"
);

// Remove subtitle block.
source = source.replace(
  /\n\s*<Text style=\{styles\.developerSubtitle\}>\s*Independent • Self-taught\s*<\/Text>\n/m,
  "\n"
);

// Remove subtitle style block if present.
source = source.replace(
  /\n\s*developerSubtitle:\s*\{[\s\S]*?\n\s*\},\n/m,
  "\n"
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log("Developer section updated:");
console.log("- Title: Developer");
console.log("- Subtitle removed");
console.log("");
console.log("Run: npx tsc --noEmit");
