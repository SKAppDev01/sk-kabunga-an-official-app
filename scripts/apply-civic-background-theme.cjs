const fs = require("fs");
const path = require("path");

const root = process.cwd();

const tabFiles = [
  "home.tsx",
  "projects.tsx",
  "finance.tsx",
  "records.tsx",
  "more.tsx",
];

function patchFile(fileName) {
  const filePath = path.join(
    root,
    "src/app/(tabs)",
    fileName
  );

  let source = fs.readFileSync(
    filePath,
    "utf8"
  );

  if (
    source.includes(
      "<CivicBackground />"
    )
  ) {
    console.log(
      `${fileName}: civic background already applied`
    );
    return;
  }

  // Remove ImageBackground from the React Native import,
  // since the new theme is drawn with lightweight Views.
  source = source.replace(
    /\n\s*ImageBackground,\s*/m,
    "\n  "
  );

  const safeAreaImport =
    'import { SafeAreaView } from "react-native-safe-area-context";';

  if (
    !source.includes(
      'from "../../components/CivicBackground"'
    )
  ) {
    if (!source.includes(safeAreaImport)) {
      throw new Error(
        `${fileName}: SafeAreaView import not found`
      );
    }

    source = source.replace(
      safeAreaImport,
      `${safeAreaImport}

import { CivicBackground } from "../../components/CivicBackground";`
    );
  }

  // Replace the previous image-based background wrapper.
  const oldOpening =
    /<ImageBackground\s+source=\{require\(\s*["']\.\.\/\.\.\/\.\.\/assets\/images\/home-background\.png["']\s*\)\}\s+style=\{styles\.background\}\s+resizeMode=["']stretch["']\s*>\s*<View\s+pointerEvents=["']none["']\s+style=\{styles\.backgroundOverlay\}\s*\/>/m;

  if (!oldOpening.test(source)) {
    throw new Error(
      `${fileName}: expected current background wrapper not found`
    );
  }

  source = source.replace(
    oldOpening,
    `<View style={styles.background}>
      <CivicBackground />`
  );

  const closingIndex =
    source.lastIndexOf(
      "</ImageBackground>"
    );

  if (closingIndex < 0) {
    throw new Error(
      `${fileName}: ImageBackground closing tag not found`
    );
  }

  source =
    source.slice(0, closingIndex) +
    "</View>" +
    source.slice(
      closingIndex +
        "</ImageBackground>".length
    );

  // Remove the old white image wash.
  source = source.replace(
    /\n\s*backgroundOverlay:\s*\{[\s\S]*?\n\s*\},\n(?=\s*safeArea:)/m,
    "\n"
  );

  // Keep the screen rooted on the same clean civic base.
  source = source.replace(
    /background:\s*\{\s*flex:\s*1,\s*\},/m,
    `background: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },`
  );

  fs.writeFileSync(
    filePath,
    source,
    "utf8"
  );

  console.log(
    `${fileName}: applied civic background`
  );
}

for (const fileName of tabFiles) {
  patchFile(fileName);
}

console.log("");
console.log(
  "Civic UI background theme applied to all five main tabs."
);
console.log(
  "The old image file was left untouched, but the tabs no longer use it."
);
console.log(
  "Run: npx tsc --noEmit"
);
