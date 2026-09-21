# Universal App Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every duplicated post-login page header in the SK Kabunga-an Official App with one reusable `AppHeader` that matches the approved Home header and keeps the title fixed, centered, and visually seamless with the top/status-bar area.

**Architecture:** Add `src/components/AppHeader.tsx` as the single source of truth for authenticated-screen header visuals and navigation. Every post-login screen renders `AppHeader` as a fixed sibling before its `ScrollView`/`FlatList`, while `_layout.tsx` stops drawing global header/back-button overlays. A source-verification script enforces the migration contract module-by-module and verifies that excluded authentication/setup screens stay unchanged.

**Tech Stack:** React Native, Expo Router, TypeScript, `react-native-safe-area-context`, `@expo/vector-icons`, Expo StatusBar/NavigationBar already present in the project.

**Spec:** `docs/superpowers/specs/2026-09-16-universal-app-header-design.md`

## Global Constraints

- Apply the universal header to all rendered post-login screens; keep Login, Register, Recovery, Profile Setup, Founding Official Setup, Official Verification, and redirect-only routes headerless/special-purpose.
- Use `colors.primary` (`#2563EB`) for the header background; do not add another hard-coded blue.
- Preserve the approved Home header geometry: 88-point body minimum height, 28-point bottom-left and bottom-right radii, square top corners, white bold centered title, and elevation/shadow equivalent to the existing Home header.
- `AppHeader` owns the top safe area via `useSafeAreaInsets()`; migrated screens must not add top safe-area padding outside the header.
- Header title must remain mathematically centered regardless of Back or right-side actions.
- Back touch target must be at least 44x44 points.
- Header stays outside all `ScrollView`/`FlatList` content; remove page-header `stickyHeaderIndices`.
- Preserve all business logic, database calls, authorization behavior, form behavior, route names, and tab destinations.
- Keep the current immersive Android status/navigation-bar behavior unchanged unless verification proves a regression.
- Do not add a native dependency; this migration must not require a new Dev Build.
- Do not change the database schema.
- Keep the existing bottom tab navigation behavior and appearance unchanged.

---

## File Structure

### Create

- `src/components/AppHeader.tsx` — one reusable fixed header for all authenticated screens.
- `scripts/verify-universal-header.mjs` — source-level migration contract and regression verifier.

### Modify

- `src/app/_layout.tsx` — remove global blue backdrop and floating Back button after all screens migrate.
- `src/app/(tabs)/home.tsx`
- `src/app/(tabs)/projects.tsx`
- `src/app/(tabs)/finance.tsx`
- `src/app/(tabs)/records.tsx`
- `src/app/(tabs)/more.tsx`
- All rendered post-login subscreens listed in Tasks 3-9.

### Delete after zero imports remain

- `src/components/RoundedTabHeader.tsx`

### Intentionally unchanged

- `src/app/login.tsx`
- `src/app/register.tsx`
- `src/app/recovery.tsx`
- `src/app/profile-setup.tsx`
- `src/app/founding-official-setup.tsx`
- `src/app/official-verification.tsx`
- `src/app/index.tsx`
- `src/app/projects-report.tsx` (redirect-only; renders no screen chrome)
- `src/app/(tabs)/_layout.tsx` (bottom tab navigation stays unchanged)

---

### Task 1: Add the migration verifier and universal `AppHeader`

**Files:**
- Create: `scripts/verify-universal-header.mjs`
- Create: `src/components/AppHeader.tsx`

**Interfaces:**
- Produces: `AppHeader(props: AppHeaderProps): JSX.Element`
- Produces: `AppHeaderProps = { title: string; showBack?: boolean; onBackPress?: () => void; left?: React.ReactNode; right?: React.ReactNode; accessibilityLabel?: string }`
- Later tasks import `AppHeader` from `../components/AppHeader` or `../../components/AppHeader`.

- [ ] **Step 1: Create the source-verification script before creating `AppHeader`**

Create `scripts/verify-universal-header.mjs` with the exact migration inventory and checks below:

```js
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const GROUPS = {
  tabs: [
    "src/app/(tabs)/home.tsx",
    "src/app/(tabs)/projects.tsx",
    "src/app/(tabs)/finance.tsx",
    "src/app/(tabs)/records.tsx",
    "src/app/(tabs)/more.tsx",
  ],
  youth_profile: [
    "src/app/youth-registry.tsx",
    "src/app/youth-profile.tsx",
    "src/app/youth-statistics.tsx",
    "src/app/add-youth.tsx",
    "src/app/edit-youth.tsx",
    "src/app/profile.tsx",
    "src/app/edit-profile.tsx",
    "src/app/profile-qr.tsx",
    "src/app/dashboard.tsx",
  ],
  activities: [
    "src/app/activities.tsx",
    "src/app/upcoming-events.tsx",
    "src/app/activity-details.tsx",
    "src/app/activity-attendance.tsx",
    "src/app/activity-expenses.tsx",
    "src/app/activity-history.tsx",
    "src/app/activity-participants.tsx",
    "src/app/activity-summary.tsx",
    "src/app/create-activity.tsx",
  ],
  meetings: [
    "src/app/meetings.tsx",
    "src/app/create-meeting.tsx",
    "src/app/meeting-details.tsx",
    "src/app/meeting-agenda.tsx",
    "src/app/meeting-attendance.tsx",
    "src/app/meeting-minutes.tsx",
    "src/app/meeting-resolutions.tsx",
  ],
  projects: [
    "src/app/new-project.tsx",
    "src/app/edit-project.tsx",
    "src/app/project-details.tsx",
    "src/app/project-expenses.tsx",
    "src/app/project-participants.tsx",
    "src/app/add-project-expense.tsx",
    "src/app/add-project-participant.tsx",
    "src/app/archived-projects.tsx",
  ],
  finance_budget: [
    "src/app/expenses.tsx",
    "src/app/add-expense.tsx",
    "src/app/edit-expense.tsx",
    "src/app/expense-details.tsx",
    "src/app/budget-allocations.tsx",
    "src/app/add-budget-allocation.tsx",
    "src/app/budget-categories.tsx",
    "src/app/add-budget-category.tsx",
    "src/app/budget-balance.tsx",
  ],
  documents_inventory: [
    "src/app/documents.tsx",
    "src/app/add-document.tsx",
    "src/app/edit-document.tsx",
    "src/app/document-details.tsx",
    "src/app/inventory.tsx",
    "src/app/add-inventory-item.tsx",
    "src/app/inventory-borrow.tsx",
    "src/app/inventory-condition.tsx",
    "src/app/inventory-history.tsx",
    "src/app/inventory-item-details.tsx",
    "src/app/inventory-quantity.tsx",
    "src/app/inventory-return.tsx",
  ],
  data_settings_reports: [
    "src/app/app-settings.tsx",
    "src/app/app-update.tsx",
    "src/app/backup-data.tsx",
    "src/app/restore-data.tsx",
    "src/app/import-data.tsx",
    "src/app/export-data.tsx",
    "src/app/data-management.tsx",
    "src/app/data-privacy.tsx",
    "src/app/data-transfer-history.tsx",
    "src/app/security-audit.tsx",
    "src/app/reports.tsx",
    "src/app/report-viewer.tsx",
    "src/app/official-data-qr.tsx",
    "src/app/public-data-qr.tsx",
    "src/app/receive-data-qr.tsx",
    "src/app/support-feedback.tsx",
  ],
};

const EXCLUDED_UI = [
  "src/app/login.tsx",
  "src/app/register.tsx",
  "src/app/recovery.tsx",
  "src/app/profile-setup.tsx",
  "src/app/founding-official-setup.tsx",
  "src/app/official-verification.tsx",
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function checkComponent() {
  const rel = "src/components/AppHeader.tsx";
  assert(exists(rel), `${rel}: missing`);
  if (!exists(rel)) return;

  const text = read(rel);
  const required = [
    "export type AppHeaderProps",
    "useSafeAreaInsets",
    "colors.primary",
    "minHeight: 88",
    "borderBottomLeftRadius: 28",
    "borderBottomRightRadius: 28",
    "router.back()",
    "numberOfLines={1}",
    "accessibilityRole=\"header\"",
    "width: 44",
    "height: 44",
  ];

  for (const needle of required) {
    assert(text.includes(needle), `${rel}: missing ${needle}`);
  }
}

function checkMigratedScreen(rel) {
  const text = read(rel);
  assert(text.includes("AppHeader"), `${rel}: must use AppHeader`);
  assert(!text.includes("RoundedTabHeader"), `${rel}: still uses RoundedTabHeader`);
  assert(!text.includes("stickyHeaderIndices"), `${rel}: page header still uses stickyHeaderIndices`);
  assert(!/\bheaderTitle\s*:/.test(text), `${rel}: old headerTitle style remains`);
  assert(!/\bheaderSpacer\s*:/.test(text), `${rel}: old headerSpacer style remains`);

  if (text.includes("SafeAreaView")) {
    const safeAreaEdges = /edges=\{\[\s*["']left["']\s*,\s*["']right["']\s*,\s*["']bottom["']\s*\]\}/s;
    assert(safeAreaEdges.test(text), `${rel}: SafeAreaView must exclude the top edge`);
  }
}

function checkGroup(name) {
  const files = GROUPS[name];
  assert(Boolean(files), `unknown group: ${name}`);
  if (!files) return;
  for (const rel of files) checkMigratedScreen(rel);
}

function checkLayout() {
  const rel = "src/app/_layout.tsx";
  const text = read(rel);
  assert(!text.includes("TopHeaderBackdrop"), `${rel}: TopHeaderBackdrop still exists`);
  assert(!text.includes("FloatingBackButton"), `${rel}: FloatingBackButton still exists`);
  assert(!text.includes("ROOT_ROUTES_WITHOUT_BACK"), `${rel}: old Back-route allowlist still exists`);
  assert(!text.includes("ROUTES_WITHOUT_BLUE_CHROME"), `${rel}: old blue-chrome allowlist still exists`);
  assert(!exists("src/components/RoundedTabHeader.tsx"), "RoundedTabHeader.tsx must be deleted after migration");

  for (const excluded of EXCLUDED_UI) {
    const excludedText = read(excluded);
    assert(!excludedText.includes("AppHeader"), `${excluded}: excluded screen must not import AppHeader`);
  }
}

const args = process.argv.slice(2);

if (args.includes("--component")) {
  checkComponent();
} else if (args.includes("--layout")) {
  checkLayout();
} else if (args.includes("--group")) {
  const index = args.indexOf("--group");
  checkGroup(args[index + 1]);
} else if (args.includes("--all")) {
  checkComponent();
  for (const name of Object.keys(GROUPS)) checkGroup(name);
  checkLayout();
} else {
  console.error("Usage: node scripts/verify-universal-header.mjs --component | --group <name> | --layout | --all");
  process.exit(2);
}

if (failures.length > 0) {
  console.error(`Universal header verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Universal header verification passed.");
```

- [ ] **Step 2: Run the component contract and verify it fails because `AppHeader` does not exist yet**

Run:

```bash
node scripts/verify-universal-header.mjs --component
```

Expected: exit 1 with `src/components/AppHeader.tsx: missing`.

- [ ] **Step 3: Create the minimal reusable `AppHeader` implementation**

Create `src/components/AppHeader.tsx`:

```tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, typography } from "../theme";

const SIDE_ZONE_WIDTH = 56;

export type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  accessibilityLabel?: string;
};

export function AppHeader({
  title,
  showBack = false,
  onBackPress,
  left,
  right,
  accessibilityLabel,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const handleBackPress = onBackPress ?? (() => router.back());

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.body}>
        <View style={[styles.sideZone, styles.leftZone]}>
          {left ??
            (showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={handleBackPress}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
              >
                <Ionicons name="arrow-back" size={23} color={colors.white} />
              </Pressable>
            ) : null)}
        </View>

        <Text
          accessibilityRole="header"
          accessibilityLabel={accessibilityLabel ?? title}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.title}
        >
          {title}
        </Text>

        <View style={[styles.sideZone, styles.rightZone]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4,
    zIndex: 20,
  },
  body: {
    minHeight: 88,
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  sideZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SIDE_ZONE_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  leftZone: {
    left: 0,
  },
  rightZone: {
    right: 0,
  },
  title: {
    position: "absolute",
    left: SIDE_ZONE_WIDTH,
    right: SIDE_ZONE_WIDTH,
    textAlign: "center",
    fontSize: typography.fontSize.xl,
    lineHeight: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  backButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
```

- [ ] **Step 4: Run the component verification**

Run:

```bash
node scripts/verify-universal-header.mjs --component
```

Expected: `Universal header verification passed.`

- [ ] **Step 5: Type-check the new component in the project context**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0. If the project already has unrelated baseline TypeScript errors, record them before changing header files and verify this task introduces no new errors.

- [ ] **Step 6: Commit the component and verifier**

```bash
git add src/components/AppHeader.tsx scripts/verify-universal-header.mjs
git commit -m "feat: add universal app header"
```

---

### Task 2: Migrate the five main tab screens

**Files:**
- Modify: `src/app/(tabs)/home.tsx`
- Modify: `src/app/(tabs)/projects.tsx`
- Modify: `src/app/(tabs)/finance.tsx`
- Modify: `src/app/(tabs)/records.tsx`
- Modify: `src/app/(tabs)/more.tsx`

**Interfaces:**
- Consumes: `AppHeader` from Task 1.
- Produces: five tab screens using `<AppHeader title="..." />` with no Back control.

- [ ] **Step 1: Run the predeclared tab migration check before editing**

```bash
node scripts/verify-universal-header.mjs --group tabs
```

Expected: FAIL because tab screens still import/use `RoundedTabHeader` and use the old top-safe-area configuration.

- [ ] **Step 2: Replace `RoundedTabHeader` with `AppHeader` in all five tabs**

For each file, replace the import with:

```tsx
import { AppHeader } from "../../components/AppHeader";
```

Use these exact titles:

```tsx
<AppHeader title="Home" />
<AppHeader title="Projects" />
<AppHeader title="Finance" />
<AppHeader title="Records" />
<AppHeader title="More" />
```

Place `AppHeader` immediately before the tab screen's main `ScrollView`/content container. Keep Home/Projects internal content sections named `styles.header`; those are page content, not page chrome.

- [ ] **Step 3: Move top safe-area ownership into `AppHeader`**

Change each tab screen's safe-area edges from top-only to:

```tsx
edges={["left", "right", "bottom"]}
```

Do not change `src/app/(tabs)/_layout.tsx`; its bottom navigation is intentionally out of scope.

- [ ] **Step 4: Verify the tab migration**

```bash
node scripts/verify-universal-header.mjs --group tabs
npx tsc --noEmit
```

Expected: tab verifier passes; TypeScript reports no new errors.

- [ ] **Step 5: Commit the tab migration**

```bash
git add 'src/app/(tabs)/home.tsx' 'src/app/(tabs)/projects.tsx' 'src/app/(tabs)/finance.tsx' 'src/app/(tabs)/records.tsx' 'src/app/(tabs)/more.tsx'
git commit -m "refactor: use universal header on tabs"
```

---

### Task 3: Migrate youth, profile, and dashboard screens

**Files:**
- Modify: `src/app/youth-registry.tsx`
- Modify: `src/app/youth-profile.tsx`
- Modify: `src/app/youth-statistics.tsx`
- Modify: `src/app/add-youth.tsx`
- Modify: `src/app/edit-youth.tsx`
- Modify: `src/app/profile.tsx`
- Modify: `src/app/edit-profile.tsx`
- Modify: `src/app/profile-qr.tsx`
- Modify: `src/app/dashboard.tsx`

**Interfaces:**
- Consumes: `AppHeader`.
- Produces: fixed authenticated headers with Back on all nine screens.
- Youth Registry preserves its statistics/count badge through `right`.

- [ ] **Step 1: Confirm the youth/profile migration contract fails before editing**

```bash
node scripts/verify-universal-header.mjs --group youth_profile
```

Expected: FAIL on missing `AppHeader`, remaining `stickyHeaderIndices`, and old header styles.

- [ ] **Step 2: Apply the standard shell to each screen**

Use this structure on ordinary subscreens:

```tsx
<SafeAreaView
  style={styles.safeArea}
  edges={["left", "right", "bottom"]}
>
  <AppHeader title="SCREEN TITLE" showBack />

  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    {/* existing body only */}
  </ScrollView>
</SafeAreaView>
```

Use the existing titles: `Youth Profile`, `Youth Statistics`, `Add Youth`, `Edit Youth`, `My Profile`, `Edit Profile`, `My QR Code`, and `Dashboard`.

Remove the old page-header JSX, `stickyHeaderIndices`, `headerTitle`, and `headerSpacer` styles. Do not remove similarly named content styles that are still used by body sections.

- [ ] **Step 3: Preserve Youth Registry's count/statistics action in the right slot**

Move the existing count badge Pressable out of the old header and pass it to `AppHeader`:

```tsx
<AppHeader
  title="Youth Registry"
  showBack
  right={
    !isLoading ? (
      <Pressable
        style={({ pressed }) => [
          styles.headerCountBadge,
          pressed && styles.headerCountBadgePressed,
        ]}
        onPress={() => router.push("/youth-statistics")}
        accessibilityLabel="Open youth statistics"
      >
        <Text style={styles.headerCountText}>{filteredYouth.length}</Text>
      </Pressable>
    ) : null
  }
/>
```

Keep only the count-badge styles that remain referenced.

- [ ] **Step 4: Ensure loading/empty/restricted states render below the header**

If any screen currently returns a loading/error/restricted body early, keep the screen shell and `AppHeader` unconditional; move the condition inside the body container so the header never disappears.

- [ ] **Step 5: Verify and type-check**

```bash
node scripts/verify-universal-header.mjs --group youth_profile
npx tsc --noEmit
```

Expected: verifier passes; no new TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/youth-registry.tsx src/app/youth-profile.tsx src/app/youth-statistics.tsx src/app/add-youth.tsx src/app/edit-youth.tsx src/app/profile.tsx src/app/edit-profile.tsx src/app/profile-qr.tsx src/app/dashboard.tsx
git commit -m "refactor: unify youth and profile headers"
```

---

### Task 4: Migrate activity screens, including Upcoming Events and All Activity

**Files:**
- Modify: `src/app/activities.tsx`
- Modify: `src/app/upcoming-events.tsx`
- Modify: `src/app/activity-details.tsx`
- Modify: `src/app/activity-attendance.tsx`
- Modify: `src/app/activity-expenses.tsx`
- Modify: `src/app/activity-history.tsx`
- Modify: `src/app/activity-participants.tsx`
- Modify: `src/app/activity-summary.tsx`
- Modify: `src/app/create-activity.tsx`

**Interfaces:**
- Consumes: `AppHeader`.
- Activities keeps its count badge in `right`.
- Upcoming Events and All Activity use the exact same `AppHeader` geometry as Home, with Back enabled.

- [ ] **Step 1: Confirm the activity migration contract fails**

```bash
node scripts/verify-universal-header.mjs --group activities
```

Expected: FAIL because old local/sticky headers and two `RoundedTabHeader` usages remain.

- [ ] **Step 2: Migrate all activity screens to the fixed shell**

Use these titles:

- `Activities`
- `Upcoming Events`
- `Activity Details`
- `Attendance`
- `Event Expenses`
- `All Activity`
- `Participants`
- `Activity Summary`
- `Add Activity`

Every screen uses `showBack` because these are subscreens. `AppHeader` must sit outside the scroll/list content, including empty and loading states.

- [ ] **Step 3: Preserve the Activities count badge**

Use the existing count badge as:

```tsx
<AppHeader
  title="Activities"
  showBack
  right={
    !isLoading ? (
      <View style={styles.headerCountBadge}>
        <Text style={styles.headerCountText}>{activities.length}</Text>
      </View>
    ) : null
  }
/>
```

Remove only the old header wrapper/title/spacer styles; retain the badge styles used by the right slot.

- [ ] **Step 4: Verify the two previously inconsistent screens explicitly**

Check source structure:

```bash
grep -n "AppHeader" src/app/upcoming-events.tsx src/app/activity-history.tsx
grep -n "stickyHeaderIndices\|RoundedTabHeader" src/app/upcoming-events.tsx src/app/activity-history.tsx
```

Expected: first command finds `AppHeader`; second command prints nothing.

- [ ] **Step 5: Run the activity verifier and type-check**

```bash
node scripts/verify-universal-header.mjs --group activities
npx tsc --noEmit
```

Expected: verifier passes; no new TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/activities.tsx src/app/upcoming-events.tsx src/app/activity-details.tsx src/app/activity-attendance.tsx src/app/activity-expenses.tsx src/app/activity-history.tsx src/app/activity-participants.tsx src/app/activity-summary.tsx src/app/create-activity.tsx
git commit -m "refactor: unify activity headers"
```

---

### Task 5: Migrate meeting screens

**Files:**
- Modify: `src/app/meetings.tsx`
- Modify: `src/app/create-meeting.tsx`
- Modify: `src/app/meeting-details.tsx`
- Modify: `src/app/meeting-agenda.tsx`
- Modify: `src/app/meeting-attendance.tsx`
- Modify: `src/app/meeting-minutes.tsx`
- Modify: `src/app/meeting-resolutions.tsx`

**Interfaces:**
- Consumes: `AppHeader`.
- Meetings preserves its record-count badge in `right`.

- [ ] **Step 1: Confirm the meeting migration contract fails**

```bash
node scripts/verify-universal-header.mjs --group meetings
```

Expected: FAIL on old sticky/custom headers.

- [ ] **Step 2: Migrate all meeting screens to `AppHeader`**

Use these titles: `Meetings`, `Create Meeting`, `Meeting Details`, `Agenda`, `Attendance`, `Minutes`, `Resolutions`.

Every screen uses `showBack`. Remove page-header `stickyHeaderIndices` and old `headerTitle`/`headerSpacer` styles.

- [ ] **Step 3: Preserve the Meetings count badge**

```tsx
<AppHeader
  title="Meetings"
  showBack
  right={
    !isLoading ? (
      <View style={styles.headerCountBadge}>
        <Text style={styles.headerCountText}>{meetings.length}</Text>
      </View>
    ) : null
  }
/>
```

- [ ] **Step 4: Verify and type-check**

```bash
node scripts/verify-universal-header.mjs --group meetings
npx tsc --noEmit
```

Expected: verifier passes; no new TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/meetings.tsx src/app/create-meeting.tsx src/app/meeting-details.tsx src/app/meeting-agenda.tsx src/app/meeting-attendance.tsx src/app/meeting-minutes.tsx src/app/meeting-resolutions.tsx
git commit -m "refactor: unify meeting headers"
```

---

### Task 6: Migrate project screens

**Files:**
- Modify: `src/app/new-project.tsx`
- Modify: `src/app/edit-project.tsx`
- Modify: `src/app/project-details.tsx`
- Modify: `src/app/project-expenses.tsx`
- Modify: `src/app/project-participants.tsx`
- Modify: `src/app/add-project-expense.tsx`
- Modify: `src/app/add-project-participant.tsx`
- Modify: `src/app/archived-projects.tsx`

**Interfaces:**
- Consumes: `AppHeader`.
- `src/app/projects-report.tsx` remains redirect-only and is not given a header.

- [ ] **Step 1: Confirm the project migration contract fails**

```bash
node scripts/verify-universal-header.mjs --group projects
```

Expected: FAIL on old sticky/custom headers.

- [ ] **Step 2: Migrate the eight rendered project screens**

Use titles: `New Project`, `Edit Project`, `Project Details`, `Project Expenses`, `Project Participants`, `Add Project Expense`, `Add Participant`, `Archived Projects`.

Place `AppHeader` outside scrolling content and enable `showBack` on every screen. Preserve all edit/archive/participant/expense actions in the body unless an action already lived compactly inside the page header.

- [ ] **Step 3: Verify redirect-only route stays logic-only**

```bash
grep -n "AppHeader" src/app/projects-report.tsx
```

Expected: no output.

- [ ] **Step 4: Verify and type-check**

```bash
node scripts/verify-universal-header.mjs --group projects
npx tsc --noEmit
```

Expected: verifier passes; no new TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/new-project.tsx src/app/edit-project.tsx src/app/project-details.tsx src/app/project-expenses.tsx src/app/project-participants.tsx src/app/add-project-expense.tsx src/app/add-project-participant.tsx src/app/archived-projects.tsx
git commit -m "refactor: unify project headers"
```

---

### Task 7: Migrate finance and budget screens

**Files:**
- Modify: `src/app/expenses.tsx`
- Modify: `src/app/add-expense.tsx`
- Modify: `src/app/edit-expense.tsx`
- Modify: `src/app/expense-details.tsx`
- Modify: `src/app/budget-allocations.tsx`
- Modify: `src/app/add-budget-allocation.tsx`
- Modify: `src/app/budget-categories.tsx`
- Modify: `src/app/add-budget-category.tsx`
- Modify: `src/app/budget-balance.tsx`

**Interfaces:**
- Consumes: `AppHeader`.

- [ ] **Step 1: Confirm the finance/budget migration contract fails**

```bash
node scripts/verify-universal-header.mjs --group finance_budget
```

Expected: FAIL on old sticky/custom headers.

- [ ] **Step 2: Migrate all nine screens**

Use titles: `Expenses`, `Add Expense`, `Edit Expense`, `Expense Details`, `Budget Allocations`, `Add Budget Allocation`, `Budget Categories`, `Add Budget Category`, `Budget Balance`.

Each uses `showBack`; the header is outside scrolling content. Preserve existing date pickers, validation, expense calculations, allocations, categories, and save/delete behavior unchanged.

- [ ] **Step 3: Verify and type-check**

```bash
node scripts/verify-universal-header.mjs --group finance_budget
npx tsc --noEmit
```

Expected: verifier passes; no new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/expenses.tsx src/app/add-expense.tsx src/app/edit-expense.tsx src/app/expense-details.tsx src/app/budget-allocations.tsx src/app/add-budget-allocation.tsx src/app/budget-categories.tsx src/app/add-budget-category.tsx src/app/budget-balance.tsx
git commit -m "refactor: unify finance and budget headers"
```

---

### Task 8: Migrate documents and inventory screens

**Files:**
- Modify: `src/app/documents.tsx`
- Modify: `src/app/add-document.tsx`
- Modify: `src/app/edit-document.tsx`
- Modify: `src/app/document-details.tsx`
- Modify: `src/app/inventory.tsx`
- Modify: `src/app/add-inventory-item.tsx`
- Modify: `src/app/inventory-borrow.tsx`
- Modify: `src/app/inventory-condition.tsx`
- Modify: `src/app/inventory-history.tsx`
- Modify: `src/app/inventory-item-details.tsx`
- Modify: `src/app/inventory-quantity.tsx`
- Modify: `src/app/inventory-return.tsx`

**Interfaces:**
- Consumes: `AppHeader`.
- Documents and Inventory preserve their count badges in `right`.

- [ ] **Step 1: Confirm the documents/inventory migration contract fails**

```bash
node scripts/verify-universal-header.mjs --group documents_inventory
```

Expected: FAIL on old sticky/custom headers.

- [ ] **Step 2: Migrate document screens**

Use titles: `Documents`, `Add Document`, `Edit Document`, `Document Details`.

For `Documents`, move the existing count badge to:

```tsx
<AppHeader
  title="Documents"
  showBack
  right={
    !isLoading ? (
      <View style={styles.headerCountBadge}>
        <Text style={styles.headerCountText}>{documents.length}</Text>
      </View>
    ) : null
  }
/>
```

- [ ] **Step 3: Migrate inventory screens**

Use titles: `Inventory`, `Add Item`, `Borrow Item`, `Condition`, `Inventory History`, `Item Details`, `Quantity`, `Return Item`.

For `Inventory`, move the existing count badge to:

```tsx
<AppHeader
  title="Inventory"
  showBack
  right={
    !isLoading ? (
      <View style={styles.headerCountBadge}>
        <Text style={styles.headerCountText}>{items.length}</Text>
      </View>
    ) : null
  }
/>
```

- [ ] **Step 4: Verify and type-check**

```bash
node scripts/verify-universal-header.mjs --group documents_inventory
npx tsc --noEmit
```

Expected: verifier passes; no new TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/documents.tsx src/app/add-document.tsx src/app/edit-document.tsx src/app/document-details.tsx src/app/inventory.tsx src/app/add-inventory-item.tsx src/app/inventory-borrow.tsx src/app/inventory-condition.tsx src/app/inventory-history.tsx src/app/inventory-item-details.tsx src/app/inventory-quantity.tsx src/app/inventory-return.tsx
git commit -m "refactor: unify document and inventory headers"
```

---

### Task 9: Migrate settings, data, security, reporting, QR, and support screens

**Files:**
- Modify: `src/app/app-settings.tsx`
- Modify: `src/app/app-update.tsx`
- Modify: `src/app/backup-data.tsx`
- Modify: `src/app/restore-data.tsx`
- Modify: `src/app/import-data.tsx`
- Modify: `src/app/export-data.tsx`
- Modify: `src/app/data-management.tsx`
- Modify: `src/app/data-privacy.tsx`
- Modify: `src/app/data-transfer-history.tsx`
- Modify: `src/app/security-audit.tsx`
- Modify: `src/app/reports.tsx`
- Modify: `src/app/report-viewer.tsx`
- Modify: `src/app/official-data-qr.tsx`
- Modify: `src/app/public-data-qr.tsx`
- Modify: `src/app/receive-data-qr.tsx`
- Modify: `src/app/support-feedback.tsx`

**Interfaces:**
- Consumes: `AppHeader`.
- Security & Audit preserves Refresh in the right slot.
- Report Viewer uses a dynamic title without shifting the center zone.

- [ ] **Step 1: Confirm the final feature-group migration contract fails**

```bash
node scripts/verify-universal-header.mjs --group data_settings_reports
```

Expected: FAIL on old sticky/custom headers.

- [ ] **Step 2: Migrate standard screens**

Use titles: `App Settings`, `App Updates`, `Backup`, `Restore`, `Import Data`, `Export Data`, `Data Management`, `Data & Privacy`, `Transfer History`, `Reports`, `Officials QR`, `Public QR`, `Receive / Scan`, `Support & Feedback`.

Each uses `showBack`; keep header outside all content states.

- [ ] **Step 3: Preserve Security & Audit refresh as a right-side action**

Replace the old left placeholder/title/right refresh row with:

```tsx
<AppHeader
  title="Security & Audit"
  showBack
  right={
    <Pressable
      style={styles.refreshButton}
      onPress={load}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel="Refresh security audit"
    >
      <Ionicons
        name="refresh-outline"
        size={22}
        color={isLoading ? "rgba(255,255,255,0.55)" : colors.white}
      />
    </Pressable>
  }
/>
```

Keep the existing `load` function and loading state unchanged.

- [ ] **Step 4: Preserve Report Viewer dynamic title**

Use:

```tsx
<AppHeader
  title={report?.title || "Report"}
  showBack
/>
```

Render this header even while report data is loading or unavailable; body state changes happen below it.

- [ ] **Step 5: Verify and type-check**

```bash
node scripts/verify-universal-header.mjs --group data_settings_reports
npx tsc --noEmit
```

Expected: verifier passes; no new TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/app-settings.tsx src/app/app-update.tsx src/app/backup-data.tsx src/app/restore-data.tsx src/app/import-data.tsx src/app/export-data.tsx src/app/data-management.tsx src/app/data-privacy.tsx src/app/data-transfer-history.tsx src/app/security-audit.tsx src/app/reports.tsx src/app/report-viewer.tsx src/app/official-data-qr.tsx src/app/public-data-qr.tsx src/app/receive-data-qr.tsx src/app/support-feedback.tsx
git commit -m "refactor: unify settings and data headers"
```

---

### Task 10: Remove old global header chrome and legacy component

**Files:**
- Modify: `src/app/_layout.tsx`
- Delete: `src/components/RoundedTabHeader.tsx`

**Interfaces:**
- Consumes: all migrated screens from Tasks 2-9.
- Produces: root layout responsible only for database setup, immersive system bars, Stack, StatusBar, and app update manager; header/back chrome is screen-owned through `AppHeader`.

- [ ] **Step 1: Confirm the layout cleanup contract fails before cleanup**

```bash
node scripts/verify-universal-header.mjs --layout
```

Expected: FAIL because `TopHeaderBackdrop`, `FloatingBackButton`, route allowlists, and `RoundedTabHeader.tsx` still exist.

- [ ] **Step 2: Simplify imports in `src/app/_layout.tsx`**

Remove imports used only by the old global header/back overlays:

```tsx
// remove
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
```

Keep the required imports in this shape:

```tsx
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
```

- [ ] **Step 3: Remove old overlay code and leave immersive behavior unchanged**

Delete:

- `ROOT_ROUTES_WITHOUT_BACK`
- `ROUTES_WITHOUT_BLUE_CHROME`
- `TopHeaderBackdrop`
- `FloatingBackButton`
- `<TopHeaderBackdrop />`
- `<FloatingBackButton />`
- the old root `styles` object

Keep:

```tsx
<SafeAreaProvider>
  <StatusBar hidden animated style="light" />
  <AppUpdateManager />
  <Stack
    screenOptions={{
      headerShown: false,
      animation: "fade",
    }}
  />
</SafeAreaProvider>
```

Do not alter `enableImmersiveMode()`.

- [ ] **Step 4: Prove no `RoundedTabHeader` imports remain before deleting it**

```bash
grep -Rni --include='*.tsx' "RoundedTabHeader" src/app src/components
```

Expected: only `src/components/RoundedTabHeader.tsx` itself is returned.

- [ ] **Step 5: Delete the legacy component and run layout verification**

```bash
rm src/components/RoundedTabHeader.tsx
node scripts/verify-universal-header.mjs --layout
```

Expected: `Universal header verification passed.`

- [ ] **Step 6: Type-check and commit**

```bash
npx tsc --noEmit
git add src/app/_layout.tsx src/components/RoundedTabHeader.tsx
git commit -m "refactor: remove legacy header chrome"
```

Expected: no new TypeScript errors and commit succeeds with the deleted file staged.

---

### Task 11: Whole-app static regression verification

**Files:**
- Test: `scripts/verify-universal-header.mjs`
- Inspect: all `src/**/*.ts` and `src/**/*.tsx`

**Interfaces:**
- Consumes: completed migration.
- Produces: evidence that every intended screen uses the shared header and excluded screens remain untouched.

- [ ] **Step 1: Run the complete universal-header contract**

```bash
node scripts/verify-universal-header.mjs --all
```

Expected: `Universal header verification passed.`

- [ ] **Step 2: Run TypeScript verification**

```bash
npx tsc --noEmit
```

Expected: exit 0, or exactly the documented pre-existing baseline errors with no new header-related errors.

- [ ] **Step 3: Run source scans for forbidden legacy patterns**

```bash
grep -Rni --include='*.tsx' "RoundedTabHeader\|TopHeaderBackdrop\|FloatingBackButton\|stickyHeaderIndices" src/app src/components || true
```

Expected: no output for post-login header code.

Run:

```bash
grep -Rni --include='*.tsx' "AppHeader" src/app/login.tsx src/app/register.tsx src/app/recovery.tsx src/app/profile-setup.tsx src/app/founding-official-setup.tsx src/app/official-verification.tsx || true
```

Expected: no output.

- [ ] **Step 4: Confirm no accidental database or route changes are staged**

```bash
git diff -- src/database src/services src/app/'(tabs)'/_layout.tsx
```

Expected: no database/service changes and no bottom-tab-layout changes from this migration.

- [ ] **Step 5: Commit any verifier-only corrections if needed**

If Task 11 required a correction to the verifier itself, commit only that file:

```bash
git add scripts/verify-universal-header.mjs
git commit -m "test: strengthen universal header verification"
```

If no correction was needed, do not create an empty commit.

---

### Task 12: On-device visual and behavioral verification

**Files:**
- No source change expected.
- Test on the current Android Dev Build through Metro.

**Interfaces:**
- Consumes: final TypeScript source.
- Produces: human-visible evidence that the header behaves correctly under real safe-area, scrolling, navigation, and immersive-system-bar conditions.

- [ ] **Step 1: Start Metro with a clean cache**

```bash
npx expo start --dev-client -c
```

Expected: Metro starts and the existing Dev Build connects; no new Dev Build is required.

- [ ] **Step 2: Verify main tab headers**

Check Home, Projects, Finance, Records, More.

Expected on each:

- identical blue/header height/radius/shadow
- no Back button
- title physically centered
- header does not move while body scrolls
- bottom tab navigation unchanged

- [ ] **Step 3: Verify representative subscreens**

Check:

1. Records -> Youth Registry
2. Home -> Upcoming Events
3. Records -> Activities -> All Activity
4. More -> Security & Audit
5. Add Youth
6. Project Details

Expected:

- Back control stays inside the blue header
- centered title does not shift when count/Refresh is present
- header remains visible in loading/empty/populated states
- no blue strip/gap above Upcoming Events or All Activity
- body scrolls below a stationary header

- [ ] **Step 4: Verify temporary system-bar reveal**

Swipe down from the top and up from the bottom to reveal Android system UI transiently.

Expected:

- top revealed area remains visually blue/seamless with the header
- no page wallpaper/background strip appears above the header
- bottom navigation remains usable after system controls hide again

- [ ] **Step 5: Verify Back behavior**

Open Add Youth, Budget Categories, Security & Audit, Project Details, and a QR/data screen; tap the header Back button.

Expected: each returns to its previous screen exactly as before. Any screen with custom `onBackPress` retains its original custom behavior.

- [ ] **Step 6: Record final verification state**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: working tree clean after all intended commits, with the universal-header migration commits visible.

---

## Self-Review Results

- **Spec coverage:** Every section of the approved design is mapped to Tasks 1-12: component API/visual standard, safe area, true centering, Back navigation, scrolling, five tabs, all 70 rendered operational subscreens plus five tabs, special right-side content, exclusions, legacy cleanup, static checks, and on-device checks.
- **Redirect clarification:** `projects-report.tsx` is intentionally left headerless because it only returns `<Redirect>` and never renders a visible screen; this follows the spec's intent for non-rendering bootstrap/redirect routes.
- **Placeholder scan:** No TBD/TODO/"implement later" instructions remain.
- **Type consistency:** `AppHeaderProps`, `showBack`, `onBackPress`, `left`, and `right` are named consistently throughout all tasks.
- **Scope check:** This remains one coherent subsystem refactor: authenticated application chrome. No database, authorization, routing-destination, bottom-navigation, or native-module redesign is included.
