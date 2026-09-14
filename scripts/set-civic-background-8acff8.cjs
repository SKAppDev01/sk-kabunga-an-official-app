const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/components/CivicBackground.tsx"
);

let source = fs.readFileSync(
  filePath,
  "utf8"
);

const oldColor = '#F5F8FD';
const newColor = '#8ACFF8';

if (source.includes(oldColor)) {
  source = source.replace(
    oldColor,
    newColor
  );
} else if (source.includes(newColor)) {
  console.log(
    "Background color is already #8ACFF8."
  );
} else {
  throw new Error(
    "Could not find the expected CivicBackground base color."
  );
}

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "Civic background base color changed to #8ACFF8."
);
console.log(
  "Other subtle blue decorative elements were preserved."
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
