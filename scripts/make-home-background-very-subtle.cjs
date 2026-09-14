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
  '"rgba(255,255,255,0.58)"';

const after =
  '"rgba(255,255,255,0.70)"';

if (s.includes(before)) {
  s = s.replace(
    before,
    after
  );
} else if (s.includes(after)) {
  console.log(
    "Home background is already using the very-subtle overlay."
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
  "Home background made very subtle."
);
console.log(
  "Overlay: 0.58 -> 0.70"
);
console.log(
  "Only opacity changed."
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
