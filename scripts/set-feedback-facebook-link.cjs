const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/support-feedback.tsx"
);

let source = fs.readFileSync(filePath, "utf8");

if (!fs.existsSync(filePath)) {
  throw new Error(
    "src/app/support-feedback.tsx was not found."
  );
}

// Replace Share import with Linking.
source = source.replace(
  /\bShare,\n/,
  "Linking,\n"
);

// Remove the old feedback template constant if present.
source = source.replace(
  /const feedbackTemplate = `[\s\S]*?`;\n\n/m,
  ""
);

// Replace the old share handler with the Facebook contact handler.
source = source.replace(
  /  async function handleShareFeedback\(\) \{[\s\S]*?\n  \}\n\n/m,
`  async function handleContactDeveloper() {
    const facebookUrl =
      "https://www.facebook.com/share/1DhbzqeNpK/";

    try {
      const supported =
        await Linking.canOpenURL(
          facebookUrl
        );

      if (!supported) {
        Alert.alert(
          "Unable to Open Facebook",
          "Facebook could not be opened on this device."
        );
        return;
      }

      await Linking.openURL(
        facebookUrl
      );
    } catch {
      Alert.alert(
        "Unable to Open Facebook",
        "Something went wrong while opening the developer profile."
      );
    }
  }

`
);

// Update feedback copy.
source = source.replace(
  "Share a suggestion or report an issue",
  "Contact the Developer"
);

source = source.replace(
  /Use the feedback template to describe\s+a bug, suggest an improvement, or share\s+general comments about the app\./m,
  "Open the developer's Facebook profile to send feedback, report an issue, or share a suggestion about the app."
);

// Update button handler.
source = source.replace(
  "onPress={handleShareFeedback}",
  "onPress={handleContactDeveloper}"
);

// Update button icon and label.
source = source.replace(
  'name="share-social-outline"',
  'name="logo-facebook"'
);

source = source.replace(
  "Share Feedback",
  "Contact Developer on Facebook"
);

// Update privacy/info note.
source = source.replace(
  /The app does not automatically send\s+your records or private data when you\s+share feedback\. Only the text you choose\s+to share through Android is included\./m,
  "Opening Facebook does not automatically send any app records or private data. You decide what information to share when contacting the developer."
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log("Support & Feedback updated.");
console.log("- Button: Contact Developer on Facebook");
console.log("- Opens developer Facebook profile");
console.log("- Existing support guidance remains");
console.log("");
console.log("Run: npx tsc --noEmit");
