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
// 1) Make the uploaded background image more visible.
// ------------------------------------------------------------
if (
  home.includes(
    '"rgba(255,255,255,0.84)"'
  )
) {
  home = home.replace(
    '"rgba(255,255,255,0.84)"',
    '"rgba(255,255,255,0.74)"'
  );
} else if (
  home.includes(
    '"rgba(255,255,255,0.74)"'
  )
) {
  console.log(
    "Background opacity already updated."
  );
} else {
  throw new Error(
    "Could not find the Home background white-wash opacity."
  );
}

// Give the Home screen enough bottom content space because
// its tab bar becomes an overlay.
home = home.replace(
  /paddingBottom:\s*spacing\.xxl,/,
  `paddingBottom:
      spacing.xxl + 88,`
);

write(homePath, home);

// ------------------------------------------------------------
// 2) On HOME ONLY, make the bottom tab bar overlay the screen.
// This lets the background image visually continue behind the
// bottom navigation instead of stopping above it.
// ------------------------------------------------------------
const homeScreenStart =
  '<Tabs.Screen\\n        name="home"';

if (
  !layout.includes(
    'backgroundColor: "rgba(255,255,255,0.84)"'
  )
) {
  const homeOptionsPattern =
    /(<Tabs\.Screen\s+name="home"\s+options=\{\{\s+title:\s*"Home",)/m;

  if (
    !homeOptionsPattern.test(
      layout
    )
  ) {
    throw new Error(
      "Could not find the Home tab options block."
    );
  }

  layout = layout.replace(
    homeOptionsPattern,
    `$1

          tabBarStyle: {
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
              "rgba(229,231,235,0.72)",

            backgroundColor:
              "rgba(255,255,255,0.84)",

            position: "absolute",

            elevation: 8,
          },`
  );
} else {
  console.log(
    "Home tab bar overlay already applied."
  );
}

write(layoutPath, layout);

console.log("");
console.log(
  "Home background updated:"
);
console.log(
  "- stronger image visibility"
);
console.log(
  "- background extends visually behind Home bottom navigation"
);
console.log(
  "- Home content gets extra bottom spacing for safe scrolling"
);
console.log("");
console.log(
  "Next: npx tsc --noEmit"
);
