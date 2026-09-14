const fs = require("fs");
const path = require("path");

const root = process.cwd();

const homePath = path.join(
  root,
  "src/app/(tabs)/home.tsx"
);

const layoutPath = path.join(
  root,
  "src/app/(tabs)/_layout.tsx"
);

function read(file) {
  return fs.readFileSync(
    file,
    "utf8"
  );
}

function write(file, content) {
  fs.writeFileSync(
    file,
    content,
    "utf8"
  );
}

let home = read(homePath);
let layout = read(layoutPath);

// ------------------------------------------------------------
// HOME
// Keep the stronger background, but remove the extra bottom
// padding that was only needed while the tab bar was overlaid.
// ------------------------------------------------------------
home = home.replace(
  /paddingBottom:\s*spacing\.xxl\s*\+\s*88,/m,
  "paddingBottom: spacing.xxl,"
);

// If formatting differs slightly, handle the previous multiline
// version used by the earlier patch.
home = home.replace(
  /paddingBottom:\s*\n\s*spacing\.xxl\s*\+\s*88,/m,
  "paddingBottom: spacing.xxl,"
);

write(homePath, home);

// ------------------------------------------------------------
// TABS
// Remove the Home-only absolute/translucent tab bar override.
// Restore a normal opaque tab bar that occupies its own layout
// space, so Home content/background ends exactly above it.
// ------------------------------------------------------------
const homeOverridePattern =
  /\n\s*tabBarStyle:\s*\{\s*height:\s*62\s*\+\s*Math\.max\(\s*insets\.bottom,\s*8\s*\),\s*paddingTop:\s*7,\s*paddingBottom:\s*Math\.max\(\s*insets\.bottom,\s*8\s*\),\s*borderTopWidth:\s*1,\s*borderTopColor:\s*"rgba\(229,231,235,0\.72\)",\s*backgroundColor:\s*"rgba\(255,255,255,0\.84\)",\s*position:\s*"absolute",\s*elevation:\s*8,\s*\},/m;

if (homeOverridePattern.test(layout)) {
  layout = layout.replace(
    homeOverridePattern,
    ""
  );
}

// Also remove any simpler Home-only absolute/translucent override
// that may have been manually reformatted.
layout = layout.replace(
  /\n\s*tabBarStyle:\s*\{[\s\S]*?position:\s*"absolute"[\s\S]*?backgroundColor:\s*"rgba\(255,255,255,0\.84\)"[\s\S]*?\},/m,
  ""
);

// ------------------------------------------------------------
// Ensure the GLOBAL tab bar is fully opaque and non-absolute.
// This covers the tab menu itself and its Android bottom inset.
// ------------------------------------------------------------
const screenOptionsPattern =
  /tabBarStyle:\s*\{[\s\S]*?\n\s*\},/m;

if (!screenOptionsPattern.test(layout)) {
  throw new Error(
    "Could not find the global tabBarStyle block in _layout.tsx."
  );
}

layout = layout.replace(
  screenOptionsPattern,
  `tabBarStyle: {
          height:
            62 +
            Math.max(
              insets.bottom,
              8
            ),

          paddingTop: 7,

          paddingBottom:
            Math.max(
              insets.bottom,
              8
            ),

          borderTopWidth: 1,

          borderTopColor:
            colors.border,

          backgroundColor:
            colors.white,

          elevation: 8,
        },`
);

write(layoutPath, layout);

console.log("");
console.log("Navigation/background layout fixed:");
console.log("- Home background stops exactly above the tab menu");
console.log("- Tab menu is fully opaque white");
console.log("- Scrolling content cannot show behind the tab menu");
console.log("- Android bottom safe area stays inside the opaque tab bar");
console.log("");
console.log("Next: npx tsc --noEmit");
