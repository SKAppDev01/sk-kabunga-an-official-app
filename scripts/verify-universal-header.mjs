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
  for (const needle of required) assert(text.includes(needle), `${rel}: missing ${needle}`);
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
if (args.includes("--component")) checkComponent();
else if (args.includes("--layout")) checkLayout();
else if (args.includes("--group")) { const index = args.indexOf("--group"); checkGroup(args[index + 1]); }
else if (args.includes("--all")) { checkComponent(); for (const name of Object.keys(GROUPS)) checkGroup(name); checkLayout(); }
else { console.error("Usage: node scripts/verify-universal-header.mjs --component | --group <name> | --layout | --all"); process.exit(2); }

if (failures.length > 0) {
  console.error(`Universal header verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Universal header verification passed.");
