const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/app-settings.tsx"
);

let source = fs.readFileSync(filePath, "utf8");

if (source.includes('router.push("/support-feedback")')) {
  console.log("Support & Feedback is already present.");
  process.exit(0);
}

const aboutHeading = /(\s*<Text\s+style=\{styles\.sectionTitle\}\s*>\s*About\s*<\/Text>)/m;

if (!aboutHeading.test(source)) {
  throw new Error(
    "Could not find the About section in App Settings."
  );
}

const supportSection = `

        <Text
          style={styles.sectionTitle}
        >
          Support & Feedback
        </Text>

        <NavigationRow
          icon="chatbubbles-outline"
          title="Support & Feedback"
          description="Get help, report an issue, or share suggestions"
          onPress={() =>
            router.push(
              "/support-feedback"
            )
          }
        />
`;

source = source.replace(
  aboutHeading,
  supportSection + "$1"
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log("Support & Feedback added to App Settings.");
console.log("New route: /support-feedback");
console.log("");
console.log("Run: npx tsc --noEmit");
