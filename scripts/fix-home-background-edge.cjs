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

// Let the decorative background extend slightly past the Home scene.
// The tab bar remains opaque, so the image is only visible up to the
// exact top edge of the navigation menu.
s = s.replace(
  /safeArea:\s*\{\s*flex:\s*1,\s*position:\s*"relative",\s*overflow:\s*"hidden",/,
  `safeArea: {
    flex: 1,
    position: "relative",
    overflow: "visible",`
);

// Remove width/height constraints from the absolute background image,
// and extend it below the scene enough to cover the white gap.
s = s.replace(
  /backgroundImage:\s*\{\s*position:\s*"absolute",\s*top:\s*0,\s*right:\s*0,\s*bottom:\s*0,\s*left:\s*0,\s*width:\s*"100%",\s*height:\s*"100%",\s*\},/m,
  `backgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: -96,
    left: 0,
  },`
);

// Extend the white wash together with the image, preserving readability.
s = s.replace(
  /backgroundWash:\s*\{\s*position:\s*"absolute",\s*top:\s*0,\s*right:\s*0,\s*bottom:\s*0,\s*left:\s*0,/m,
  `backgroundWash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: -96,
    left: 0,`
);

fs.writeFileSync(
  homePath,
  s,
  "utf8"
);

console.log(
  "Home background now visually reaches the exact top edge of the opaque tab bar."
);
console.log(
  "Scroll content itself still ends above the tab bar."
);
console.log(
  "Run: npx tsc --noEmit"
);
