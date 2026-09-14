const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/app-settings.tsx"
);

let source = fs.readFileSync(filePath, "utf8");

const stylePattern =
  /(biographyText:\s*\{[\s\S]*?textAlign:\s*)"left"(,?[\s\S]*?\n\s*\},)/m;

if (stylePattern.test(source)) {
  source = source.replace(
    stylePattern,
    '$1"justify"$2'
  );
} else if (
  /biographyText:\s*\{[\s\S]*?textAlign:\s*"justify"/m.test(source)
) {
  console.log(
    "Biography text is already justified."
  );
} else {
  throw new Error(
    "Could not find the biographyText textAlign style."
  );
}

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "Biography text alignment changed to justify."
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
