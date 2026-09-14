const fs = require("fs");
const path = require("path");

const root = process.cwd();

function file(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(file(rel), "utf8");
}

function write(rel, text) {
  fs.writeFileSync(file(rel), text, "utf8");
  console.log(`fixed: ${rel}`);
}

function replaceRequired(text, search, replacement, label) {
  if (!text.includes(search)) {
    throw new Error(`Could not find expected code for: ${label}`);
  }
  return text.replace(search, replacement);
}

function replaceRegexRequired(text, regex, replacement, label) {
  if (!regex.test(text)) {
    throw new Error(`Could not find expected code for: ${label}`);
  }
  regex.lastIndex = 0;
  return text.replace(regex, replacement);
}

// ------------------------------------------------------------
// 1. Tabs: remove direct type dependency on @react-navigation/bottom-tabs.
// The runtime Tabs implementation remains unchanged.
// ------------------------------------------------------------
{
  const rel = "src/app/(tabs)/_layout.tsx";
  let s = read(rel);

  s = s.replace(
    'import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";\n',
    ""
  );

  s = s.replace(
    "props: BottomTabBarButtonProps",
    "props: any"
  );

  write(rel, s);
}

// ------------------------------------------------------------
// 2. DateTimePicker: SDK/library now types onValueChange as:
// (event: DateTimePickerChangeEvent, date: Date) => void
// The handlers do not use the event object, so use unknown and a required Date.
// ------------------------------------------------------------
const pickerFiles = [
  "src/app/add-document.tsx",
  "src/app/add-youth.tsx",
  "src/app/create-activity.tsx",
  "src/app/create-meeting.tsx",
  "src/app/edit-document.tsx",
  "src/app/edit-youth.tsx",
];

for (const rel of pickerFiles) {
  let s = read(rel);

  s = s.replace(
    /import DateTimePicker,\s*\{\s*DateTimePickerEvent,\s*\}\s*from "@react-native-community\/datetimepicker";/m,
    'import DateTimePicker from "@react-native-community/datetimepicker";'
  );

  s = s.replace(
    /(_event:\s*)DateTimePickerEvent/g,
    "$1unknown"
  );

  s = s.replace(
    /(function\s+handle[A-Za-z0-9_]*ValueChange\s*\(\s*_event:\s*unknown,\s*selected(?:Date|Time))\?:\s*Date(\s*\))/g,
    "$1: Date$2"
  );

  write(rel, s);
}

// ------------------------------------------------------------
// 3. Founding Official setup:
// - processAuthorization always returns boolean
// - remove obsolete/dead legacy CameraView branch; reusable QRScanner is the
//   active scanner path
// - replace removed StyleSheet.absoluteFillObject
// - remove duplicate cameraStatusText style
// ------------------------------------------------------------
{
  const rel = "src/app/founding-official-setup.tsx";
  let s = read(rel);

  s = replaceRequired(
    s,
    `    if (
      isProcessing ||
      !authorizationData.trim()
    ) {
      return;
    }`,
    `    if (
      isProcessing ||
      !authorizationData.trim()
    ) {
      return false;
    }`,
    "founding authorization boolean return"
  );

  const legacyBranch =
    /\{mode === "scanner" \? \([\s\S]*?\) : \(\s*(<ScrollView)/m;

  s = replaceRegexRequired(
    s,
    legacyBranch,
    "{(\n        $1",
    "obsolete founding scanner branch"
  );

  s = s.replace(
    /\.\.\.StyleSheet\.absoluteFillObject,/g,
    `position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,`
  );

  const duplicateStyle = `  cameraStatusText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },

`;
  if (s.includes(duplicateStyle)) {
    s = s.replace(duplicateStyle, "");
  }

  write(rel, s);
}

// ------------------------------------------------------------
// 4. Meeting status service: restore the service function consumed by
// meeting-details.tsx and audit the status change.
// ------------------------------------------------------------
{
  const activityRel = "src/services/app-activity.ts";
  let activity = read(activityRel);

  if (!activity.includes('"meeting_status_updated"')) {
    activity = replaceRequired(
      activity,
      '  | "meeting_created"\n',
      '  | "meeting_created"\n  | "meeting_status_updated"\n',
      "meeting status audit action"
    );
    write(activityRel, activity);
  }

  const rel = "src/services/meetings.ts";
  let s = read(rel);

  if (!/export async function updateMeetingStatus\s*\(/.test(s)) {
    const marker = "export async function updateMeetingAgenda";

    if (!s.includes(marker)) {
      throw new Error(
        "Could not find updateMeetingAgenda insertion point in meetings.ts"
      );
    }

    const fn = `export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus
) {
  await requireOfficialAccess();
  await initializeDatabase();

  const cleanId =
    meetingId.trim();

  if (!cleanId) {
    throw new Error(
      "MEETING_NOT_FOUND"
    );
  }

  const db =
    await getDatabase();

  const meeting =
    await db.getFirstAsync<{
      title: string;
    }>(
      \`
        SELECT title
        FROM meetings
        WHERE id = ?
        LIMIT 1
      \`,
      cleanId
    );

  if (!meeting) {
    throw new Error(
      "MEETING_NOT_FOUND"
    );
  }

  const result =
    await db.runAsync(
      \`
        UPDATE meetings
        SET
          status = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      \`,
      status,
      cleanId
    );

  if (result.changes === 0) {
    throw new Error(
      "MEETING_NOT_FOUND"
    );
  }

  await recordAppActivity({
    actionType:
      "meeting_status_updated",
    entityType: "meeting",
    entityId: cleanId,
    subject: meeting.title,
    detail:
      \`Meeting status: \${status}\`,
  });
}

`;

    s = s.replace(marker, fn + marker);
    write(rel, s);
  }
}

// ------------------------------------------------------------
// 5. Official QR screen: pressed style is referenced by image buttons.
// ------------------------------------------------------------
{
  const rel = "src/app/official-data-qr.tsx";
  let s = read(rel);

  if (
    s.includes("styles.pressed") &&
    !/\n\s*pressed:\s*\{/.test(s)
  ) {
    const end = s.lastIndexOf("});");
    if (end < 0) {
      throw new Error("Could not find StyleSheet end in official-data-qr.tsx");
    }

    s =
      s.slice(0, end) +
      `  pressed: {
    opacity: 0.7,
  },
` +
      s.slice(end);

    write(rel, s);
  }
}

// ------------------------------------------------------------
// 6. Youth profile traceability: the loaded record is named "record".
// ------------------------------------------------------------
{
  const rel = "src/app/youth-profile.tsx";
  let s = read(rel);

  s = s.replace(
    "recordId={youth.id}",
    "recordId={record.id}"
  );

  write(rel, s);
}

// ------------------------------------------------------------
// 7. QR scanner: expo-status-bar no longer accepts translucent in current types.
// ------------------------------------------------------------
{
  const rel = "src/components/QRScanner.tsx";
  let s = read(rel);

  s = s.replace(
    /\n\s*translucent\s*\n\s*backgroundColor="transparent"/,
    '\n        backgroundColor="transparent"'
  );

  write(rel, s);
}

// ------------------------------------------------------------
// 8. Data sharing: imported/backup values are runtime-validated before insert,
// but their generic Record<string, unknown> type is wider than SQLiteBindValue.
// Cast only at the SQLite variadic bind boundary.
// ------------------------------------------------------------
{
  const rel = "src/services/data-sharing.ts";
  let s = read(rel);

  const matches = s.match(/\.\.\.values/g) || [];
  if (matches.length < 2) {
    throw new Error(
      `Expected at least 2 SQLite ...values bind sites; found ${matches.length}`
    );
  }

  s = s.replace(
    /\.\.\.values/g,
    "...(values as any[])"
  );

  write(rel, s);
}

console.log("");
console.log("Phase 13 TypeScript validation fixes applied.");
console.log("Now run: npx tsc --noEmit");
