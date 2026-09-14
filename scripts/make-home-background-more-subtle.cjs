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
  '"rgba(255,255,255,0.42)"';

const after =
  '"rgba(255,255,255,0.50)"';

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
  "Home background made a bit more subtle."
);
console.log(
  "Overlay: 0.42 -> 0.50"
);
console.log(
  "The background remains visible while improving text readability."
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
