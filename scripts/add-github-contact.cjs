const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/support-feedback.tsx"
);

if (!fs.existsSync(filePath)) {
  throw new Error(
    "src/app/support-feedback.tsx was not found."
  );
}

let source = fs.readFileSync(filePath, "utf8");

if (
  source.includes(
    "https://github.com/SKAppDev01"
  )
) {
  console.log(
    "GitHub contact is already present."
  );
  process.exit(0);
}

const handlerAnchor =
  `  async function handleContactDeveloper() {`;

const handlerStart =
  source.indexOf(handlerAnchor);

if (handlerStart < 0) {
  throw new Error(
    "Could not find the Facebook contact handler."
  );
}

const returnStart =
  source.indexOf(
    "  return (",
    handlerStart
  );

if (returnStart < 0) {
  throw new Error(
    "Could not find the component return block."
  );
}

const githubHandler = `  async function handleOpenGitHub() {
    const githubUrl =
      "https://github.com/SKAppDev01";

    try {
      const supported =
        await Linking.canOpenURL(
          githubUrl
        );

      if (!supported) {
        Alert.alert(
          "Unable to Open GitHub",
          "GitHub could not be opened on this device."
        );
        return;
      }

      await Linking.openURL(
        githubUrl
      );
    } catch {
      Alert.alert(
        "Unable to Open GitHub",
        "Something went wrong while opening the developer GitHub profile."
      );
    }
  }

`;

source =
  source.slice(0, returnStart) +
  githubHandler +
  source.slice(returnStart);

const facebookButtonClose = `          </Pressable>
        </View>

        <View style={styles.noticeBox}>`;

if (!source.includes(facebookButtonClose)) {
  throw new Error(
    "Could not find the Facebook button area."
  );
}

const githubButton = `          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.githubButton,
              pressed && styles.pressed,
            ]}
            onPress={handleOpenGitHub}
          >
            <Ionicons
              name="logo-github"
              size={20}
              color={colors.text}
            />

            <Text style={styles.githubButtonText}>
              View Developer on GitHub
            </Text>
          </Pressable>
        </View>

        <View style={styles.noticeBox}>`;

source = source.replace(
  facebookButtonClose,
  githubButton
);

const styleAnchor = `  shareButtonText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },

`;

if (!source.includes(styleAnchor)) {
  throw new Error(
    "Could not find the feedback button styles."
  );
}

const githubStyles = `${styleAnchor}  githubButton: {
    minHeight: 48,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
  },

  githubButtonText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

`;

source = source.replace(
  styleAnchor,
  githubStyles
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "GitHub contact added to Support & Feedback."
);
console.log(
  "- View Developer on GitHub"
);
console.log(
  "- https://github.com/SKAppDev01"
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
