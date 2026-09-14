const fs = require("fs");
const path = require("path");

const homePath = path.join(
  process.cwd(),
  "src/app/(tabs)/home.tsx"
);

let s = fs.readFileSync(homePath, "utf8");

// The previous Home background used resizeMode="cover".
// "cover" fills the area by cropping/zooming the image.
//
// Replace it with "stretch" so the whole source image is resized
// to the available background area without cropping/zooming.
if (s.includes('resizeMode="cover"')) {
  s = s.replace(
    'resizeMode="cover"',
    'resizeMode="stretch"'
  );
} else if (s.includes('resizeMode="stretch"')) {
  console.log("Background is already using stretch mode.");
} else {
  throw new Error(
    'Could not find the Home background resizeMode.'
  );
}

fs.writeFileSync(homePath, s, "utf8");

console.log("");
console.log("Home background sizing updated:");
console.log("- no cover/crop zoom");
console.log("- entire image is resized to fit the Home background area");
console.log("- existing bottom-edge/navigation fix is preserved");
console.log("");
console.log("Run: npx tsc --noEmit");
