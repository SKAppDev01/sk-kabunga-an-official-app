const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/(tabs)/more.tsx"
);

if (!fs.existsSync(filePath)) {
  throw new Error(
    "src/app/(tabs)/more.tsx was not found."
  );
}

let source = fs.readFileSync(filePath, "utf8");

// Add Alert to the react-native import if needed.
const rnImportMatch =
  source.match(
    /import \{[\s\S]*?\} from "react-native";/
  );

if (
  !rnImportMatch ||
  !/\bAlert\b/.test(rnImportMatch[0])
) {
  source = source.replace(
    /import \{\n([\s\S]*?)\} from "react-native";/,
    (match, body) =>
      `import {\n  Alert,\n${body}} from "react-native";`
  );
}

const signature =
  "  async function handleSignOut() {";

const start = source.indexOf(signature);

if (start < 0) {
  throw new Error(
    "Could not find handleSignOut() in More screen."
  );
}

const openBrace =
  source.indexOf("{", start);

let depth = 0;
let end = -1;

for (
  let i = openBrace;
  i < source.length;
  i += 1
) {
  if (source[i] === "{") {
    depth += 1;
  }

  if (source[i] === "}") {
    depth -= 1;

    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

if (end < 0) {
  throw new Error(
    "Could not determine the end of handleSignOut()."
  );
}

const replacement = `  function handleSignOut() {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your account? Your local app data will remain on this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await clearSession();
              router.replace("/login");
            } catch (error) {
              console.error(
                "Sign out error:",
                error
              );

              Alert.alert(
                "Unable to Sign Out",
                "Something went wrong while signing out. Please try again."
              );
            }
          },
        },
      ]
    );
  }`;

source =
  source.slice(0, start) +
  replacement +
  source.slice(end);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "Sign-out confirmation added to More."
);
console.log(
  "- Cancel keeps the user signed in"
);
console.log(
  "- Sign Out confirms and clears the session"
);
console.log(
  "- Local app data is not deleted"
);
console.log("");
console.log(
  "Run: npx tsc --noEmit"
);
