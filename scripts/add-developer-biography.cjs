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

if (source.includes("Developer Information")) {
  console.log("Developer section is already present.");
  process.exit(0);
}

const anchor = `        <View style={styles.aboutBox}>`;

const aboutStart = source.indexOf(anchor);
if (aboutStart < 0) {
  throw new Error(
    "Could not find the About section in app-settings.tsx."
  );
}

const scrollClose = source.indexOf(
  "      </ScrollView>",
  aboutStart
);

if (scrollClose < 0) {
  throw new Error(
    "Could not find the end of the App Settings content."
  );
}

const developerSection = `

        <Text
          style={styles.sectionTitle}
        >
          Developer Information
        </Text>

        <View style={styles.developerBox}>
          <View style={styles.developerHeader}>
            <View style={styles.developerIcon}>
              <Ionicons
                name="code-slash-outline"
                size={24}
                color={colors.primary}
              />
            </View>

            <View style={styles.developerHeaderText}>
              <Text style={styles.developerTitle}>
                App Developer
              </Text>

              <Text style={styles.developerSubtitle}>
                Independent • Self-taught
              </Text>
            </View>
          </View>

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

source =
  source.slice(0, scrollClose) +
  developerSection +
  source.slice(scrollClose);

const stylesAnchor = `  pressed: {
    opacity: 0.65,
  },`;

const developerStyles = `  developerBox: {
    padding: spacing.lg,
    borderRadius: 16,
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

  developerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  developerIcon: {
    width: 46,
    height: 46,
    flexShrink: 0,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  developerHeaderText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  developerTitle: {
    width: "100%",
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    fontWeight: typography.fontWeight.bold,
    color: "#0038A8",
  },

  developerSubtitle: {
    width: "100%",
    marginTop: 2,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
  },

  biographyLabel: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  biographyText: {
    width: "100%",
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    lineHeight: 19,
    color: colors.textSecondary,
  },

`;

if (!source.includes(stylesAnchor)) {
  throw new Error(
    "Could not find the expected App Settings styles anchor."
  );
}

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
console.log("Developer Information added.");
console.log("- Developer card");
console.log("- Self-taught developer subtitle");
console.log("- Biography");
console.log("");
console.log("Run: npx tsc --noEmit");
