const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/app-settings.tsx"
);

let source = fs.readFileSync(filePath, "utf8");

// Force the text inside the developerTitle element to exactly "Developer".
source = source.replace(
  /(<Text\s+style=\{styles\.developerTitle\}\s*>)[\s\S]*?(<\/Text>)/m,
  `$1
            Developer
          $2`
);

// Remove the subtitle element entirely if it still exists.
source = source.replace(
  /\s*<Text\s+style=\{styles\.developerSubtitle\}\s*>[\s\S]*?<\/Text>\s*/m,
  "\n"
);

// Remove subtitle style block if it still exists.
source = source.replace(
  /\n\s*developerSubtitle:\s*\{[\s\S]*?\n\s*\},\n/m,
  "\n"
);

fs.writeFileSync(filePath, source, "utf8");

console.log("");
console.log('Developer title is now exactly: "Developer"');
console.log("Developer subtitle removed.");
console.log("");
console.log("Run: npx tsc --noEmit");
