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

const oldText = `Offline SK management and
            records application for local
            official use.`;

const newText = `An offline-first SK management
            and records application designed
            for local officials of Barangay
            Kabunga-an. It helps organize
            projects, finances, youth records,
            meetings, activities, inventory,
            documents and reports in one
            secure local workspace.`;

if (!source.includes(oldText)) {
  throw new Error(
    "Could not find the current About App description."
  );
}

source = source.replace(
  oldText,
  newText
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "About App description expanded."
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
