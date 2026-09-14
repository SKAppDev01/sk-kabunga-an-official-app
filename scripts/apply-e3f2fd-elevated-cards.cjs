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

function read(relativePath) {
  return fs.readFileSync(
    path.join(root, relativePath),
    "utf8"
  );
}

function write(relativePath, source) {
  fs.writeFileSync(
    path.join(root, relativePath),
    source,
    "utf8"
  );
}

function setRootBackground(source) {
  // Current builds may contain #8ACFF8, #90CAF9, #F8FAFC,
  // or #F5F8FD depending on which theme patch was last applied.
  source = source.replace(
    /(background:\s*\{\s*flex:\s*1,\s*backgroundColor:\s*")[#0-9A-Fa-f]+(")/m,
    '$1#E3F2FD$2'
  );

  return source;
}

function findStyleBlock(source, styleName) {
  const marker = `  ${styleName}: {`;
  const start = source.indexOf(marker);

  if (start < 0) {
    return null;
  }

  const open = source.indexOf("{", start);
  let depth = 0;

  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start,
          open,
          close: i,
        };
      }
    }
  }

  return null;
}

function addElevation(source, styleName) {
  const block = findStyleBlock(
    source,
    styleName
  );

  if (!block) {
    console.log(
      `Skipped ${styleName}: style not found`
    );
    return source;
  }

  const body = source.slice(
    block.open,
    block.close + 1
  );

  if (
    /\belevation\s*:/.test(body)
  ) {
    console.log(
      `${styleName}: elevation already present`
    );
    return source;
  }

  const addition = `
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 5,`;

  return (
    source.slice(0, block.close) +
    addition +
    "\n  " +
    source.slice(block.close)
  );
}

// ------------------------------------------------------------
// Shared civic background: exact #E3F2FD base.
// Remove the previous global white wash so the requested color
// is actually what the user sees.
// ------------------------------------------------------------
const civicPath =
  "src/components/CivicBackground.tsx";

let civic = read(civicPath);

civic = civic.replace(
  /backgroundColor:\s*"#[0-9A-Fa-f]{6}",/,
  'backgroundColor: "#E3F2FD",'
);

// Remove the full-screen white overlay element if it exists.
civic = civic.replace(
  /\s*<View style=\{styles\.softWhiteOverlay\} \/>\s*/m,
  "\n"
);

// Remove its style block if it exists.
civic = civic.replace(
  /\n\s*softWhiteOverlay:\s*\{\s*\.\.\.StyleSheet\.absoluteFillObject,\s*backgroundColor:\s*"rgba\(255,255,255,[^)]+\)",\s*\},?/m,
  ""
);

write(civicPath, civic);

// ------------------------------------------------------------
// Main tabs: exact background + elevated real cards.
// Flat navigation/list rows are intentionally left flat.
// ------------------------------------------------------------
for (const fileName of tabFiles) {
  const relativePath =
    `src/app/(tabs)/${fileName}`;

  let source = read(relativePath);

  source = setRootBackground(source);

  if (fileName === "home.tsx") {
    source = addElevation(
      source,
      "summaryCard"
    );
    source = addElevation(
      source,
      "sectionCard"
    );
  }

  if (fileName === "projects.tsx") {
    source = addElevation(
      source,
      "projectCard"
    );
  }

  if (fileName === "finance.tsx") {
    // Make finance surfaces real white cards on the blue background.
    source = source.replace(
      /(overviewCard:\s*\{[\s\S]*?backgroundColor:\s*)colors\.background(,)/m,
      "$1colors.white$2"
    );

    source = source.replace(
      /(quickAction:\s*\{[\s\S]*?backgroundColor:\s*)colors\.background(,)/m,
      "$1colors.white$2"
    );

    source = addElevation(
      source,
      "overviewCard"
    );
    source = addElevation(
      source,
      "quickAction"
    );
  }

  if (fileName === "more.tsx") {
    source = addElevation(
      source,
      "profileCard"
    );
  }

  write(relativePath, source);
}

console.log("");
console.log(
  "Theme updated:"
);
console.log(
  "- exact background: #E3F2FD"
);
console.log(
  "- elevated white cards"
);
console.log(
  "- flat Records / settings list rows preserved"
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
