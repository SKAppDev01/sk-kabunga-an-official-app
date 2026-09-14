const fs = require("fs");
const path = require("path");

const homePath = path.join(
  process.cwd(),
  "src/app/(tabs)/home.tsx"
);

let s = fs.readFileSync(
  homePath,
  "utf8"
);

const before =
  '"rgba(255,255,255,0.32)"';

const after =
  '"rgba(255,255,255,0.42)"';

if (s.includes(before)) {
  s = s.replace(
    before,
    after
  );
} else if (s.includes(after)) {
  console.log(
    "Home background subtlety is already applied."
  );
} else {
  throw new Error(
    "Could not find the expected Home background overlay opacity."
  );
}

fs.writeFileSync(
  homePath,
  s,
  "utf8"
);

console.log("");
console.log(
  "Home background made slightly more subtle."
);
console.log(
  "Overlay: 0.32 -> 0.42"
);
console.log(
  "The image remains visible, but text/cards should read more clearly."
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
