const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/app-settings.tsx"
);

let source = fs.readFileSync(
  filePath,
  "utf8"
);

// Add Image to react-native imports.
source = source.replace(
  /import \{\n([\s\S]*?)\} from "react-native";/,
  (match, body) => {
    if (/\bImage,/.test(body)) {
      return match;
    }

    return `import {\n  Image,\n${body}} from "react-native";`;
  }
);

// Replace the current developer section body with the new
// circular photo + biography layout.
const sectionPattern =
  /        <Text\s+style=\{styles\.sectionTitle\}\s*>\s*Developer Information\s*<\/Text>[\s\S]*?(?=      <\/ScrollView>)/m;

if (!sectionPattern.test(source)) {
  throw new Error(
    "Could not find the existing Developer Information section."
  );
}

const replacement = `        <Text
          style={styles.sectionTitle}
        >
          Developer Information
        </Text>

        <View style={styles.developerBox}>
          <Image
            source={require(
              "../../assets/images/developer-profile.jpg"
            )}
            style={styles.developerPhoto}
            resizeMode="cover"
          />

          <Text style={styles.developerTitle}>
            App Developer
          </Text>

          <Text style={styles.developerSubtitle}>
            Independent • Self-taught
          </Text>

          <View style={styles.bioDivider} />

          <Text style={styles.biographyLabel}>
            Biography
          </Text>

          <Text style={styles.biographyText}>
            I am a self-taught developer who
            loves programming and focuses on
            building practical applications
            that can solve real problems,
            simplify everyday tasks, and
            create useful digital solutions
            for people and communities.
          </Text>
        </View>

`;

source = source.replace(
  sectionPattern,
  replacement
);

// Remove old developer style blocks if they exist.
const oldStyleNames = [
  "developerBox",
  "developerHeader",
  "developerIcon",
  "developerHeaderText",
  "developerTitle",
  "developerSubtitle",
  "biographyLabel",
  "biographyText",
  "developerPhoto",
  "bioDivider",
];

function removeStyleBlock(text, name) {
  const marker = `  ${name}: {`;
  let start = text.indexOf(marker);

  if (start < 0) {
    return text;
  }

  const open = text.indexOf("{", start);
  let depth = 0;
  let close = -1;

  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }

  if (close < 0) return text;

  let end = close + 1;

  if (text.slice(end, end + 1) === ",") {
    end += 1;
  }

  while (
    end < text.length &&
    (text[end] === "\n" || text[end] === "\r")
  ) {
    end += 1;
  }

  return (
    text.slice(0, start) +
    text.slice(end)
  );
}

for (const name of oldStyleNames) {
  source = removeStyleBlock(
    source,
    name
  );
}

const stylesAnchor = `  pressed: {
    opacity: 0.65,
  },`;

if (!source.includes(stylesAnchor)) {
  throw new Error(
    "Could not find App Settings styles anchor."
  );
}

const developerStyles = `  developerBox: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.09,
    shadowRadius: 4,
  },

  developerPhoto: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: "#E3F2FD",
  },

  developerTitle: {
    width: "100%",
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    fontWeight: typography.fontWeight.bold,
    color: "#0038A8",
    textAlign: "center",
  },

  developerSubtitle: {
    width: "100%",
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: "center",
  },

  bioDivider: {
    width: "100%",
    height: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },

  biographyLabel: {
    width: "100%",
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "left",
  },

  biographyText: {
    width: "100%",
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: "left",
  },

`;

source = source.replace(
  stylesAnchor,
  developerStyles + stylesAnchor
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "Developer profile updated:"
);
console.log(
  "- circular profile photo"
);
console.log(
  "- developer title and subtitle"
);
console.log(
  "- biography directly below profile"
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
