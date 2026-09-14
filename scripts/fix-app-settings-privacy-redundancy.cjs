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

source = source.replace(
  `>Data & Privacy<`,
  `>Privacy<`
);

source = source.replace(
  `title="Data & Privacy"`,
  `title="How Your Data Is Handled"`
);

source = source.replace(
  `description="How this app stores, protects and shares local SK data"`,
  `description="Review local storage, privacy, sharing and protection"`
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "App Settings privacy section cleaned up."
);
console.log(
  "- Section: Privacy"
);
console.log(
  "- Row: How Your Data Is Handled"
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
